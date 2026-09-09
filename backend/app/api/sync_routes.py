"""
app/api/sync_routes.py

Module 18 — Offline / PWA Synchronization API Endpoints.
Provides:
- GET /api/sync/notifications: Notification catch-up for reconnecting clients
- GET /api/sync/changes: Delta change feed for emergencies, assignments, and community activities
- POST /api/sync: Safe, narrow batch action replay with server-authoritative conflict resolution
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models.user import User
from app.utils.security import get_current_user
from app.services.sync_service import SyncService
from app.schemas.schemas import (
    NotificationSyncOut,
    SyncChangesOut,
    SyncBatchRequest,
    SyncBatchResponse,
)

router = APIRouter(
    prefix="/api/sync",
    tags=["Sync"],
)


@router.get(
    "/notifications",
    response_model=NotificationSyncOut,
    summary="Notification catch-up synchronization",
)
def sync_notifications(
    since: Optional[datetime] = Query(None, description="Fetch notifications created on or after this timestamp"),
    limit: int = Query(50, ge=1, le=100, description="Max number of notifications to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch unread and recent notifications for the authenticated user to synchronize state after being offline.
    """
    return SyncService.sync_notifications(
        db=db,
        user_id=current_user.id,
        since=since,
        limit=limit,
    )


@router.get(
    "/changes",
    response_model=SyncChangesOut,
    summary="Delta change feed for offline client caching",
)
def get_delta_changes(
    since: Optional[datetime] = Query(None, description="Fetch entities updated on or after this timestamp"),
    limit: int = Query(50, ge=1, le=100, description="Max number of entities per collection to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch incremental updates across emergencies, user assignments, community activities, and participations.
    """
    return SyncService.get_delta_changes(
        db=db,
        user=current_user,
        since=since,
        limit=limit,
    )


@router.post(
    "",
    response_model=SyncBatchResponse,
    summary="Batch action synchronization with conflict resolution",
)
def process_batch_sync(
    request: SyncBatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit a queued batch of offline actions for server-authoritative validation,
    conflict detection, and idempotent execution.
    """
    return SyncService.process_batch_sync(
        db=db,
        user=current_user,
        request=request,
    )
