"""
app/api/assignment_routes.py

Response & Assignment Lifecycle APIs for Community Skill Bank.
Supports volunteer self-service applications, authority dispatch, requirement fulfillment,
and deterministic lifecycle state transitions.
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from sqlalchemy.sql import func

from app.database.dependencies import get_db
from app.models.models import Emergency
from app.models.emergency_requirement import EmergencyRequirement
from app.models.emergency_assignment import EmergencyAssignment
from app.models.user import User
from app.schemas.schemas import (
    VolunteerRespondRequest,
    AuthorityAssignmentCreate,
    AuthorityAssignmentUpdate,
    VolunteerProgressUpdate,
    AssignmentOut,
    RequirementFulfillmentMetric,
    EmergencyAssignmentsOverview,
)
from app.utils.security import get_current_user
from app.services.location_service import ELIGIBLE_VOLUNTEER_ROLES
from app.services.notification_service import NotificationService
from app.services.audit_service import AuditService

router = APIRouter(tags=["Response & Assignment Lifecycle"])


def _populate_assignment_out(assignment: EmergencyAssignment) -> AssignmentOut:
    """Helper to populate denormalized fields on AssignmentOut for clear client consumption."""
    vol = assignment.volunteer
    req = assignment.requirement
    em = assignment.emergency

    return AssignmentOut(
        id=assignment.id,
        emergency_id=assignment.emergency_id,
        volunteer_id=assignment.volunteer_id,
        requirement_id=assignment.requirement_id,
        status=assignment.status,
        assigned_by_id=assignment.assigned_by_id,
        match_score_at_assignment=assignment.match_score_at_assignment,
        volunteer_notes=assignment.volunteer_notes,
        admin_notes=assignment.admin_notes,
        responded_at=assignment.responded_at,
        deployed_at=assignment.deployed_at,
        completed_at=assignment.completed_at,
        cancelled_at=assignment.cancelled_at,
        created_at=assignment.created_at,
        updated_at=assignment.updated_at,
        volunteer_name=vol.full_name if vol else None,
        volunteer_email=vol.email if vol else None,
        volunteer_phone=vol.phone if vol else None,
        volunteer_role=vol.role if vol else None,
        emergency_title=em.title if em else None,
        requirement_category=req.skill_category if req else None,
        requirement_title=req.skill_title if req else None,
    )


# ---------------------------------------------------------------------------
# 1. Volunteer Self-Service Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/api/emergencies/{emergency_id}/respond",
    response_model=AssignmentOut,
    summary="Volunteer self-application or response to an emergency invitation",
)
def volunteer_respond_to_emergency(
    emergency_id: int,
    payload: VolunteerRespondRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Allow a volunteer to self-apply or respond to an emergency incident.
    - Volunteer role must be eligible (skilled_volunteer, citizen_volunteer, volunteer).
    - Emergency must exist and not be in a resolved or cancelled state.
    - Self-application defaults to 'pending'.
    - If an invitation exists in 'pending', volunteer can respond with 'accepted' or 'rejected'.
    - Volunteers can NEVER self-transition to 'assigned'.
    """
    if current_user.role not in ELIGIBLE_VOLUNTEER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only registered volunteers can respond to emergencies",
        )

    emergency = db.query(Emergency).filter(Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency not found",
        )

    if emergency.status in ["resolved", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot respond to an emergency that is {emergency.status}",
        )

    # Check for existing record
    assignment = (
        db.query(EmergencyAssignment)
        .options(
            joinedload(EmergencyAssignment.volunteer),
            joinedload(EmergencyAssignment.requirement),
            joinedload(EmergencyAssignment.emergency),
        )
        .filter(
            EmergencyAssignment.emergency_id == emergency_id,
            EmergencyAssignment.volunteer_id == current_user.id,
        )
        .first()
    )

    now = datetime.now()

    if not assignment:
        # Fresh self-application -> status is always 'pending'
        target_status = "pending"
        responded_at = now if payload.status in ["accepted", "rejected"] else None

        assignment = EmergencyAssignment(
            emergency_id=emergency_id,
            volunteer_id=current_user.id,
            status=target_status,
            volunteer_notes=payload.volunteer_notes,
            responded_at=responded_at,
        )
        db.add(assignment)
        try:
            db.commit()
            db.refresh(assignment)
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Volunteer assignment record already exists for this emergency",
            )
        AuditService.record_event(
            db=db,
            action="ASSIGNMENT_STATUS_CHANGE",
            entity_type="emergency_assignment",
            entity_id=assignment.id,
            actor_user_id=current_user.id,
            outcome="success",
            metadata={"assignment_id": assignment.id, "new_status": target_status},
        )
        return _populate_assignment_out(assignment)

    # Existing assignment record handling
    if assignment.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already completed your assignment for this emergency",
        )

    if assignment.status in ["assigned", "in_progress"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"You are already actively {assignment.status} to this emergency",
        )

    if assignment.status == "pending":
        if payload.status in ["accepted", "rejected"]:
            assignment.status = payload.status
            assignment.responded_at = now
        else:
            assignment.status = "pending"
        if payload.volunteer_notes:
            assignment.volunteer_notes = payload.volunteer_notes

    elif assignment.status in ["rejected", "cancelled"]:
        # Re-application: reset to pending
        assignment.status = "pending"
        assignment.responded_at = now if payload.status == "accepted" else None
        if payload.volunteer_notes:
            assignment.volunteer_notes = payload.volunteer_notes

    elif assignment.status == "accepted":
        # Volunteer withdrawing from accepted state
        if payload.status == "rejected":
            assignment.status = "rejected"
            assignment.responded_at = now
        if payload.volunteer_notes:
            assignment.volunteer_notes = payload.volunteer_notes

    target_notif_user = emergency.reporter_id if (emergency and emergency.reporter_id != current_user.id) else assignment.assigned_by_id
    if target_notif_user and target_notif_user != current_user.id and payload.status in ["accepted", "rejected"]:
        NotificationService.create_notification(
            db=db,
            user_id=target_notif_user,
            title=f"Volunteer {payload.status.title()} Assignment",
            message=f"Volunteer {current_user.full_name} has {payload.status} the assignment for emergency: {emergency.title}.",
            type="assignment_update",
            severity="info",
            related_entity_type="emergency_assignment",
            related_entity_id=assignment.id,
            auto_commit=False,
        )

    db.commit()
    db.refresh(assignment)
    AuditService.record_event(
        db=db,
        action="ASSIGNMENT_STATUS_CHANGE",
        entity_type="emergency_assignment",
        entity_id=assignment.id,
        actor_user_id=current_user.id,
        outcome="success",
        metadata={"assignment_id": assignment.id, "new_status": assignment.status},
    )
    return _populate_assignment_out(assignment)


@router.get(
    "/api/assignments/mine",
    response_model=List[AssignmentOut],
    summary="List all emergency assignments and invitations for the current volunteer",
)
def list_my_assignments(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by assignment status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve all assignments, invitations, and application history for the authenticated volunteer.
    """
    query = (
        db.query(EmergencyAssignment)
        .options(
            joinedload(EmergencyAssignment.volunteer),
            joinedload(EmergencyAssignment.requirement),
            joinedload(EmergencyAssignment.emergency),
        )
        .filter(EmergencyAssignment.volunteer_id == current_user.id)
    )

    if status_filter:
        query = query.filter(EmergencyAssignment.status == status_filter)

    assignments = query.order_by(EmergencyAssignment.updated_at.desc()).all()
    return [_populate_assignment_out(a) for a in assignments]


@router.patch(
    "/api/assignments/{assignment_id}/progress",
    response_model=AssignmentOut,
    summary="Volunteer update of operational progress (on-scene check-in or mission completion)",
)
def volunteer_update_progress(
    assignment_id: int,
    payload: VolunteerProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Allow an assigned volunteer to check-in on-scene ('assigned' -> 'in_progress')
    or mark their assignment completed ('in_progress' -> 'completed').
    """
    assignment = (
        db.query(EmergencyAssignment)
        .options(
            joinedload(EmergencyAssignment.volunteer),
            joinedload(EmergencyAssignment.requirement),
            joinedload(EmergencyAssignment.emergency),
        )
        .filter(EmergencyAssignment.id == assignment_id)
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )

    # Authorization: only the assigned volunteer can progress their assignment
    if assignment.volunteer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update another volunteer's assignment progress",
        )

    emergency = assignment.emergency
    if emergency and emergency.status in ["resolved", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update progress for an emergency that is {emergency.status}",
        )

    now = datetime.now()
    target = payload.target_status

    if target == "in_progress":
        if assignment.status != "assigned":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot transition to 'in_progress' from '{assignment.status}'. Current status must be 'assigned'.",
            )
        assignment.status = "in_progress"
        assignment.deployed_at = now

    elif target == "completed":
        if assignment.status != "in_progress":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot transition to 'completed' from '{assignment.status}'. Current status must be 'in_progress'.",
            )
        assignment.status = "completed"
        assignment.completed_at = now

    if payload.volunteer_notes:
        assignment.volunteer_notes = payload.volunteer_notes

    target_notif_user = emergency.reporter_id if (emergency and emergency.reporter_id != current_user.id) else assignment.assigned_by_id
    if target_notif_user and target_notif_user != current_user.id:
        NotificationService.create_notification(
            db=db,
            user_id=target_notif_user,
            title=f"Assignment Progress: {target.replace('_', ' ').title()}",
            message=f"Volunteer {current_user.full_name} updated assignment progress to '{target}' for emergency: {emergency.title if emergency else 'Incident'}.",
            type="assignment_update",
            severity="info",
            related_entity_type="emergency_assignment",
            related_entity_id=assignment.id,
            auto_commit=False,
        )

    db.commit()
    db.refresh(assignment)
    AuditService.record_event(
        db=db,
        action="ASSIGNMENT_STATUS_CHANGE",
        entity_type="emergency_assignment",
        entity_id=assignment.id,
        actor_user_id=current_user.id,
        outcome="success",
        metadata={"assignment_id": assignment.id, "new_status": assignment.status},
    )
    return _populate_assignment_out(assignment)


# ---------------------------------------------------------------------------
# 2. Authority & Incident Commander Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/api/emergencies/{emergency_id}/assignments",
    response_model=AssignmentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Authority direct assignment or formal invitation of a volunteer",
)
def create_or_invite_assignment(
    emergency_id: int,
    payload: AuthorityAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Dispatch or formally invite a volunteer to an emergency incident.
    - Restricted to emergency reporter or platform administrator.
    - Validates target volunteer existence, active state, and role eligibility.
    - Validates requirement belongs to this emergency incident.
    - Concurrency-safe deduplication adhering to (emergency_id, volunteer_id) unique constraint.
    """
    emergency = db.query(Emergency).filter(Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency not found",
        )

    # Authorization: Reporter or Admin only
    if emergency.reporter_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create assignments for this emergency",
        )

    if emergency.status in ["resolved", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot create assignments for an emergency that is {emergency.status}",
        )

    # Target volunteer validation
    target_user = db.query(User).filter(User.id == payload.volunteer_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target volunteer not found",
        )

    if not target_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign an inactive volunteer account",
        )

    if target_user.role not in ELIGIBLE_VOLUNTEER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User role '{target_user.role}' is not an eligible volunteer role for deployment",
        )

    # Validate requirement belongs to this emergency
    if payload.requirement_id is not None:
        req = (
            db.query(EmergencyRequirement)
            .filter(
                EmergencyRequirement.id == payload.requirement_id,
                EmergencyRequirement.emergency_id == emergency_id,
            )
            .first()
        )
        if not req:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Requirement ID {payload.requirement_id} does not belong to emergency ID {emergency_id}",
            )

    # Check for existing record
    existing = (
        db.query(EmergencyAssignment)
        .options(
            joinedload(EmergencyAssignment.volunteer),
            joinedload(EmergencyAssignment.requirement),
            joinedload(EmergencyAssignment.emergency),
        )
        .filter(
            EmergencyAssignment.emergency_id == emergency_id,
            EmergencyAssignment.volunteer_id == payload.volunteer_id,
        )
        .first()
    )

    now = datetime.now()

    if existing:
        if existing.status in ["assigned", "in_progress"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Volunteer is already actively {existing.status} to this emergency",
            )
        if existing.status == "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Volunteer has already completed their assignment for this emergency",
            )

        # Reuse existing record (pending, accepted, rejected, cancelled)
        existing.status = payload.initial_status
        existing.requirement_id = payload.requirement_id
        existing.assigned_by_id = current_user.id
        if payload.match_score_at_assignment is not None:
            existing.match_score_at_assignment = payload.match_score_at_assignment
        if payload.admin_notes:
            existing.admin_notes = payload.admin_notes
        if payload.initial_status == "assigned":
            existing.responded_at = now

        if payload.volunteer_id != current_user.id:
            NotificationService.create_notification(
                db=db,
                user_id=payload.volunteer_id,
                title="Emergency Assignment Invitation" if payload.initial_status == "pending" else "New Emergency Assignment",
                message=f"You have been {'invited to' if payload.initial_status == 'pending' else 'assigned to'} emergency: {emergency.title}.",
                type="assignment_invitation",
                severity="warning",
                related_entity_type="emergency_assignment",
                related_entity_id=existing.id,
                auto_commit=False,
            )

        db.commit()
        db.refresh(existing)
        AuditService.record_event(
            db=db,
            action="ASSIGNMENT_STATUS_CHANGE",
            entity_type="emergency_assignment",
            entity_id=existing.id,
            actor_user_id=current_user.id,
            outcome="success",
            metadata={"assignment_id": existing.id, "new_status": existing.status},
        )
        return _populate_assignment_out(existing)

    # Create new assignment record
    new_assignment = EmergencyAssignment(
        emergency_id=emergency_id,
        volunteer_id=payload.volunteer_id,
        requirement_id=payload.requirement_id,
        status=payload.initial_status,
        assigned_by_id=current_user.id,
        match_score_at_assignment=payload.match_score_at_assignment,
        admin_notes=payload.admin_notes,
        responded_at=now if payload.initial_status == "assigned" else None,
    )

    db.add(new_assignment)
    db.flush()

    if payload.volunteer_id != current_user.id:
        NotificationService.create_notification(
            db=db,
            user_id=payload.volunteer_id,
            title="Emergency Assignment Invitation" if payload.initial_status == "pending" else "New Emergency Assignment",
            message=f"You have been {'invited to' if payload.initial_status == 'pending' else 'assigned to'} emergency: {emergency.title}.",
            type="assignment_invitation",
            severity="warning",
            related_entity_type="emergency_assignment",
            related_entity_id=new_assignment.id,
            auto_commit=False,
        )

    try:
        db.commit()
        db.refresh(new_assignment)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Volunteer is already assigned or invited to this emergency",
        )

    # Eager load relationships for return
    assignment = (
        db.query(EmergencyAssignment)
        .options(
            joinedload(EmergencyAssignment.volunteer),
            joinedload(EmergencyAssignment.requirement),
            joinedload(EmergencyAssignment.emergency),
        )
        .filter(EmergencyAssignment.id == new_assignment.id)
        .first()
    )

    AuditService.record_event(
        db=db,
        action="ASSIGNMENT_STATUS_CHANGE",
        entity_type="emergency_assignment",
        entity_id=assignment.id,
        actor_user_id=current_user.id,
        outcome="success",
        metadata={"assignment_id": assignment.id, "new_status": assignment.status},
    )

    return _populate_assignment_out(assignment)


@router.get(
    "/api/emergencies/{emergency_id}/assignments",
    response_model=EmergencyAssignmentsOverview,
    summary="List all assignments and requirement fulfillment metrics for an emergency incident",
)
def list_emergency_assignments(
    emergency_id: int,
    status_filter: Optional[str] = Query(None, alias="status", description="Filter assignments by status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return all volunteer assignments and capacity fulfillment metrics for an incident.
    - Restricted to emergency reporter or platform administrator.
    - Aggregates active dispatched headcount and pending pipeline per requirement.
    """
    emergency = db.query(Emergency).filter(Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency not found",
        )

    # Authorization: Reporter or Admin only
    if emergency.reporter_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view assignments for this emergency",
        )

    # 1. Fetch requirements
    requirements = (
        db.query(EmergencyRequirement)
        .filter(EmergencyRequirement.emergency_id == emergency_id)
        .order_by(EmergencyRequirement.id.asc())
        .all()
    )

    # 2. Fetch all assignments for this emergency
    all_assignments = (
        db.query(EmergencyAssignment)
        .options(
            joinedload(EmergencyAssignment.volunteer),
            joinedload(EmergencyAssignment.requirement),
            joinedload(EmergencyAssignment.emergency),
        )
        .filter(EmergencyAssignment.emergency_id == emergency_id)
        .order_by(EmergencyAssignment.updated_at.desc())
        .all()
    )

    # 3. Calculate requirement fulfillment metrics
    fulfillment_metrics: List[RequirementFulfillmentMetric] = []
    for req in requirements:
        req_assignments = [a for a in all_assignments if a.requirement_id == req.id]
        active_count = sum(1 for a in req_assignments if a.status in ["assigned", "in_progress", "completed"])
        pending_count = sum(1 for a in req_assignments if a.status in ["pending", "accepted"])
        remaining = max(0, req.min_volunteers_needed - active_count)

        fulfillment_metrics.append(
            RequirementFulfillmentMetric(
                requirement_id=req.id,
                skill_category=req.skill_category,
                skill_title=req.skill_title,
                min_volunteers_needed=req.min_volunteers_needed,
                active_dispatched_headcount=active_count,
                pending_pipeline_count=pending_count,
                remaining_needed=remaining,
            )
        )

    # 4. Filter assignments list if requested
    filtered_assignments = all_assignments
    if status_filter:
        filtered_assignments = [a for a in all_assignments if a.status == status_filter]

    return EmergencyAssignmentsOverview(
        emergency_id=emergency.id,
        emergency_title=emergency.title,
        emergency_status=emergency.status,
        total_assignments=len(all_assignments),
        requirements_fulfillment=fulfillment_metrics,
        assignments=[_populate_assignment_out(a) for a in filtered_assignments],
    )


@router.patch(
    "/api/emergencies/{emergency_id}/assignments/{assignment_id}",
    response_model=AssignmentOut,
    summary="Authority update of assignment status, notes, or requirement binding",
)
def update_emergency_assignment(
    emergency_id: int,
    assignment_id: int,
    payload: AuthorityAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Allow reporter or admin to promote accepted volunteers to assigned, change requirement binding,
    update administrative instructions, or transition status.
    """
    emergency = db.query(Emergency).filter(Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency not found",
        )

    if emergency.reporter_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update assignments for this emergency",
        )

    assignment = (
        db.query(EmergencyAssignment)
        .options(
            joinedload(EmergencyAssignment.volunteer),
            joinedload(EmergencyAssignment.requirement),
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
            detail="Assignment not found for this emergency",
        )

    now = datetime.now()

    # Validate requirement_id if provided
    if payload.requirement_id is not None:
        req = (
            db.query(EmergencyRequirement)
            .filter(
                EmergencyRequirement.id == payload.requirement_id,
                EmergencyRequirement.emergency_id == emergency_id,
            )
            .first()
        )
        if not req:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Requirement ID {payload.requirement_id} does not belong to emergency ID {emergency_id}",
            )
        assignment.requirement_id = payload.requirement_id

    # Handle status transition if provided
    if payload.status is not None:
        target = payload.status
        current = assignment.status

        # Completed is terminal
        if current == "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify a completed assignment",
            )

        # Allowed transitions for authority:
        allowed_transitions = {
            "pending": ["assigned", "cancelled", "rejected"],
            "accepted": ["assigned", "cancelled"],
            "assigned": ["in_progress", "cancelled"],
            "in_progress": ["completed", "cancelled"],
            "rejected": ["pending", "cancelled"],
            "cancelled": ["pending", "assigned"],
        }

        valid_targets = allowed_transitions.get(current, [])
        if target not in valid_targets and target != current:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status transition from '{current}' to '{target}'. Valid targets: {', '.join(valid_targets)}",
            )

        assignment.status = target
        if target == "assigned":
            assignment.assigned_by_id = current_user.id
            if not assignment.responded_at:
                assignment.responded_at = now
        elif target == "in_progress":
            assignment.deployed_at = now
        elif target == "completed":
            assignment.completed_at = now
        elif target == "cancelled":
            assignment.cancelled_at = now

    if payload.admin_notes is not None:
        assignment.admin_notes = payload.admin_notes

    if payload.status is not None and assignment.volunteer_id != current_user.id:
        NotificationService.create_notification(
            db=db,
            user_id=assignment.volunteer_id,
            title=f"Assignment Status: {target.replace('_', ' ').title()}",
            message=f"Your assignment status for emergency: {emergency.title} has been updated to '{target}'.",
            type="assignment_update",
            severity="warning" if target == "cancelled" else "info",
            related_entity_type="emergency_assignment",
            related_entity_id=assignment.id,
            auto_commit=False,
        )

    db.commit()
    db.refresh(assignment)
    if payload.status is not None:
        AuditService.record_event(
            db=db,
            action="ASSIGNMENT_CANCEL" if payload.status == "cancelled" else "ASSIGNMENT_STATUS_CHANGE",
            entity_type="emergency_assignment",
            entity_id=assignment.id,
            actor_user_id=current_user.id,
            outcome="success",
            metadata={"assignment_id": assignment.id, "new_status": assignment.status},
        )
    return _populate_assignment_out(assignment)


@router.post(
    "/api/emergencies/{emergency_id}/assignments/{assignment_id}/cancel",
    response_model=AssignmentOut,
    summary="Authority cancellation / standdown of an emergency assignment",
)
def cancel_emergency_assignment(
    emergency_id: int,
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cancel an assignment record (soft cancellation).
    Preserves operational history by setting status='cancelled' and recording cancelled_at.
    Physical deletion is disallowed.
    """
    emergency = db.query(Emergency).filter(Emergency.id == emergency_id).first()
    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency not found",
        )

    if emergency.reporter_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel assignments for this emergency",
        )

    assignment = (
        db.query(EmergencyAssignment)
        .options(
            joinedload(EmergencyAssignment.volunteer),
            joinedload(EmergencyAssignment.requirement),
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
            detail="Assignment not found for this emergency",
        )

    if assignment.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel an assignment that has already been completed",
        )

    if assignment.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment is already cancelled",
        )

    assignment.status = "cancelled"
    assignment.cancelled_at = datetime.now()

    if assignment.volunteer_id != current_user.id:
        NotificationService.create_notification(
            db=db,
            user_id=assignment.volunteer_id,
            title="Assignment Cancelled",
            message=f"Your assignment for emergency: {emergency.title} has been cancelled.",
            type="assignment_update",
            severity="warning",
            related_entity_type="emergency_assignment",
            related_entity_id=assignment.id,
            auto_commit=False,
        )

    db.commit()
    db.refresh(assignment)
    AuditService.record_event(
        db=db,
        action="ASSIGNMENT_CANCEL",
        entity_type="emergency_assignment",
        entity_id=assignment.id,
        actor_user_id=current_user.id,
        outcome="success",
        metadata={"assignment_id": assignment.id, "emergency_id": emergency_id},
    )
    return _populate_assignment_out(assignment)
