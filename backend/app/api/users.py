from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.utils.security import get_current_user, hash_password
from app.database.dependencies import get_db
from app.models.user import User
from app.schemas.users import UserCreate

# Router sirf ek hi baar banega
router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.get("/me")
def get_my_profile(current_user: User = Depends(get_current_user)):
    # Kyunki 'current_user' get_current_user dependency se filter hoke aa raha hai,
    # hum guaranteed hain ki user logged in hai.
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email
    }

@router.get("/")
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    # Password hash karke ek hi baar user banayenge
    new_user = User(
    full_name=user.full_name,
    email=user.email,
    hashed_password=hash_password(user.password),
    phone=user.phone,
    location=user.location,
    latitude=user.latitude,
    longitude=user.longitude,
    certifications=user.certifications,
    availability=user.availability
)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user