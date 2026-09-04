"""
app/api/auth_routes.py

Registration + form-data login endpoints.

POST /api/auth/register  — create new user account
POST /api/auth/login     — OAuth2 form-data login (also used by Swagger UI)

Both produce the same JWT structure as /auth/login:
    { sub: user_id, email: user_email, role: user_role }
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models.user import User
from app.schemas.schemas import UserCreate, UserOut, Token
from app.utils.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post(
    "/register",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.

    - **role** defaults to `citizen_volunteer` if not specified.
    - Allowed roles: `skilled_volunteer`, `citizen_volunteer`, `admin`
    - Email must be unique.
    """
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
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


@router.post(
    "/login",
    response_model=Token,
    summary="Login with form-data (OAuth2 compatible, used by Swagger UI)",
)
def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    Authenticate using OAuth2 form-data (username = email).

    Returns a Bearer token with sub=user_id, email, role.
    """
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, str(user.hashed_password)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # FIXED: sub must be str(user.id) — same as all other login endpoints
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}
