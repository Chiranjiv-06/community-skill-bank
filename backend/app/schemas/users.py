from pydantic import BaseModel, EmailStr


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: str | None = None
    location: str | None = None


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: str | None = None
    location: str | None = None

    class Config:
        from_attributes = True