"""
app/api/certification_routes.py

Training & Certification APIs for Community Skill Bank.
Supports volunteer structured credential submission, tracking, and administrator verification workflows.
"""

from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.sql import func

from app.database.dependencies import get_db
from app.models.models import Skill
from app.models.volunteer_certification import VolunteerCertification
from app.models.volunteer_training import VolunteerTraining
from app.models.user import User
from app.schemas.schemas import (
    VolunteerCertificationCreate,
    VolunteerCertificationUpdate,
    AdminCertificationVerify,
    VolunteerCertificationOut,
    VolunteerTrainingCreate,
    VolunteerTrainingUpdate,
    AdminTrainingVerify,
    VolunteerTrainingOut,
)
from app.utils.security import get_current_user, get_current_admin
from app.services.location_service import ELIGIBLE_VOLUNTEER_ROLES
from app.services.notification_service import NotificationService

router = APIRouter(tags=["Training & Certification"])


def _populate_cert_out(cert: VolunteerCertification) -> VolunteerCertificationOut:
    """Helper to populate denormalized fields and evaluate effective expiration status."""
    u = cert.user
    s = cert.skill

    status_val = cert.verification_status
    # If verified but past expiry date, evaluate effective status as expired
    if status_val == "verified" and cert.expiry_date and cert.expiry_date < date.today():
        status_val = "expired"

    return VolunteerCertificationOut(
        id=cert.id,
        user_id=cert.user_id,
        skill_id=cert.skill_id,
        title=cert.title,
        issuing_organization=cert.issuing_organization,
        credential_id=cert.credential_id,
        issue_date=cert.issue_date,
        expiry_date=cert.expiry_date,
        verification_status=status_val,
        verified_by_id=cert.verified_by_id,
        verification_notes=cert.verification_notes,
        verified_at=cert.verified_at,
        created_at=cert.created_at,
        updated_at=cert.updated_at,
        skill_title=s.title if s else None,
        user_full_name=u.full_name if u else None,
        user_email=u.email if u else None,
    )


def _populate_training_out(tr: VolunteerTraining) -> VolunteerTrainingOut:
    """Helper to populate denormalized user fields on VolunteerTrainingOut."""
    u = tr.user
    return VolunteerTrainingOut(
        id=tr.id,
        user_id=tr.user_id,
        course_name=tr.course_name,
        provider=tr.provider,
        completion_date=tr.completion_date,
        hours_completed=tr.hours_completed,
        credential_url=tr.credential_url,
        status=tr.status,
        verified_by_id=tr.verified_by_id,
        verified_at=tr.verified_at,
        created_at=tr.created_at,
        updated_at=tr.updated_at,
        user_full_name=u.full_name if u else None,
        user_email=u.email if u else None,
    )


# ---------------------------------------------------------------------------
# 1. Volunteer Certification Endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/api/certifications/mine",
    response_model=List[VolunteerCertificationOut],
    summary="List all certifications for the authenticated volunteer",
)
def list_my_certifications(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by verification status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all structured certifications submitted by the current volunteer."""
    query = (
        db.query(VolunteerCertification)
        .options(
            joinedload(VolunteerCertification.user),
            joinedload(VolunteerCertification.skill),
        )
        .filter(VolunteerCertification.user_id == current_user.id)
    )

    if status_filter:
        query = query.filter(VolunteerCertification.verification_status == status_filter)

    certs = query.order_by(VolunteerCertification.created_at.desc()).all()
    return [_populate_cert_out(c) for c in certs]


@router.post(
    "/api/certifications",
    response_model=VolunteerCertificationOut,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new certification for verification",
)
def create_certification(
    payload: VolunteerCertificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Allow a volunteer to submit a structured credential for verification.
    - Validates date ranges (expiry_date >= issue_date).
    - If skill_id is provided, validates that the skill exists and belongs to current_user.
    - Initial verification_status is set to 'pending'.
    """
    if current_user.role not in ELIGIBLE_VOLUNTEER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only volunteer accounts can submit certifications",
        )

    # Date validation
    if payload.issue_date and payload.expiry_date and payload.expiry_date < payload.issue_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="expiry_date cannot be earlier than issue_date",
        )

    # Skill ownership validation
    if payload.skill_id is not None:
        skill = db.query(Skill).filter(Skill.id == payload.skill_id).first()
        if not skill:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Referenced skill does not exist",
            )
        if skill.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You do not own the referenced skill",
            )

    new_cert = VolunteerCertification(
        user_id=current_user.id,
        skill_id=payload.skill_id,
        title=payload.title.strip(),
        issuing_organization=payload.issuing_organization.strip(),
        credential_id=payload.credential_id.strip() if payload.credential_id else None,
        issue_date=payload.issue_date,
        expiry_date=payload.expiry_date,
        verification_status="pending",
    )

    db.add(new_cert)
    db.commit()
    db.refresh(new_cert)

    cert = (
        db.query(VolunteerCertification)
        .options(
            joinedload(VolunteerCertification.user),
            joinedload(VolunteerCertification.skill),
        )
        .filter(VolunteerCertification.id == new_cert.id)
        .first()
    )
    return _populate_cert_out(cert)


@router.get(
    "/api/certifications/{cert_id}",
    response_model=VolunteerCertificationOut,
    summary="Get details of a specific certification",
)
def get_certification(
    cert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve details of a single certification (accessible by owner or admin)."""
    cert = (
        db.query(VolunteerCertification)
        .options(
            joinedload(VolunteerCertification.user),
            joinedload(VolunteerCertification.skill),
        )
        .filter(VolunteerCertification.id == cert_id)
        .first()
    )

    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification not found",
        )

    if cert.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this certification",
        )

    return _populate_cert_out(cert)


@router.patch(
    "/api/certifications/{cert_id}",
    response_model=VolunteerCertificationOut,
    summary="Update an unverified/rejected certification (owner only)",
)
def update_certification(
    cert_id: int,
    payload: VolunteerCertificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Allow a volunteer to update or correct a pending or rejected certification.
    - Verified certifications cannot be modified by volunteers.
    - Correcting a rejected certification automatically resets its status to 'pending'.
    """
    cert = (
        db.query(VolunteerCertification)
        .options(
            joinedload(VolunteerCertification.user),
            joinedload(VolunteerCertification.skill),
        )
        .filter(VolunteerCertification.id == cert_id)
        .first()
    )

    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification not found",
        )

    if cert.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this certification",
        )

    if cert.verification_status == "verified":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verified certifications cannot be modified. Submit a new certification if details changed.",
        )

    # Date validation
    effective_issue = payload.issue_date if payload.issue_date is not None else cert.issue_date
    effective_expiry = payload.expiry_date if payload.expiry_date is not None else cert.expiry_date
    if effective_issue and effective_expiry and effective_expiry < effective_issue:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="expiry_date cannot be earlier than issue_date",
        )

    # Skill validation
    if payload.skill_id is not None:
        skill = db.query(Skill).filter(Skill.id == payload.skill_id).first()
        if not skill:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Referenced skill does not exist",
            )
        if skill.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You do not own the referenced skill",
            )
        cert.skill_id = payload.skill_id

    update_data = payload.model_dump(exclude_unset=True, exclude={"skill_id"})
    for field, value in update_data.items():
        setattr(cert, field, value)

    # If was rejected, reset to pending upon resubmission
    if cert.verification_status == "rejected":
        cert.verification_status = "pending"
        cert.verification_notes = None
        cert.verified_by_id = None
        cert.verified_at = None

    db.commit()
    db.refresh(cert)
    return _populate_cert_out(cert)


# ---------------------------------------------------------------------------
# 2. Volunteer Training Endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/api/trainings/mine",
    response_model=List[VolunteerTrainingOut],
    summary="List all training records for the authenticated volunteer",
)
def list_my_trainings(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by training status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all training and course attendance records for the current volunteer."""
    query = (
        db.query(VolunteerTraining)
        .options(joinedload(VolunteerTraining.user))
        .filter(VolunteerTraining.user_id == current_user.id)
    )

    if status_filter:
        query = query.filter(VolunteerTraining.status == status_filter)

    trainings = query.order_by(VolunteerTraining.created_at.desc()).all()
    return [_populate_training_out(t) for t in trainings]


@router.post(
    "/api/trainings",
    response_model=VolunteerTrainingOut,
    status_code=status.HTTP_201_CREATED,
    summary="Record a completed or in-progress training course",
)
def create_training(
    payload: VolunteerTrainingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Allow a volunteer to record training attendance or course completion."""
    if current_user.role not in ELIGIBLE_VOLUNTEER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only volunteer accounts can record training history",
        )

    new_training = VolunteerTraining(
        user_id=current_user.id,
        course_name=payload.course_name.strip(),
        provider=payload.provider.strip(),
        completion_date=payload.completion_date,
        hours_completed=payload.hours_completed,
        credential_url=payload.credential_url.strip() if payload.credential_url else None,
        status=payload.status,
    )

    db.add(new_training)
    db.commit()
    db.refresh(new_training)

    tr = (
        db.query(VolunteerTraining)
        .options(joinedload(VolunteerTraining.user))
        .filter(VolunteerTraining.id == new_training.id)
        .first()
    )
    return _populate_training_out(tr)


@router.get(
    "/api/trainings/{training_id}",
    response_model=VolunteerTrainingOut,
    summary="Get details of a specific training record",
)
def get_training(
    training_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve details of a single training record (owner or admin)."""
    tr = (
        db.query(VolunteerTraining)
        .options(joinedload(VolunteerTraining.user))
        .filter(VolunteerTraining.id == training_id)
        .first()
    )

    if not tr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training record not found",
        )

    if tr.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this training record",
        )

    return _populate_training_out(tr)


@router.patch(
    "/api/trainings/{training_id}",
    response_model=VolunteerTrainingOut,
    summary="Update an unverified training record (owner only)",
)
def update_training(
    training_id: int,
    payload: VolunteerTrainingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Allow a volunteer to update their training record details if not yet verified."""
    tr = (
        db.query(VolunteerTraining)
        .options(joinedload(VolunteerTraining.user))
        .filter(VolunteerTraining.id == training_id)
        .first()
    )

    if not tr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training record not found",
        )

    if tr.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this training record",
        )

    if tr.status == "verified":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verified training records cannot be modified.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tr, field, value)

    db.commit()
    db.refresh(tr)
    return _populate_training_out(tr)


# ---------------------------------------------------------------------------
# 3. Admin Verification Endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/api/admin/certifications",
    response_model=List[VolunteerCertificationOut],
    summary="List all certifications across the platform (admin only)",
)
def admin_list_certifications(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by verification status (pending, verified, rejected, expired)"),
    user_id: Optional[int] = Query(None, description="Filter by specific volunteer user ID"),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Administrator queue to review volunteer certifications."""
    query = (
        db.query(VolunteerCertification)
        .options(
            joinedload(VolunteerCertification.user),
            joinedload(VolunteerCertification.skill),
        )
    )

    if status_filter:
        query = query.filter(VolunteerCertification.verification_status == status_filter)
    if user_id:
        query = query.filter(VolunteerCertification.user_id == user_id)

    certs = query.order_by(VolunteerCertification.created_at.desc()).all()
    return [_populate_cert_out(c) for c in certs]


@router.patch(
    "/api/admin/certifications/{cert_id}/verify",
    response_model=VolunteerCertificationOut,
    summary="Admin verification or rejection of a volunteer certification",
)
def admin_verify_certification(
    cert_id: int,
    payload: AdminCertificationVerify,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Approve ('verified') or decline ('rejected') a volunteer certification with administrative audit notes.
    """
    cert = (
        db.query(VolunteerCertification)
        .options(
            joinedload(VolunteerCertification.user),
            joinedload(VolunteerCertification.skill),
        )
        .filter(VolunteerCertification.id == cert_id)
        .first()
    )

    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification not found",
        )

    cert.verification_status = payload.verification_status
    cert.verification_notes = payload.verification_notes
    cert.verified_by_id = current_admin.id
    cert.verified_at = datetime.now() if payload.verification_status in ["verified", "rejected"] else None

    if payload.verification_status in ["verified", "rejected"] and cert.user_id != current_admin.id:
        NotificationService.create_notification(
            db=db,
            user_id=cert.user_id,
            title=f"Certification {payload.verification_status.title()}",
            message=f"Your certification '{cert.title}' has been {payload.verification_status}.",
            type="certification_status",
            severity="success" if payload.verification_status == "verified" else "warning",
            related_entity_type="volunteer_certification",
            related_entity_id=cert.id,
            auto_commit=False,
        )

    db.commit()
    db.refresh(cert)

    from app.services.audit_service import AuditService
    AuditService.record_event(
        db=db,
        action="CERTIFICATION_VERIFY",
        entity_type="volunteer_certification",
        entity_id=cert.id,
        actor_user_id=current_admin.id,
        outcome="success",
        metadata={"verification_status": payload.verification_status, "user_id": cert.user_id},
    )

    return _populate_cert_out(cert)


@router.get(
    "/api/admin/trainings",
    response_model=List[VolunteerTrainingOut],
    summary="List all volunteer training records (admin only)",
)
def admin_list_trainings(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by training status (completed, in_progress, verified)"),
    user_id: Optional[int] = Query(None, description="Filter by volunteer user ID"),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Administrator queue to review volunteer training history."""
    query = db.query(VolunteerTraining).options(joinedload(VolunteerTraining.user))

    if status_filter:
        query = query.filter(VolunteerTraining.status == status_filter)
    if user_id:
        query = query.filter(VolunteerTraining.user_id == user_id)

    trainings = query.order_by(VolunteerTraining.created_at.desc()).all()
    return [_populate_training_out(t) for t in trainings]


@router.patch(
    "/api/admin/trainings/{training_id}/verify",
    response_model=VolunteerTrainingOut,
    summary="Admin verification of a volunteer training record",
)
def admin_verify_training(
    training_id: int,
    payload: AdminTrainingVerify,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Verify or update status of a volunteer's training record."""
    tr = (
        db.query(VolunteerTraining)
        .options(joinedload(VolunteerTraining.user))
        .filter(VolunteerTraining.id == training_id)
        .first()
    )

    if not tr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training record not found",
        )

    tr.status = payload.status
    if payload.status == "verified":
        tr.verified_by_id = current_admin.id
        tr.verified_at = datetime.now()

    if payload.status == "verified" and tr.user_id != current_admin.id:
        NotificationService.create_notification(
            db=db,
            user_id=tr.user_id,
            title="Training Course Verified",
            message=f"Your training course '{tr.course_name}' has been verified by the administrator.",
            type="certification_status",
            severity="success",
            related_entity_type="volunteer_training",
            related_entity_id=tr.id,
            auto_commit=False,
        )

    db.commit()
    db.refresh(tr)

    from app.services.audit_service import AuditService
    AuditService.record_event(
        db=db,
        action="TRAINING_VERIFY",
        entity_type="volunteer_training",
        entity_id=tr.id,
        actor_user_id=current_admin.id,
        outcome="success",
        metadata={"status": payload.status, "user_id": tr.user_id},
    )

    return _populate_training_out(tr)
