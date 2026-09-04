"""
backend/app/main.py

Community Skill Bank — FastAPI Application Entry Point

All routers are registered here.
CORS is configured here for the React/Vite frontend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Database
from app.database.database import engine
from app.database.base import Base

# Models — import all so create_all registers every table
from app.models.user import User           # noqa: F401
from app.models.models import Skill, Emergency  # noqa: F401

# Routers
from app.api.auth import router as auth_router              # POST /auth/login (JSON)
from app.api.auth_routes import router as api_auth_router   # POST /api/auth/register, POST /api/auth/login
from app.api.users import router as users_router            # /api/users/*
from app.api.emergency_routes import router as emergency_router  # /api/emergencies/*
from app.api.skill_routes import router as skill_router     # /api/skills/*
from app.api.admin_routes import router as admin_router     # /api/admin/*

# Create tables (safe with existing data — only adds missing tables)
Base.metadata.create_all(bind=engine)

# Application
app = FastAPI(
    title="Community Skill Bank API",
    description=(
        "Backend API for connecting skilled community volunteers and citizen helpers "
        "with emergency response authorities and disaster management teams."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow React/Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite default
        "http://localhost:3000",   # CRA / alternate
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)        # /auth/login
app.include_router(api_auth_router)    # /api/auth/register, /api/auth/login
app.include_router(users_router)       # /api/users/*
app.include_router(emergency_router)   # /api/emergencies/*
app.include_router(skill_router)       # /api/skills/*
app.include_router(admin_router)       # /api/admin/*



# Root endpoints
@app.get("/", tags=["Health"], summary="API root")
def home():
    """API is running."""
    return {
        "message": "Community Skill Bank API is running",
        "version": "2.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"], summary="Health check")
def health():
    """Simple health check endpoint."""
    return {"status": "healthy"}