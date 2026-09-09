"""
app/schemas/users.py

User-specific Pydantic schemas — login form and user management.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


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
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    certifications: Optional[str] = None
    availability: Optional[str] = None
    role: str = "citizen_volunteer"


class UserUpdate(BaseModel):
    """
    Schema for updating authenticated user profile via PATCH /api/users/me.

    Strict security: Unexpected fields (role, is_active, email, etc.) are forbidden.
    """
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    bio: Optional[str] = None
    availability: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


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

    model_config = ConfigDict(from_attributes=True)


class VolunteerProfileUpdate(BaseModel):
    """
    Schema for updating or initializing volunteer operational profile via PATCH /api/users/me/volunteer-profile.
    """
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    transportation_type: Optional[str] = None
    max_travel_distance_km: Optional[float] = Field(default=None, gt=0.0)
    experience_years: Optional[int] = Field(default=None, ge=0)

    model_config = ConfigDict(extra="forbid")


class VolunteerProfileOut(BaseModel):
    """Schema for returning volunteer operational profile data."""
    id: int
    user_id: int
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    transportation_type: Optional[str] = None
    max_travel_distance_km: float
    experience_years: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)