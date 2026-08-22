import math
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Emergency
from app.models.user import User
from app.schemas.schemas import EmergencyCreate, EmergencyOut
from app.auth.auth import get_current_user, get_current_admin


router = APIRouter(
    prefix="/api/emergencies",
    tags=["Emergencies"]
)


@router.post("/", response_model=EmergencyOut)
def report_emergency(
    emergency: EmergencyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Emergency)

    if status:
        query = query.filter(Emergency.status == status)

    return query.order_by(Emergency.created_at.desc()).all()


@router.patch("/{emergency_id}/status", response_model=EmergencyOut)
def update_status(
    emergency_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    emergency = (
        db.query(Emergency)
        .filter(Emergency.id == emergency_id)
        .first()
    )

    if not emergency:
        raise HTTPException(
            status_code=404,
            detail="Emergency not found"
        )

    if new_status not in ["open", "in_progress", "resolved"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid status"
        )

    setattr(emergency, "status", new_status)

    db.commit()
    db.refresh(emergency)

    return emergency

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in kilometers

    lat1 = math.radians(lat1)
    lat2 = math.radians(lat2)

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(dlon / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


@router.get("/{emergency_id}/nearby-volunteers")
def nearby_volunteers(
    emergency_id: int,
    radius_km: float = 20,
    db: Session = Depends(get_db),
):
    emergency = (
        db.query(Emergency)
        .filter(Emergency.id == emergency_id)
        .first()
    )

    if not emergency:
        raise HTTPException(
            status_code=404,
            detail="Emergency not found"
        )

    if emergency.latitude is None or emergency.longitude is None:
        raise HTTPException(
            status_code=400,
            detail="Emergency location is not available"
        )

    volunteers = (
        db.query(User)
        .filter(
            User.role == "volunteer",
            User.latitude.isnot(None),
            User.longitude.isnot(None),
        )
        .all()
    )

    nearby = []

    for volunteer in volunteers:
        distance = calculate_distance(
            emergency.latitude,
            emergency.longitude,
            volunteer.latitude,
            volunteer.longitude,
        )

        if distance <= radius_km:
            nearby.append({
                "id": volunteer.id,
                "full_name": volunteer.full_name,
                "email": volunteer.email,
                "phone": volunteer.phone,
                "location": volunteer.location,
                "distance_km": round(distance, 2),
            })

    nearby.sort(key=lambda x: x["distance_km"])

    return {
        "emergency_id": emergency.id,
        "radius_km": radius_km,
        "volunteers": nearby,
    }   

