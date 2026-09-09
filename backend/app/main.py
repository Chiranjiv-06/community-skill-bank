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
from app.models.volunteer_profile import VolunteerProfile  # noqa: F401
from app.models.emergency_requirement import EmergencyRequirement  # noqa: F401
from app.models.emergency_assignment import EmergencyAssignment  # noqa: F401
from app.models.volunteer_certification import VolunteerCertification  # noqa: F401
from app.models.volunteer_training import VolunteerTraining  # noqa: F401
from app.models.assignment_feedback import AssignmentFeedback  # noqa: F401
from app.models.community_activity import CommunityActivity  # noqa: F401
from app.models.community_participation import CommunityParticipation  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.knowledge_document import KnowledgeDocument  # noqa: F401
from app.models.simulation import SimulationScenario, SimulationRequirement, SimulationResult  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401

# Routers
from app.api.auth import router as auth_router              # POST /auth/login (JSON)
from app.api.auth_routes import router as api_auth_router   # POST /api/auth/register, POST /api/auth/login
from app.api.users import router as users_router            # /api/users/*
from app.api.emergency_routes import router as emergency_router  # /api/emergencies/*
from app.api.skill_routes import router as skill_router     # /api/skills/*
from app.api.admin_routes import router as admin_router     # /api/admin/*
from app.api.assignment_routes import router as assignment_router  # /api/emergencies/{id}/assignments, /api/assignments/*
from app.api.certification_routes import router as certification_router  # /api/certifications/*, /api/trainings/*
from app.api.feedback_routes import router as feedback_router  # /api/emergencies/{id}/assignments/{id}/feedback, /api/contributions/*, /api/volunteers/*
from app.api.community_routes import router as community_router  # /api/community/*
from app.api.notification_routes import router as notification_router, admin_router as admin_notification_router  # /api/notifications/*, /api/admin/notifications/*
from app.api.knowledge_routes import router as knowledge_router  # /api/knowledge/*
from app.api.analytics_routes import router as analytics_router  # /api/analytics/*
from app.api.realtime_routes import router as realtime_router    # /api/ws
from app.api.sync_routes import router as sync_router            # /api/sync/*
from app.api.simulation_routes import router as simulation_router  # /api/simulations/*
from app.api.audit_routes import router as audit_router          # /api/admin/audit-logs, /api/admin/metrics

# Observability
import re
import time
import uuid
import logging
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.utils.observability import set_request_id, get_request_id, metrics_collector

logger = logging.getLogger("app.main")

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


@app.middleware("http")
async def observability_middleware(request: Request, call_next):
    """
    Centralized HTTP middleware:
    1. Validates or generates X-Request-ID
    2. Binds request_id to context
    3. Records high-resolution latency and operational metrics
    4. Attaches X-Request-ID to response headers
    """
    incoming_req_id = request.headers.get("X-Request-ID")
    # Validate format: alphanumeric and hyphen, 1-100 characters
    if incoming_req_id and re.match(r"^[a-zA-Z0-9\-_]{1,100}$", incoming_req_id):
        req_id = incoming_req_id
    else:
        req_id = str(uuid.uuid4())

    set_request_id(req_id)
    t0 = time.time()

    try:
        response: Response = await call_next(request)
        duration_ms = (time.time() - t0) * 1000.0
        metrics_collector.record_request(response.status_code, duration_ms)
        response.headers["X-Request-ID"] = req_id
        return response
    except Exception as exc:
        duration_ms = (time.time() - t0) * 1000.0
        metrics_collector.record_request(500, duration_ms)
        logger.error(
            "Unhandled server exception: %s",
            str(exc),
            extra={"request_id": req_id, "path": request.url.path},
            exc_info=True,
        )
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "request_id": req_id,
            },
            headers={"X-Request-ID": req_id},
        )


# Register routers
app.include_router(auth_router)        # /auth/login
app.include_router(api_auth_router)    # /api/auth/register, /api/auth/login
app.include_router(users_router)       # /api/users/*
app.include_router(emergency_router)   # /api/emergencies/*
app.include_router(assignment_router)  # /api/emergencies/{id}/assignments, /api/assignments/*
app.include_router(certification_router)  # /api/certifications/*, /api/trainings/*, /api/admin/certifications/*
app.include_router(feedback_router)    # /api/emergencies/{id}/assignments/{id}/feedback, /api/contributions/*, /api/volunteers/*
app.include_router(community_router)   # /api/community/*
app.include_router(notification_router)  # /api/notifications/*
app.include_router(admin_notification_router)  # /api/admin/notifications/*
app.include_router(knowledge_router)   # /api/knowledge/*
app.include_router(analytics_router)   # /api/analytics/*
app.include_router(realtime_router)    # /api/ws
app.include_router(sync_router)        # /api/sync/*
app.include_router(simulation_router)  # /api/simulations/*
app.include_router(audit_router)       # /api/admin/audit-logs, /api/admin/metrics
app.include_router(skill_router)       # /api/skills/*
app.include_router(admin_router)       # /api/admin/*


# Root & Health / Readiness endpoints
@app.get("/", tags=["Health"], summary="API root")
def home():
    """API is running."""
    return {
        "message": "Community Skill Bank API is running",
        "version": "2.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"], summary="Health check (Liveness)")
def health():
    """Simple health check endpoint confirming application liveness."""
    return {"status": "healthy"}


@app.get("/ready", tags=["Health"], summary="Readiness check")
def readiness():
    """
    Readiness probe validating database connectivity without exposing secrets.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "database": "disconnected"},
        )