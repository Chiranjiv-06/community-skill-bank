"""
app/api/admin_routes.py

Admin-only management endpoints.

GET   /api/admin/users              — List all users with full details
PATCH /api/admin/users/{id}/role    — Change a user's role
GET   /api/admin/stats              — Quick platform statistics
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, EmailStr
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models.user import User
from app.models.models import Skill, Emergency
from app.utils.security import get_current_admin


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
)

# Valid roles that an admin can assign
VALID_ROLES = {"admin", "skilled_volunteer", "citizen_volunteer", "volunteer"}


# ---------------------------------------------------------------------------
# Schemas (admin-specific, include sensitive fields)
# ---------------------------------------------------------------------------

class AdminUserView(BaseModel):
    """Full user view for admin panel."""
    id: int
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    role: str
    bio: Optional[str] = None
    availability: Optional[str] = None
    is_active: bool
    certifications: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RoleUpdate(BaseModel):
    """Request body for changing a user's role."""
    role: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get(
    "/users",
    response_model=List[AdminUserView],
    summary="List all users (admin only)",
)
def list_all_users(
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """
    Return all registered users.

    Optionally filter by:
    - role: skilled_volunteer, citizen_volunteer, admin, volunteer
    - is_active: true or false
    """
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    return query.order_by(User.id).all()


@router.patch(
    "/users/{user_id}/role",
    response_model=AdminUserView,
    summary="Change a user's role (admin only)",
)
def update_user_role(
    user_id: int,
    body: RoleUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Update the role of a user. Admin only.

    Valid roles: admin, skilled_volunteer, citizen_volunteer, volunteer
    """
    if body.role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Valid options: {', '.join(sorted(VALID_ROLES))}",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent admin from accidentally removing their own admin role
    if user.id == current_admin.id and body.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own admin role",
        )

    setattr(user, "role", body.role)
    db.commit()
    db.refresh(user)
    return user


@router.get(
    "/stats",
    summary="Platform statistics (admin only)",
)
def platform_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """
    Return quick platform statistics for the admin dashboard.
    """
    total_users = db.query(User).count()
    skilled = db.query(User).filter(User.role == "skilled_volunteer").count()
    citizen = db.query(User).filter(
        User.role.in_(["citizen_volunteer", "volunteer"])
    ).count()
    admins = db.query(User).filter(User.role == "admin").count()
    active_users = db.query(User).filter(User.is_active == True).count()

    total_emergencies = db.query(Emergency).count()
    open_emergencies = db.query(Emergency).filter(Emergency.status == "open").count()
    in_progress = db.query(Emergency).filter(Emergency.status == "in_progress").count()
    resolved = db.query(Emergency).filter(Emergency.status == "resolved").count()

    total_skills = db.query(Skill).count()

    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "skilled_volunteers": skilled,
            "citizen_volunteers": citizen,
            "admins": admins,
        },
        "emergencies": {
            "total": total_emergencies,
            "open": open_emergencies,
            "in_progress": in_progress,
            "resolved": resolved,
        },
        "skills": {
            "total": total_skills,
        },
    }
