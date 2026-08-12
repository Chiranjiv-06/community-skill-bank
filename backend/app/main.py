from fastapi import FastAPI

from app.database.database import engine
from app.database.base import Base
from app.models.user import User
from app.api.users import router as users_router
from app.api.auth import router as auth_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Community Skill Bank API",
    description="Backend API for connecting skilled community volunteers with emergency response authorities.",
    version="1.0.0"
)


app.include_router(users_router)
app.include_router(auth_router)


@app.get("/")
def home():
    return {
        "message": "Community Skill Bank API Running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }