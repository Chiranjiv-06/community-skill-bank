"""
app/api/users.py

User management endpoints.

GET  /api/users/me  — Get authenticated user's profile
GET  /api/users/    — List all users (admin only)
POST /api/users/    — Create a user (alternative to /api/auth/register)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.utils.security import get_current_user, get_current_admin, hash_password
from app.database.dependencies import get_db
from app.models.user import User
from app.models.volunteer_profile import VolunteerProfile
from app.schemas.users import (
    UserCreate,
    UserUpdate,
    UserResponse,
    VolunteerProfileUpdate,
    VolunteerProfileOut,
)

router = APIRouter(
    prefix="/api/users",
    tags=["Users"],
)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get my profile",
)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """Return the full profile of the currently authenticated user."""
    return current_user


@router.patch(
    "/me",
    response_model=UserResponse,
    summary="Update my profile",
)
def update_my_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update the authenticated user's profile fields.

    Only full_name, phone, location, latitude, longitude, bio, availability can be modified.
    Privileged fields (role, email, is_active, etc.) cannot be modified via this endpoint.
    """
    update_data = user_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get(
    "/me/volunteer-profile",
    response_model=VolunteerProfileOut,
    summary="Get my volunteer operational profile",
)
def get_my_volunteer_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get the extended operational profile for the authenticated volunteer.

    Applicable to: skilled_volunteer, citizen_volunteer, volunteer.
    Returns HTTP 404 if no profile has been created yet.
    """
    if current_user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Volunteer profile is only applicable to volunteer accounts",
        )

    profile = (
        db.query(VolunteerProfile)
        .filter(VolunteerProfile.user_id == current_user.id)
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer profile not found. Use PATCH to create or initialize your profile.",
        )

    return profile


@router.patch(
    "/me/volunteer-profile",
    response_model=VolunteerProfileOut,
    summary="Update or initialize my volunteer operational profile",
)
def update_my_volunteer_profile(
    profile_update: VolunteerProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update or initialize the operational volunteer profile.

    If a profile does not exist yet, creates it and applies the provided fields.
    If it exists, updates the provided fields.
    """
    if current_user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Volunteer profile is only applicable to volunteer accounts",
        )

    profile = (
        db.query(VolunteerProfile)
        .filter(VolunteerProfile.user_id == current_user.id)
        .first()
    )

    update_data = profile_update.model_dump(exclude_unset=True)

    if not profile:
        profile = VolunteerProfile(
            user_id=current_user.id,
            emergency_contact_name=update_data.get("emergency_contact_name"),
            emergency_contact_phone=update_data.get("emergency_contact_phone"),
            transportation_type=update_data.get("transportation_type"),
            max_travel_distance_km=update_data.get("max_travel_distance_km", 20.0),
            experience_years=update_data.get("experience_years", 0),
        )
        db.add(profile)
    else:
        for field, value in update_data.items():
            setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.get(
    "/",
    response_model=list[UserResponse],
    summary="List all users (admin only)",
)
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """
    Return a list of all registered users.
    Restricted to admin users.
    """
    return db.query(User).all()


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user account",
)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new user. Alternative to POST /api/auth/register.

    role defaults to citizen_volunteer if not provided.
    """
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    # Prevent privilege escalation during public user creation
    allowed_public_roles = {"citizen_volunteer", "skilled_volunteer", "volunteer"}
    assigned_role = user.role or "citizen_volunteer"

    if assigned_role == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin role cannot be assigned through public registration",
        )

    if assigned_role not in allowed_public_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Allowed public roles: {', '.join(sorted(allowed_public_roles))}",
        )

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hash_password(user.password),
        phone=user.phone,
        location=user.location,
        latitude=user.latitude,
        longitude=user.longitude,
        certifications=user.certifications,
        availability=user.availability,
        role=assigned_role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user