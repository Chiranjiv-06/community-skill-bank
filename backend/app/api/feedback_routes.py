"""
app/api/feedback_routes.py

Trust, Contributions & Feedback APIs for Community Skill Bank.
Supports post-mission performance evaluations, volunteer contribution summaries,
dynamic skill verification, and deterministic reliability tier calculations.
"""

from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.sql import func

from app.database.dependencies import get_db
from app.models.models import Emergency, Skill
from app.models.emergency_assignment import EmergencyAssignment
from app.models.assignment_feedback import AssignmentFeedback
from app.models.volunteer_certification import VolunteerCertification
from app.models.volunteer_training import VolunteerTraining
from app.models.user import User
from app.schemas.schemas import (
    AssignmentFeedbackCreate,
    AdminFeedbackUpdate,
    AssignmentFeedbackOut,
    VolunteerMissionContributionOut,
    VolunteerTrustSummary,
    VolunteerTrustProfile,
)
from app.utils.security import get_current_user, get_current_admin
from app.services.notification_service import NotificationService

router = APIRouter(tags=["Trust, Contributions & Feedback"])


def _calculate_trust_summary(db: Session, user: User) -> tuple[VolunteerTrustSummary, List[str]]:
    """Helper to compute deterministic, explainable trust summary and verified skill names."""
    today = date.today()

    # 1. Completed missions (from EmergencyAssignment, NOT feedback count)
    completed_missions = (
        db.query(EmergencyAssignment)
        .filter(
            EmergencyAssignment.volunteer_id == user.id,
            EmergencyAssignment.status == "completed",
        )
        .count()
    )

    # 2. Feedbacks, ratings, and verified service hours
    feedbacks = (
        db.query(AssignmentFeedback)
        .filter(AssignmentFeedback.volunteer_id == user.id)
        .all()
    )
    rated_missions = len(feedbacks)
    total_verified_hours = sum(f.hours_served for f in feedbacks)
    average_rating = (
        round(sum(f.rating for f in feedbacks) / rated_missions, 2)
        if rated_missions > 0
        else None
    )

    # 3. Active, non-expired verified certifications
    active_certs = (
        db.query(VolunteerCertification)
        .filter(
            VolunteerCertification.user_id == user.id,
            VolunteerCertification.verification_status == "verified",
        )
        .all()
    )
    # Filter out expired certs
    valid_active_certs = [
        c for c in active_certs
        if c.expiry_date is None or c.expiry_date >= today
    ]
    active_verified_certifications = len(valid_active_certs)

    # 4. Verified training hours
    verified_trainings = (
        db.query(VolunteerTraining)
        .filter(
            VolunteerTraining.user_id == user.id,
            VolunteerTraining.status == "verified",
        )
        .all()
    )
    verified_training_hours = sum(t.hours_completed for t in verified_trainings)

    # 5. Dynamically verified skills (skills linked to active, valid verified certifications)
    user_skills = (
        db.query(Skill)
        .filter(Skill.owner_id == user.id)
        .all()
    )
    verified_skill_ids = {c.skill_id for c in valid_active_certs if c.skill_id is not None}
    verified_skill_names = [s.title for s in user_skills if s.id in verified_skill_ids]
    verified_skills_count = len(verified_skill_names)

    # 6. Deterministic Reliability Tier Classification
    if (
        completed_missions >= 10
        and average_rating is not None
        and average_rating >= 4.5
        and active_verified_certifications >= 2
    ):
        reliability_tier = "Elite Responder"
    elif (
        completed_missions >= 3
        and average_rating is not None
        and average_rating >= 4.0
        and active_verified_certifications >= 1
    ):
        reliability_tier = "Trusted Responder"
    elif completed_missions >= 1:
        reliability_tier = "Active Responder"
    elif (
        active_verified_certifications >= 1
        or verified_training_hours >= 8
    ):
        reliability_tier = "Verified Credentialed"
    else:
        reliability_tier = "New"

    summary = VolunteerTrustSummary(
        volunteer_id=user.id,
        volunteer_name=user.full_name,
        role=user.role,
        completed_missions=completed_missions,
        rated_missions=rated_missions,
        average_rating=average_rating,
        total_verified_hours=round(total_verified_hours, 2),
        active_verified_certifications=active_verified_certifications,
        verified_training_hours=verified_training_hours,
        verified_skills_count=verified_skills_count,
        reliability_tier=reliability_tier,
    )
    return summary, verified_skill_names


def _populate_feedback_out(fb: AssignmentFeedback) -> AssignmentFeedbackOut:
    """Helper to populate denormalized context names for feedback response."""
    u = fb.volunteer
    em = fb.emergency
    sub = fb.submitted_by

    return AssignmentFeedbackOut(
        id=fb.id,
        assignment_id=fb.assignment_id,
        emergency_id=fb.emergency_id,
        volunteer_id=fb.volunteer_id,
        submitted_by_id=fb.submitted_by_id,
        rating=fb.rating,
        hours_served=fb.hours_served,
        feedback_notes=fb.feedback_notes,
        created_at=fb.created_at,
        updated_at=fb.updated_at,
        volunteer_name=u.full_name if u else None,
        emergency_title=em.title if em else None,
        submitter_name=sub.full_name if sub else None,
    )


# ---------------------------------------------------------------------------
# 1. Feedback Submission & Retrieval Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/api/emergencies/{emergency_id}/assignments/{assignment_id}/feedback",
    response_model=AssignmentFeedbackOut,
    status_code=status.HTTP_201_CREATED,
    summary="Submit performance evaluation and hours for a completed emergency assignment",
)
def create_assignment_feedback(
    emergency_id: int,
    assignment_id: int,
    payload: AssignmentFeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit supervisor feedback on a completed assignment.
    - Restricted to emergency reporter or platform administrator.
    - Assignment must belong to the emergency and be in 'completed' status.
    - Derived: volunteer_id, emergency_id, submitted_by_id (client cannot inject).
    - Exactly one feedback record per assignment (duplicate returns 409 Conflict).
    """
    emergency = db.query(Emergency).filter(Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency not found",
        )

    # Authorization check
    if emergency.reporter_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to submit feedback for this emergency assignment",
        )

    assignment = (
        db.query(EmergencyAssignment)
        .options(
            joinedload(EmergencyAssignment.volunteer),
            joinedload(EmergencyAssignment.emergency),
        )
        .filter(
            EmergencyAssignment.id == assignment_id,
            EmergencyAssignment.emergency_id == emergency_id,
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency assignment not found for this incident",
        )

    # State guard: Only completed assignments qualify for feedback
    if assignment.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Feedback can only be submitted for completed assignments. Current status: '{assignment.status}'.",
        )

    # Check for duplicate feedback
    existing = (
        db.query(AssignmentFeedback)
        .filter(AssignmentFeedback.assignment_id == assignment_id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Feedback has already been submitted for this assignment",
        )

    new_feedback = AssignmentFeedback(
        assignment_id=assignment_id,
        emergency_id=emergency_id,
        volunteer_id=assignment.volunteer_id,
        submitted_by_id=current_user.id,
        rating=payload.rating,
        hours_served=payload.hours_served,
        feedback_notes=payload.feedback_notes.strip() if payload.feedback_notes else None,
    )

    db.add(new_feedback)
    db.flush()

    if assignment.volunteer_id != current_user.id:
        NotificationService.create_notification(
            db=db,
            user_id=assignment.volunteer_id,
            title="Performance Feedback Received",
            message=f"You received a {payload.rating}/5 rating and {payload.hours_served} verified service hours for emergency: {emergency.title}.",
            type="feedback_received",
            severity="success",
            related_entity_type="assignment_feedback",
            related_entity_id=new_feedback.id,
            auto_commit=False,
        )

    db.commit()
    db.refresh(new_feedback)

    fb = (
        db.query(AssignmentFeedback)
        .options(
            joinedload(AssignmentFeedback.volunteer),
            joinedload(AssignmentFeedback.emergency),
            joinedload(AssignmentFeedback.submitted_by),
        )
        .filter(AssignmentFeedback.id == new_feedback.id)
        .first()
    )
    return _populate_feedback_out(fb)


@router.get(
    "/api/emergencies/{emergency_id}/assignments/{assignment_id}/feedback",
    response_model=AssignmentFeedbackOut,
    summary="Retrieve feedback details for an emergency assignment",
)
def get_assignment_feedback(
    emergency_id: int,
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve feedback details for an assignment.
    - Accessible by: evaluated volunteer, emergency reporter, or administrator.
    """
    emergency = db.query(Emergency).filter(Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency not found",
        )

    feedback = (
        db.query(AssignmentFeedback)
        .options(
            joinedload(AssignmentFeedback.volunteer),
            joinedload(AssignmentFeedback.emergency),
            joinedload(AssignmentFeedback.submitted_by),
        )
        .filter(
            AssignmentFeedback.assignment_id == assignment_id,
            AssignmentFeedback.emergency_id == emergency_id,
        )
        .first()
    )

    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found for this assignment",
        )

    # Authorization: Evaluated volunteer, Emergency reporter, or Admin only
    is_evaluated_vol = (feedback.volunteer_id == current_user.id)
    is_reporter = (emergency.reporter_id == current_user.id)
    is_admin = (current_user.role == "admin")

    if not (is_evaluated_vol or is_reporter or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view feedback for this assignment",
        )

    return _populate_feedback_out(feedback)


@router.patch(
    "/api/admin/feedbacks/{feedback_id}",
    response_model=AssignmentFeedbackOut,
    summary="Administrator correction of a feedback record",
)
def admin_update_feedback(
    feedback_id: int,
    payload: AdminFeedbackUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """
    Allow platform administrator to correct feedback ratings, hours served, or notes.
    Immutable relational fields cannot be altered.
    """
    fb = (
        db.query(AssignmentFeedback)
        .options(
            joinedload(AssignmentFeedback.volunteer),
            joinedload(AssignmentFeedback.emergency),
            joinedload(AssignmentFeedback.submitted_by),
        )
        .filter(AssignmentFeedback.id == feedback_id)
        .first()
    )

    if not fb:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback record not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(fb, field, value)

    db.commit()
    db.refresh(fb)
    return _populate_feedback_out(fb)


# ---------------------------------------------------------------------------
# 2. Volunteer Contribution History & Trust Summary Endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/api/contributions/mine",
    response_model=List[VolunteerMissionContributionOut],
    summary="List all completed mission records and feedback for the current volunteer",
)
def list_my_contributions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve all completed mission history for the authenticated volunteer.
    Includes completed assignments even when no supervisor feedback has been submitted.
    """
    assignments = (
        db.query(EmergencyAssignment)
        .options(
            joinedload(EmergencyAssignment.emergency),
            joinedload(EmergencyAssignment.feedback),
        )
        .filter(
            EmergencyAssignment.volunteer_id == current_user.id,
            EmergencyAssignment.status == "completed",
        )
        .order_by(EmergencyAssignment.completed_at.desc())
        .all()
    )

    contributions: List[VolunteerMissionContributionOut] = []
    for a in assignments:
        fb = a.feedback
        em = a.emergency
        contributions.append(
            VolunteerMissionContributionOut(
                assignment_id=a.id,
                emergency_id=a.emergency_id,
                emergency_title=em.title if em else "Emergency Incident",
                status=a.status,
                deployed_at=a.deployed_at,
                completed_at=a.completed_at,
                feedback_id=fb.id if fb else None,
                rating=fb.rating if fb else None,
                hours_served=fb.hours_served if fb else None,
                feedback_notes=fb.feedback_notes if fb else None,
            )
        )

    return contributions


@router.get(
    "/api/contributions/summary",
    response_model=VolunteerTrustSummary,
    summary="Get aggregated trust & reliability summary for the current volunteer",
)
def get_my_trust_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve explainable trust, service hours, and reliability tier metrics for current volunteer."""
    summary, _ = _calculate_trust_summary(db, current_user)
    return summary


@router.get(
    "/api/volunteers/{volunteer_id}/trust-profile",
    response_model=VolunteerTrustProfile,
    summary="Get protected trust and credential profile of a volunteer (authorized inspection)",
)
def get_volunteer_trust_profile(
    volunteer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve structured trust metrics and verified skills for an active volunteer.
    - Not public: Accessible by the volunteer themselves, an administrator,
      or an emergency reporter managing incident assignments.
    """
    target_user = db.query(User).filter(User.id == volunteer_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer not found",
        )

    # Authorization: Self, Admin, or Incident Reporter
    is_self = (current_user.id == volunteer_id)
    is_admin = (current_user.role == "admin")

    # Check if current user is a reporter with active assignments for this volunteer
    is_authorized_reporter = False
    if not (is_self or is_admin):
        matching_assignment = (
            db.query(EmergencyAssignment)
            .join(Emergency, EmergencyAssignment.emergency_id == Emergency.id)
            .filter(
                EmergencyAssignment.volunteer_id == volunteer_id,
                Emergency.reporter_id == current_user.id,
            )
            .first()
        )
        if matching_assignment:
            is_authorized_reporter = True

    if not (is_self or is_admin or is_authorized_reporter):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this volunteer's trust profile",
        )

    summary, verified_skill_names = _calculate_trust_summary(db, target_user)

    return VolunteerTrustProfile(
        volunteer_id=target_user.id,
        full_name=target_user.full_name,
        role=target_user.role,
        location=target_user.location,
        trust_summary=summary,
        verified_skills=verified_skill_names,
        recent_missions_count=summary.completed_missions,
    )
