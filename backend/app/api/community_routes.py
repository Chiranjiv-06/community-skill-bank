"""
app/api/community_routes.py

Community Activities & Engagement APIs for Community Skill Bank.
Supports non-emergency preparedness activities, safety workshops, training drives,
volunteer RSVPs, attendance tracking, and verified community engagement metrics.
"""

from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func

from app.database.dependencies import get_db
from app.models.community_activity import CommunityActivity
from app.models.community_participation import CommunityParticipation
from app.models.user import User
from app.schemas.schemas import (
    CommunityActivityCreate,
    CommunityActivityUpdate,
    CommunityActivityOut,
    CommunityParticipationOut,
    AdminAttendanceUpdate,
    VolunteerCommunitySummary,
)
from app.services.location_service import haversine_distance, validate_coordinates
from app.services.notification_service import NotificationService
from app.utils.security import get_current_user, get_current_admin

router = APIRouter(prefix="/api/community", tags=["Community Activities & Engagement"])


def _populate_activity_out(
    activity: CommunityActivity,
    db: Session,
    current_user: Optional[User] = None,
    distance_km: Optional[float] = None,
) -> CommunityActivityOut:
    """Helper to compute registered counts, remaining capacity, and user registration context."""
    # Active registrations count
    active_count = (
        db.query(CommunityParticipation)
        .filter(
            CommunityParticipation.activity_id == activity.id,
            CommunityParticipation.status.in_(["registered", "attended", "completed"]),
        )
        .count()
    )

    remaining_cap = None
    if activity.capacity is not None:
        remaining_cap = max(0, activity.capacity - active_count)

    is_user_reg = False
    user_part_status = None
    if current_user:
        part = (
            db.query(CommunityParticipation)
            .filter(
                CommunityParticipation.activity_id == activity.id,
                CommunityParticipation.volunteer_id == current_user.id,
            )
            .first()
        )
        if part:
            user_part_status = part.status
            if part.status in ["registered", "attended", "completed"]:
                is_user_reg = True

    organizer_name = activity.organizer.full_name if activity.organizer else None

    return CommunityActivityOut(
        id=activity.id,
        title=activity.title,
        description=activity.description,
        activity_type=activity.activity_type,
        organizer_id=activity.organizer_id,
        location_name=activity.location_name,
        latitude=activity.latitude,
        longitude=activity.longitude,
        start_datetime=activity.start_datetime,
        end_datetime=activity.end_datetime,
        capacity=activity.capacity,
        registered_count=active_count,
        remaining_capacity=remaining_cap,
        status=activity.status,
        created_at=activity.created_at,
        updated_at=activity.updated_at,
        organizer_name=organizer_name,
        distance_km=distance_km,
        is_user_registered=is_user_reg,
        user_participation_status=user_part_status,
    )


def _populate_participation_out(
    part: CommunityParticipation,
) -> CommunityParticipationOut:
    """Helper to populate rich context on participation output schema."""
    activity = part.activity
    volunteer = part.volunteer
    return CommunityParticipationOut(
        id=part.id,
        activity_id=part.activity_id,
        volunteer_id=part.volunteer_id,
        status=part.status,
        participation_hours=part.participation_hours,
        feedback_notes=part.feedback_notes,
        registered_at=part.registered_at,
        attended_at=part.attended_at,
        completed_at=part.completed_at,
        created_at=part.created_at,
        updated_at=part.updated_at,
        activity_title=activity.title if activity else None,
        activity_type=activity.activity_type if activity else None,
        start_datetime=activity.start_datetime if activity else None,
        end_datetime=activity.end_datetime if activity else None,
        location_name=activity.location_name if activity else None,
        volunteer_name=volunteer.full_name if volunteer else None,
        volunteer_email=volunteer.email if volunteer else None,
    )


# =====================================================================
# 1. COMMUNITY ACTIVITIES CRUD & DISCOVERY
# =====================================================================

@router.post(
    "/activities",
    response_model=CommunityActivityOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create Community Activity (Admin Only)",
)
def create_activity(
    payload: CommunityActivityCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Administrator creates a new community activity.
    Validates dates and geographic coordinates.
    """
    if payload.latitude is not None or payload.longitude is not None:
        if not validate_coordinates(payload.latitude, payload.longitude):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Coordinates must satisfy: latitude [-90.0..90.0], longitude [-180.0..180.0]",
            )

    activity = CommunityActivity(
        title=payload.title,
        description=payload.description,
        activity_type=payload.activity_type,
        organizer_id=admin.id,
        location_name=payload.location_name,
        latitude=payload.latitude,
        longitude=payload.longitude,
        start_datetime=payload.start_datetime,
        end_datetime=payload.end_datetime,
        capacity=payload.capacity,
        status=payload.status,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)

    return _populate_activity_out(activity, db, current_user=admin)


@router.get(
    "/activities",
    response_model=List[CommunityActivityOut],
    summary="List and Filter Community Activities",
)
def list_activities(
    activity_type: Optional[str] = Query(None, description="Filter by activity type"),
    activity_status: Optional[str] = Query(None, alias="status", description="Filter by status (default: published, ongoing)"),
    from_date: Optional[datetime] = Query(None, description="Filter activities starting on or after this timestamp"),
    to_date: Optional[datetime] = Query(None, description="Filter activities starting on or before this timestamp"),
    lat: Optional[float] = Query(None, ge=-90.0, le=90.0, description="User latitude for proximity search"),
    lon: Optional[float] = Query(None, ge=-180.0, le=180.0, description="User longitude for proximity search"),
    radius_km: Optional[float] = Query(None, gt=0, description="Search radius in kilometers"),
    db: Session = Depends(get_db),
):
    """
    List community activities with optional filtering by type, dates, status, and geographic proximity.
    """
    query = db.query(CommunityActivity).options(joinedload(CommunityActivity.organizer))

    if activity_type:
        query = query.filter(CommunityActivity.activity_type == activity_type)

    if activity_status:
        query = query.filter(CommunityActivity.status == activity_status)
    else:
        query = query.filter(CommunityActivity.status.in_(["published", "ongoing"]))

    if from_date:
        query = query.filter(CommunityActivity.start_datetime >= from_date)
    if to_date:
        query = query.filter(CommunityActivity.start_datetime <= to_date)

    activities = query.order_by(CommunityActivity.start_datetime.asc()).all()

    # Spatial filtering
    results = []
    has_coords = lat is not None and lon is not None and validate_coordinates(lat, lon)

    for act in activities:
        dist_km = None
        if has_coords and act.latitude is not None and act.longitude is not None:
            dist_km = round(haversine_distance(lat, lon, act.latitude, act.longitude), 2)
            if radius_km is not None and dist_km > radius_km:
                continue

        results.append(_populate_activity_out(act, db, current_user=None, distance_km=dist_km))

    if has_coords:
        results.sort(key=lambda x: (x.distance_km is None, x.distance_km))

    return results


@router.get(
    "/activities/mine",
    response_model=List[CommunityParticipationOut],
    summary="List My Community Activity Participations",
)
def get_my_activities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all community activity participation records for the current volunteer."""
    participations = (
        db.query(CommunityParticipation)
        .options(
            joinedload(CommunityParticipation.activity),
            joinedload(CommunityParticipation.volunteer),
        )
        .filter(CommunityParticipation.volunteer_id == current_user.id)
        .order_by(CommunityParticipation.registered_at.desc())
        .all()
    )
    return [_populate_participation_out(p) for p in participations]


@router.get(
    "/activities/{activity_id}",
    response_model=CommunityActivityOut,
    summary="Get Single Community Activity",
)
def get_activity(
    activity_id: int,
    db: Session = Depends(get_db),
):
    """Retrieve details for a single community activity."""
    activity = (
        db.query(CommunityActivity)
        .options(joinedload(CommunityActivity.organizer))
        .filter(CommunityActivity.id == activity_id)
        .first()
    )
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Community activity with ID {activity_id} not found",
        )
    return _populate_activity_out(activity, db)


ALLOWED_ACTIVITY_TRANSITIONS = {
    "draft": {"draft", "published"},
    "published": {"published", "ongoing", "cancelled"},
    "ongoing": {"ongoing", "completed", "cancelled"},
    "completed": {"completed"},
    "cancelled": {"cancelled"},
}


@router.patch(
    "/activities/{activity_id}",
    response_model=CommunityActivityOut,
    summary="Update Community Activity (Admin Only)",
)
def update_activity(
    activity_id: int,
    payload: CommunityActivityUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Administrator updates activity details, schedule, capacity, or state."""
    query = (
        db.query(CommunityActivity)
        .options(joinedload(CommunityActivity.organizer))
        .filter(CommunityActivity.id == activity_id)
    )
    if db.get_bind().dialect.name != "sqlite":
        query = query.with_for_update()
    activity = query.first()

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Community activity with ID {activity_id} not found",
        )

    # State Machine Validation
    if payload.status is not None and payload.status != activity.status:
        allowed = ALLOWED_ACTIVITY_TRANSITIONS.get(activity.status, set())
        if payload.status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid activity status transition from '{activity.status}' to '{payload.status}'",
            )
        activity.status = payload.status

    # Date consistency check
    new_start = payload.start_datetime or activity.start_datetime
    new_end = payload.end_datetime or activity.end_datetime
    if new_end <= new_start:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="end_datetime must be strictly after start_datetime",
        )

    # Coordinate validation
    new_lat = payload.latitude if payload.latitude is not None else activity.latitude
    new_lon = payload.longitude if payload.longitude is not None else activity.longitude
    if new_lat is not None or new_lon is not None:
        if not validate_coordinates(new_lat, new_lon):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Coordinates must satisfy: latitude [-90.0..90.0], longitude [-180.0..180.0]",
            )

    if payload.title is not None:
        activity.title = payload.title
    if payload.description is not None:
        activity.description = payload.description
    if payload.activity_type is not None:
        activity.activity_type = payload.activity_type
    if payload.location_name is not None:
        activity.location_name = payload.location_name
    if payload.latitude is not None:
        activity.latitude = payload.latitude
    if payload.longitude is not None:
        activity.longitude = payload.longitude
    if payload.start_datetime is not None:
        activity.start_datetime = payload.start_datetime
    if payload.end_datetime is not None:
        activity.end_datetime = payload.end_datetime

    # Capacity validation: cannot reduce capacity below current active participants (registered, attended, completed)
    if payload.capacity is not None:
        active_count = (
            db.query(CommunityParticipation)
            .filter(
                CommunityParticipation.activity_id == activity.id,
                CommunityParticipation.status.in_(["registered", "attended", "completed"]),
            )
            .count()
        )
        if payload.capacity < active_count:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Capacity cannot be lower than the current number of active participants",
            )
        activity.capacity = payload.capacity

    if payload.status == "cancelled":
        registered_volunteers = [
            p[0]
            for p in db.query(CommunityParticipation.volunteer_id)
            .filter(
                CommunityParticipation.activity_id == activity.id,
                CommunityParticipation.status == "registered",
            )
            .all()
            if p[0] != admin.id
        ]
        if registered_volunteers:
            NotificationService.create_bulk_notifications(
                db=db,
                user_ids=registered_volunteers,
                title="Community Activity Cancelled",
                message=f"The community activity '{activity.title}' has been cancelled by the organizer.",
                type="community_activity",
                severity="warning",
                related_entity_type="community_activity",
                related_entity_id=activity.id,
                auto_commit=False,
            )

    db.commit()
    db.refresh(activity)
    return _populate_activity_out(activity, db, current_user=admin)


@router.post(
    "/activities/{activity_id}/cancel",
    response_model=CommunityActivityOut,
    summary="Cancel Community Activity (Admin Only)",
)
def cancel_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Administrator cancels an activity and sets its status to 'cancelled'."""
    activity = (
        db.query(CommunityActivity)
        .options(joinedload(CommunityActivity.organizer))
        .filter(CommunityActivity.id == activity_id)
        .first()
    )
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Community activity with ID {activity_id} not found",
        )

    if activity.status not in ["published", "ongoing"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel activity with status '{activity.status}'. Only 'published' or 'ongoing' activities can be cancelled.",
        )

    activity.status = "cancelled"

    registered_volunteers = [
        p[0]
        for p in db.query(CommunityParticipation.volunteer_id)
        .filter(
            CommunityParticipation.activity_id == activity.id,
            CommunityParticipation.status == "registered",
        )
        .all()
        if p[0] != admin.id
    ]
    if registered_volunteers:
        NotificationService.create_bulk_notifications(
            db=db,
            user_ids=registered_volunteers,
            title="Community Activity Cancelled",
            message=f"The community activity '{activity.title}' has been cancelled by the organizer.",
            type="community_activity",
            severity="warning",
            related_entity_type="community_activity",
            related_entity_id=activity.id,
            auto_commit=False,
        )

    db.commit()
    db.refresh(activity)
    return _populate_activity_out(activity, db, current_user=admin)


# =====================================================================
# 2. VOLUNTEER PARTICIPATION (JOIN, WITHDRAW, REJOIN, ROSTERS)
# =====================================================================

@router.post(
    "/activities/{activity_id}/join",
    response_model=CommunityParticipationOut,
    status_code=status.HTTP_201_CREATED,
    summary="Join / Register for Community Activity",
)
def join_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Authenticated volunteer joins/registers for an activity.
    Enforces active user verification, status checks, and atomic capacity limits.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account cannot register for community activities",
        )

    # Explicit row-level locking: in PostgreSQL, acquire exclusive row lock with SELECT ... FOR UPDATE
    query = db.query(CommunityActivity).filter(CommunityActivity.id == activity_id)
    if db.get_bind().dialect.name != "sqlite":
        query = query.with_for_update()
    activity = query.first()

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Community activity with ID {activity_id} not found",
        )

    if activity.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot join a cancelled community activity",
        )
    if activity.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot join a completed community activity",
        )
    if activity.status == "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot join an unpublished draft community activity",
        )

    # Check active participant count vs capacity
    active_count = (
        db.query(CommunityParticipation)
        .filter(
            CommunityParticipation.activity_id == activity.id,
            CommunityParticipation.status.in_(["registered", "attended", "completed"]),
        )
        .count()
    )

    if activity.capacity is not None and active_count >= activity.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Activity has reached maximum participant capacity",
        )

    # Check existing participation record
    existing = (
        db.query(CommunityParticipation)
        .filter(
            CommunityParticipation.activity_id == activity.id,
            CommunityParticipation.volunteer_id == current_user.id,
        )
        .first()
    )

    if existing:
        if existing.status == "registered":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You are already registered for this community activity",
            )
        elif existing.status in ["attended", "completed"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"You have already participated in this activity (status: {existing.status})",
            )
        else:
            # Re-join: row reuse from 'withdrawn' or 'no_show'
            existing.status = "registered"
            existing.registered_at = func.now()
            db.commit()
            db.refresh(existing)
            return _populate_participation_out(existing)

    # Create new participation
    part = CommunityParticipation(
        activity_id=activity.id,
        volunteer_id=current_user.id,
        status="registered",
    )
    db.add(part)
    db.commit()
    db.refresh(part)
    return _populate_participation_out(part)


@router.post(
    "/activities/{activity_id}/withdraw",
    response_model=CommunityParticipationOut,
    summary="Withdraw from Community Activity",
)
def withdraw_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Authenticated volunteer withdraws from an activity they previously joined.
    Frees up capacity for other volunteers.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account cannot withdraw from activities",
        )

    part = (
        db.query(CommunityParticipation)
        .options(
            joinedload(CommunityParticipation.activity),
            joinedload(CommunityParticipation.volunteer),
        )
        .filter(
            CommunityParticipation.activity_id == activity_id,
            CommunityParticipation.volunteer_id == current_user.id,
        )
        .first()
    )

    if not part or part.status == "withdrawn":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not actively registered for this activity",
        )

    if part.status in ["attended", "completed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot withdraw from an activity that has already been {part.status}",
        )

    part.status = "withdrawn"
    db.commit()
    db.refresh(part)
    return _populate_participation_out(part)


@router.get(
    "/activities/{activity_id}/participation",
    response_model=CommunityParticipationOut,
    summary="Get My Participation Status for an Activity",
)
def get_my_activity_participation(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve the current user's participation record for a specific activity."""
    part = (
        db.query(CommunityParticipation)
        .options(
            joinedload(CommunityParticipation.activity),
            joinedload(CommunityParticipation.volunteer),
        )
        .filter(
            CommunityParticipation.activity_id == activity_id,
            CommunityParticipation.volunteer_id == current_user.id,
        )
        .first()
    )
    if not part:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You have not registered for this community activity",
        )
    return _populate_participation_out(part)


@router.get(
    "/activities/{activity_id}/participants",
    response_model=List[CommunityParticipationOut],
    summary="List All Participants for an Activity (Admin Only)",
)
def list_activity_participants(
    activity_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Administrator lists all participant records and attendance status for an activity."""
    activity = db.query(CommunityActivity).filter(CommunityActivity.id == activity_id).first()
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Community activity with ID {activity_id} not found",
        )

    participations = (
        db.query(CommunityParticipation)
        .options(
            joinedload(CommunityParticipation.activity),
            joinedload(CommunityParticipation.volunteer),
        )
        .filter(CommunityParticipation.activity_id == activity_id)
        .order_by(CommunityParticipation.registered_at.asc())
        .all()
    )
    return [_populate_participation_out(p) for p in participations]


@router.patch(
    "/activities/{activity_id}/participants/{participant_id}/attendance",
    response_model=CommunityParticipationOut,
    summary="Record Attendance and Award Hours (Admin Only)",
)
def update_participant_attendance(
    activity_id: int,
    participant_id: int,
    payload: AdminAttendanceUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Administrator marks attendance, completion, or no-show, and awards participation hours.
    Participation hours must be strictly in the range: (0.0, 72.0].
    """
    part = (
        db.query(CommunityParticipation)
        .options(
            joinedload(CommunityParticipation.activity),
            joinedload(CommunityParticipation.volunteer),
        )
        .filter(
            CommunityParticipation.id == participant_id,
            CommunityParticipation.activity_id == activity_id,
        )
        .first()
    )
    if not part:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Participation record ID {participant_id} not found for activity {activity_id}",
        )

    now = datetime.now(timezone.utc)
    part.status = payload.status

    if payload.status == "attended":
        if part.attended_at is None:
            part.attended_at = now
    elif payload.status == "completed":
        if part.attended_at is None:
            part.attended_at = now
        if part.completed_at is None:
            part.completed_at = now

    if payload.participation_hours is not None:
        if payload.participation_hours <= 0.0 or payload.participation_hours > 72.0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="participation_hours must be > 0 and <= 72.0",
            )
        part.participation_hours = payload.participation_hours

    if payload.feedback_notes is not None:
        part.feedback_notes = payload.feedback_notes

    if part.volunteer_id != admin.id:
        hours_msg = f" with {payload.participation_hours} community hours awarded." if payload.participation_hours else "."
        NotificationService.create_notification(
            db=db,
            user_id=part.volunteer_id,
            title=f"Activity Participation: {payload.status.replace('_', ' ').title()}",
            message=f"Your attendance for activity '{part.activity.title if part.activity else 'Community Event'}' has been marked as '{payload.status}'{hours_msg}",
            type="community_activity",
            severity="success" if payload.status in ["attended", "completed"] else "info",
            related_entity_type="community_activity",
            related_entity_id=activity_id,
            auto_commit=False,
        )

    db.commit()
    db.refresh(part)
    return _populate_participation_out(part)


# =====================================================================
# 3. COMMUNITY ENGAGEMENT SUMMARY
# =====================================================================

@router.get(
    "/summary",
    response_model=VolunteerCommunitySummary,
    summary="Get Volunteer Community Engagement Summary",
)
def get_community_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Dynamically computes the volunteer's non-emergency community participation metrics:
    - total_activities_joined
    - activities_attended
    - activities_completed
    - total_community_hours
    - upcoming_activities_count
    
    NOTE: These community hours are completely isolated from Module 9 emergency mission metrics.
    """
    participations = (
        db.query(CommunityParticipation)
        .options(joinedload(CommunityParticipation.activity))
        .filter(CommunityParticipation.volunteer_id == current_user.id)
        .all()
    )

    total_joined = len([p for p in participations if p.status in ["registered", "attended", "completed"]])
    attended = len([p for p in participations if p.status in ["attended", "completed"]])
    completed = len([p for p in participations if p.status == "completed"])
    total_hours = sum(p.participation_hours or 0.0 for p in participations if p.participation_hours is not None)

    now = datetime.now(timezone.utc)
    upcoming_count = 0
    for p in participations:
        if p.status == "registered" and p.activity and p.activity.status == "published":
            # Compare start datetime
            act_start = p.activity.start_datetime
            if act_start:
                if act_start.tzinfo is None:
                    # treat naive as utc
                    act_start = act_start.replace(tzinfo=timezone.utc)
                if act_start >= now:
                    upcoming_count += 1

    return VolunteerCommunitySummary(
        volunteer_id=current_user.id,
        volunteer_name=current_user.full_name,
        role=current_user.role,
        total_activities_joined=total_joined,
        activities_attended=attended,
        activities_completed=completed,
        total_community_hours=round(total_hours, 2),
        upcoming_activities_count=upcoming_count,
    )
