"""
app/api/audit_routes.py

Module 20 — Administrative Audit & Observability API Endpoints (Admin Only).
Provides endpoints to inspect append-only audit trail logs and view in-process operational metrics.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models.user import User
from app.utils.security import get_current_admin
from app.utils.observability import metrics_collector
from app.services.audit_service import AuditService
from app.schemas.schemas import AuditLogsListOut, OperationalMetricsOut

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin Audit & Observability"],
)


@router.get(
    "/audit-logs",
    response_model=AuditLogsListOut,
    summary="List platform audit logs (Admin only)",
)
def list_audit_logs(
    action: Optional[str] = Query(None, description="Filter by event action (e.g. AUTH_LOGIN_SUCCESS, USER_ROLE_CHANGE)"),
    entity_type: Optional[str] = Query(None, description="Filter by target entity type (e.g. user, emergency, assignment)"),
    actor_user_id: Optional[int] = Query(None, description="Filter by actor user ID"),
    outcome: Optional[str] = Query(None, description="Filter by outcome (success, failure, conflict)"),
    date_from: Optional[datetime] = Query(None, description="Filter events on or after timestamp"),
    date_to: Optional[datetime] = Query(None, description="Filter events on or before timestamp"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """
    Query the append-only administrative audit trail with filtering and pagination.
    """
    return AuditService.list_audit_logs(
        db=db,
        action=action,
        entity_type=entity_type,
        actor_user_id=actor_user_id,
        outcome=outcome,
        date_from=date_from,
        date_to=date_to,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/metrics",
    response_model=OperationalMetricsOut,
    summary="Get operational system metrics (Admin only)",
)
def get_operational_metrics(
    _admin: User = Depends(get_current_admin),
):
    """
    Return in-process operational metrics snapshot (request rates, error rates, average latency, and subsystem counters).
    """
    return metrics_collector.get_metrics_snapshot()
