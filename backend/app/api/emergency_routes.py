import math
from typing import List, Optional, Union

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models.models import Emergency
from app.models.emergency_requirement import EmergencyRequirement
from app.models.user import User
from app.schemas.schemas import (
    EmergencyCreate,
    EmergencyUpdate,
    EmergencyStatusUpdate,
    EmergencyOut,
    EmergencyRequirementCreate,
    EmergencyRequirementUpdate,
    EmergencyRequirementOut,
    EmergencyMatchResponse,
    EmergencyIntelligenceOut,
    EmergencyRecommendationsResponse,
)
from app.utils.security import get_current_user, get_current_admin
from app.services.location_service import (
    haversine_distance,
    get_nearby_eligible_volunteers,
)
from app.services.matching_service import match_volunteers_for_emergency
from app.services.emergency_intelligence_service import analyze_emergency_intelligence
from app.services.recommendation_service import generate_volunteer_recommendations
from app.services.audit_service import AuditService


router = APIRouter(
    prefix="/api/emergencies",
    tags=["Emergencies"]
)


@router.post("/", response_model=EmergencyOut, status_code=status.HTTP_201_CREATED)
def report_emergency(
    emergency: EmergencyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Report a new emergency incident.
    Sets the reporter_id to current authenticated user.
    """
    new_emergency = Emergency(
        **emergency.model_dump(),
        reporter_id=current_user.id
    )

    db.add(new_emergency)
    db.commit()
    db.refresh(new_emergency)

    return new_emergency


@router.get("/", response_model=List[EmergencyOut])
def list_emergencies(
    status: Optional[str] = Query(None, description="Filter by status (open, in_progress, resolved, cancelled)"),
    severity: Optional[str] = Query(None, description="Filter by severity (critical, high, medium, low)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List emergency incidents with optional filters (requires authentication).
    """
    query = db.query(Emergency)

    if status:
        query = query.filter(Emergency.status == status)
    if severity:
        query = query.filter(Emergency.severity == severity)
    if category:
        query = query.filter(Emergency.category == category)

    return query.order_by(Emergency.created_at.desc()).all()


@router.get("/{emergency_id}", response_model=EmergencyOut)
def get_emergency(
    emergency_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve details of a single emergency incident (requires authentication).
    """
    emergency = (
        db.query(Emergency)
        .filter(Emergency.id == emergency_id)
        .first()
    )

    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency not found"
        )

    return emergency


@router.patch("/{emergency_id}", response_model=EmergencyOut)
def update_emergency(
    emergency_id: int,
    updates: EmergencyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update editable details of an emergency incident.
    Allowed for the reporter/owner or an admin.
    """
    emergency = (
        db.query(Emergency)
        .filter(Emergency.id == emergency_id)
        .first()
    )

    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency not found"
        )

    # Authorization check: only owner or admin can edit
    if emergency.reporter_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this emergency"
        )

    # Apply partial updates
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(emergency, field, value)

    db.commit()
    db.refresh(emergency)

    return emergency


@router.patch("/{emergency_id}/status", response_model=EmergencyOut)
def update_status(
    emergency_id: int,
    status_update: Optional[EmergencyStatusUpdate] = None,
    new_status: Optional[str] = Query(None, description="Legacy query param for status update"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """
    Update status of an emergency (admin only).
    Supported statuses: open, in_progress, resolved, cancelled.
    """
    emergency = (
        db.query(Emergency)
        .filter(Emergency.id == emergency_id)
        .first()
    )

    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency not found"
        )

    target_status = None
    if status_update is not None and status_update.status:
        target_status = status_update.status
    elif new_status is not None:
        target_status = new_status

    allowed_statuses = ["open", "in_progress", "resolved", "cancelled"]
    if not target_status or target_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Allowed values: {', '.join(allowed_statuses)}"
        )

    old_status = emergency.status
    emergency.status = target_status

    db.commit()
    db.refresh(emergency)

    AuditService.record_event(
        db=db,
        action="EMERGENCY_STATUS_CHANGE",
        entity_type="emergency",
        entity_id=emergency.id,
        actor_user_id=current_user.id,
        outcome="success",
        metadata={
            "emergency_id": emergency.id,
            "new_status": target_status,
            "previous_status": old_status,
        },
    )

    return emergency


# ---------------------------------------------------------------------------
# Emergency Requirements Endpoints
# ---------------------------------------------------------------------------

@router.post("/{emergency_id}/requirements", response_model=EmergencyRequirementOut, status_code=status.HTTP_201_CREATED)
def create_emergency_requirement(
    emergency_id: int,
    requirement: EmergencyRequirementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Add a skill/staffing requirement to an emergency incident.
    Allowed for the emergency reporter or an admin.
    """
    emergency = (
        db.query(Emergency)
        .filter(Emergency.id == emergency_id)
        .first()
    )

    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency not found"
        )

    if emergency.reporter_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to add requirements to this emergency"
        )

    new_requirement = EmergencyRequirement(
        emergency_id=emergency.id,
        **requirement.model_dump()
    )

    db.add(new_requirement)
    db.commit()
    db.refresh(new_requirement)

    return new_requirement


@router.get("/{emergency_id}/requirements", response_model=List[EmergencyRequirementOut])
def list_emergency_requirements(
    emergency_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all skill/staffing requirements for a specific emergency incident.
    Requires authentication.
    """
    emergency = (
        db.query(Emergency)
        .filter(Emergency.id == emergency_id)
        .first()
    )

    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency not found"
        )

    requirements = (
        db.query(EmergencyRequirement)
        .filter(EmergencyRequirement.emergency_id == emergency_id)
        .order_by(EmergencyRequirement.id.asc())
        .all()
    )

    return requirements


@router.patch("/{emergency_id}/requirements/{req_id}", response_model=EmergencyRequirementOut)
def update_emergency_requirement(
    emergency_id: int,
    req_id: int,
    updates: EmergencyRequirementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a skill/staffing requirement.
    Allowed for the emergency reporter or an admin.
    """
    emergency = (
        db.query(Emergency)
        .filter(Emergency.id == emergency_id)
        .first()
    )

    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency not found"
        )

    if emergency.reporter_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify requirements for this emergency"
        )

    requirement = (
        db.query(EmergencyRequirement)
        .filter(
            EmergencyRequirement.id == req_id,
            EmergencyRequirement.emergency_id == emergency_id
        )
        .first()
    )

    if not requirement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency requirement not found"
        )

    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(requirement, field, value)

    db.commit()
    db.refresh(requirement)

    return requirement


@router.delete("/{emergency_id}/requirements/{req_id}")
def delete_emergency_requirement(
    emergency_id: int,
    req_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a skill/staffing requirement.
    Allowed for the emergency reporter or an admin.
    """
    emergency = (
        db.query(Emergency)
        .filter(Emergency.id == emergency_id)
        .first()
    )

    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency not found"
        )

    if emergency.reporter_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete requirements for this emergency"
        )

    requirement = (
        db.query(EmergencyRequirement)
        .filter(
            EmergencyRequirement.id == req_id,
            EmergencyRequirement.emergency_id == emergency_id
        )
        .first()
    )

    if not requirement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency requirement not found"
        )

    db.delete(requirement)
    db.commit()

    return {"message": "Requirement deleted successfully", "id": req_id}


# ---------------------------------------------------------------------------
# Nearby Volunteers Calculation (Delegated to location_service)
# ---------------------------------------------------------------------------

# Preserved for backward compatibility if imported elsewhere
calculate_distance = haversine_distance


@router.get("/{emergency_id}/nearby-volunteers")
def nearby_volunteers(
    emergency_id: int,
    radius_km: float = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Find eligible nearby volunteers for an emergency incident within radius_km.
    Delegates spatial calculation and travel-distance constraint filtering to location_service.
    """
    if radius_km <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="radius_km must be greater than 0"
        )

    emergency = (
        db.query(Emergency)
        .filter(Emergency.id == emergency_id)
        .first()
    )

    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency not found"
        )

    volunteers = get_nearby_eligible_volunteers(
        db=db,
        emergency=emergency,
        radius_km=radius_km,
    )

    return {
        "emergency_id": emergency.id,
        "radius_km": radius_km,
        "volunteers": volunteers,
    }


# ---------------------------------------------------------------------------
# Volunteer Matching Recommendations (Module 6)
# ---------------------------------------------------------------------------

@router.get(
    "/{emergency_id}/match-volunteers",
    response_model=EmergencyMatchResponse,
    summary="Get rule-based volunteer matching recommendations for an emergency",
)
def match_volunteers(
    emergency_id: int,
    radius_km: float = Query(20.0, gt=0.0, description="Incident search radius in kilometers"),
    min_score: float = Query(0.0, ge=0.0, le=100.0, description="Minimum match score threshold (0-100)"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of candidate recommendations"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Evaluate eligible volunteer candidates against all emergency requirements.
    Uses two-stage rule-based matching:
    - Stage 1: Hard eligibility (active, non-admin, spatial within radius & travel capacity, requirement capability).
    - Stage 2: 100-point explainable scoring (Skill: 40, Proficiency: 25, Experience: 15, Proximity: 20).

    Access is restricted to the emergency reporter or platform administrators.
    """
    emergency = (
        db.query(Emergency)
        .filter(Emergency.id == emergency_id)
        .first()
    )

    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency not found",
        )

    # Authorization check: only owner or admin can view matching recommendations
    if emergency.reporter_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access matching recommendations for this emergency",
        )

    return match_volunteers_for_emergency(
        db=db,
        emergency=emergency,
        radius_km=radius_km,
        min_score=min_score,
        limit=limit,
    )


# ---------------------------------------------------------------------------
# Emergency Intelligence (Module 13)
# ---------------------------------------------------------------------------

@router.get(
    "/{emergency_id}/intelligence",
    response_model=EmergencyIntelligenceOut,
    summary="Get structured deterministic intelligence summary for an emergency incident",
)
def get_emergency_intelligence_endpoint(
    emergency_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve deterministic, explainable emergency intelligence:
    - Structured staffing requirements & required skill extraction
    - Operational urgency assessment (peak requirement vs incident level)
    - Rule-based operational severity assessment (without overwriting authoritative stored severity)
    - Headcount fulfillment against active volunteer assignments
    - Geographic coordinate integrity and explainable intelligence flags

    Access is restricted to the emergency reporter or platform administrators.
    """
    emergency = (
        db.query(Emergency)
        .filter(Emergency.id == emergency_id)
        .first()
    )

    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency not found",
        )

    # Authorization check: only owner or admin can view incident intelligence
    if emergency.reporter_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access intelligence for this emergency",
        )

    return analyze_emergency_intelligence(db=db, emergency=emergency)


# ---------------------------------------------------------------------------
# Volunteer Recommendations (Module 14)
# ---------------------------------------------------------------------------

@router.get(
    "/{emergency_id}/recommendations",
    response_model=EmergencyRecommendationsResponse,
    summary="Get prioritized, explainable volunteer recommendations for an emergency",
)
def get_emergency_recommendations_endpoint(
    emergency_id: int,
    radius_km: float = Query(20.0, gt=0.0, description="Incident search radius in kilometers"),
    min_score: float = Query(0.0, ge=0.0, le=100.0, description="Minimum match score threshold (0-100)"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of recommendations"),
    only_unfulfilled: bool = Query(False, description="Filter only to volunteers matching unfulfilled requirements"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve prioritized, explainable volunteer recommendations for an emergency incident:
    - Reuses Module 6 matching engine as the authoritative source for eligibility and matching score.
    - Excludes volunteers already actively assigned to this emergency.
    - Prioritizes candidates matching unfilled staffing requirements with higher operational urgency.
    - Enriches with active verified credentials and platform service history (Modules 8-9).
    - Provides deterministic explainable recommendation rationales.

    Access is restricted to the emergency reporter or platform administrators.
    """
    emergency = (
        db.query(Emergency)
        .filter(Emergency.id == emergency_id)
        .first()
    )

    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency not found",
        )

    # Authorization check: only owner or admin can view recommendations
    if emergency.reporter_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access recommendations for this emergency",
        )

    return generate_volunteer_recommendations(
        db=db,
        emergency=emergency,
        radius_km=radius_km,
        min_score=min_score,
        limit=limit,
        only_unfulfilled=only_unfulfilled,
    )


