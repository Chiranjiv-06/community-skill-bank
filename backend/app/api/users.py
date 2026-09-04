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
from app.schemas.users import UserCreate, UserResponse

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
        role=user.role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user