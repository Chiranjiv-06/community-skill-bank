from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


# User schemas

class UserCreate(BaseModel):
    """Schema for creating a new user account (used by /api/auth/register)."""
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    certifications: Optional[str] = None
    availability: Optional[str] = None
    # Role defaults to citizen_volunteer — no formal skills required by default.
    # Accepted values: skilled_volunteer, citizen_volunteer, admin, volunteer (legacy)
    role: str = "citizen_volunteer"


class UserOut(BaseModel):
    """Schema for returning user data in API responses."""
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
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Token schema

class Token(BaseModel):
    """JWT access token response."""
    access_token: str
    token_type: str = "bearer"


# Skill schemas

class SkillCreate(BaseModel):
    """Schema for creating a new skill record."""
    title: str
    category: str
    description: Optional[str] = None


class SkillUpdate(BaseModel):
    """Schema for updating an existing skill record."""
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None


class SkillOut(BaseModel):
    """Schema for returning skill data in API responses."""
    id: int
    title: str
    category: str
    description: Optional[str] = None
    owner_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Emergency schemas
# ---------------------------------------------------------------------------

class EmergencyCreate(BaseModel):
    """Schema for reporting a new emergency."""
    title: str
    description: Optional[str] = None
    category: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class EmergencyOut(BaseModel):
    """Schema for returning emergency data in API responses."""
    id: int
    title: str
    description: Optional[str] = None
    category: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: str
    reporter_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)