"""
app/schemas/users.py

User-specific Pydantic schemas — login form and user management.
"""

from typing import Optional
from pydantic import BaseModel, EmailStr


class UserLogin(BaseModel):
    """Schema for JSON-body login request."""
    email: EmailStr
    password: str


class UserCreate(BaseModel):
    """
    Schema for creating a user (used by POST /api/users/ and POST /api/auth/register).

    role defaults to citizen_volunteer — citizen volunteers do NOT need
    formal skills, training, or certifications.
    Allowed values: skilled_volunteer, citizen_volunteer, admin, volunteer (legacy)
    """
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    certifications: Optional[str] = None
    availability: Optional[str] = None
    role: str = "citizen_volunteer"


class UserResponse(BaseModel):
    """Schema for returning user data from the users router."""
    id: int
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    role: str
    bio: Optional[str] = None
    certifications: Optional[str] = None
    availability: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True