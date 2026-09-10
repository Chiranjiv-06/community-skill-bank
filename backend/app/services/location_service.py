"""
app/services/location_service.py

Spatial calculation, coordinate validation, and volunteer proximity services for Community Skill Bank.
Provides reusable spatial logic for emergency dispatch and future matching engines.
"""

import math
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.models import Emergency
from app.models.user import User
from app.models.volunteer_profile import VolunteerProfile

# Earth radius constant in kilometers (mean Earth radius)
EARTH_RADIUS_KM: float = 6371.0

# Platform default volunteer travel radius in km if not specified in VolunteerProfile
DEFAULT_MAX_TRAVEL_DISTANCE_KM: float = 20.0

# Allowed volunteer roles for spatial dispatch
ELIGIBLE_VOLUNTEER_ROLES = {"skilled_volunteer", "citizen_volunteer", "volunteer"}


def validate_coordinates(latitude: Optional[float], longitude: Optional[float]) -> bool:
    """
    Validate that latitude and longitude coordinates are within valid geographic ranges:
    - Latitude:  -90.0 to +90.0 degrees
    - Longitude: -180.0 to +180.0 degrees
    """
    if latitude is None or longitude is None:
        return False
    if not isinstance(latitude, (int, float)) or not isinstance(longitude, (int, float)):
        return False
    if math.isnan(latitude) or math.isnan(longitude):
        return False
    return (-90.0 <= latitude <= 90.0) and (-180.0 <= longitude <= 180.0)


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on the Earth surface using the Haversine formula.
    Returns distance in kilometers.
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    # Numerically safe Haversine formula
    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    )
    # Clamp 'a' to [0.0, 1.0] to prevent math domain error in sqrt due to floating-point rounding
    a = min(1.0, max(0.0, a))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return EARTH_RADIUS_KM * c


def get_nearby_eligible_volunteers(
    db: Session,
    emergency: Emergency,
    radius_km: float = 20.0,
) -> List[Dict[str, Any]]:
    """
    Query, filter, and rank nearby eligible volunteers for a given emergency incident.

    Eligibility criteria:
    1. Active user (`is_active = True`)
    2. Role is one of `skilled_volunteer`, `citizen_volunteer`, or legacy `volunteer` (admin excluded)
    3. Valid coordinates on user record
    4. Distance to emergency <= emergency search radius (`radius_km`)
    5. Distance to emergency <= volunteer's operational willingness (`max_travel_distance_km`)

    Returns a list of dicts ordered by distance ascending.
    """
    if not validate_coordinates(emergency.latitude, emergency.longitude):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Emergency location is not available",
        )

    # Query active volunteers with coordinates, eager loading their volunteer profiles
    volunteers = (
        db.query(User)
        .options(joinedload(User.volunteer_profile))
        .filter(
            User.role.in_(ELIGIBLE_VOLUNTEER_ROLES),
            User.is_active.is_(True),
            User.latitude.isnot(None),
            User.longitude.isnot(None),
        )
        .all()
    )

    eligible_nearby = []

    for volunteer in volunteers:
        # Extra safety check on volunteer coordinates
        if not validate_coordinates(volunteer.latitude, volunteer.longitude):
            continue

        distance = haversine_distance(
            emergency.latitude,
            emergency.longitude,
            volunteer.latitude,
            volunteer.longitude,
        )

        # 1. Incident search radius constraint
        if distance > radius_km:
            continue

        # 2. Volunteer maximum travel capacity constraint
        profile = volunteer.volunteer_profile
        max_travel = DEFAULT_MAX_TRAVEL_DISTANCE_KM
        if profile is not None and profile.max_travel_distance_km is not None and profile.max_travel_distance_km > 0:
            max_travel = profile.max_travel_distance_km

        if distance > max_travel:
            continue

        eligible_nearby.append({
            "id": volunteer.id,
            "full_name": volunteer.full_name,
            "email": volunteer.email,
            "phone": volunteer.phone,
            "role": volunteer.role,
            "location": volunteer.location,
            "distance_km": round(distance, 2),
        })

    # Sort candidates strictly by ascending proximity
    eligible_nearby.sort(key=lambda v: v["distance_km"])

    return eligible_nearby
