from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


# ---------- User ----------

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    certifications: Optional[str] = None
    availability: Optional[str] = None

class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    role: str
    certifications: Optional[str] = None
    availability: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Skill ----------

class SkillCreate(BaseModel):
    title: str
    category: str
    description: Optional[str] = None


class SkillOut(BaseModel):
    id: int
    title: str
    category: str
    description: Optional[str] = None
    owner_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------- Emergency ----------

class EmergencyCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class EmergencyOut(BaseModel):
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