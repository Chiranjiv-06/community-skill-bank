"""
app/api/auth.py

Login endpoint — JSON body.
Used by the React frontend: POST /auth/login

Returns a JWT token with sub=user_id, email, role.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models.user import User
from app.schemas.users import UserLogin
from app.utils.security import verify_password, create_access_token
from app.services.audit_service import AuditService

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post("/login", summary="Login with email and password (JSON body)")
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate a user with email + password.

    Returns a Bearer token to use in subsequent requests.

    JWT payload: { sub: user_id, email: user_email, role: user_role }
    """
    user = db.query(User).filter(User.email == user_data.email).first()

    if not user or not verify_password(user_data.password, str(user.hashed_password)):
        AuditService.record_event(
            db=db,
            action="AUTH_LOGIN_FAILURE",
            entity_type="auth",
            entity_id=None,
            actor_user_id=None,
            outcome="failure",
            metadata={"reason": "invalid_credentials"},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    AuditService.record_event(
        db=db,
        action="AUTH_LOGIN_SUCCESS",
        entity_type="user",
        entity_id=user.id,
        actor_user_id=user.id,
        outcome="success",
        metadata={"role": user.role},
    )

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role,
    }