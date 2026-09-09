"""
backend/app/api/notification_routes.py

Notification REST API Endpoints for Community Skill Bank.
Supports user in-app notification inbox, unread badge counts, mark-as-read,
and administrative broadcast messaging.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models.user import User
from app.schemas.schemas import (
    BroadcastNotificationCreate,
    BroadcastNotificationOut,
    MarkAllReadOut,
    NotificationOut,
    UnreadCountOut,
)
from app.services.notification_service import NotificationService
from app.services.audit_service import AuditService
from app.utils.security import get_current_admin, get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])
admin_router = APIRouter(prefix="/api/admin/notifications", tags=["Admin Notifications"])


# ---------------------------------------------------------------------------
# User Notification Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=List[NotificationOut], summary="List user notifications")
def get_notifications(
    is_read: Optional[bool] = Query(default=None, description="Filter by read/unread state"),
    type: Optional[str] = Query(default=None, description="Filter by notification type"),
    limit: int = Query(default=50, ge=1, le=100, description="Max records to return"),
    skip: int = Query(default=0, ge=0, description="Records to skip"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve paginated notifications for the authenticated user.
    Results are returned in reverse chronological order.
    """
    return NotificationService.get_user_notifications(
        db=db,
        user_id=current_user.id,
        is_read=is_read,
        type=type,
        limit=limit,
        skip=skip,
    )


@router.get("/unread-count", response_model=UnreadCountOut, summary="Get unread notification count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return the total number of unread notifications for badge display.
    """
    count = NotificationService.get_unread_count(db=db, user_id=current_user.id)
    return UnreadCountOut(unread_count=count)


@router.get("/{notification_id}", response_model=NotificationOut, summary="Get single notification")
def get_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve a specific notification by ID.
    Enforces strict IDOR protection — returns 404 if not found or owned by another user.
    """
    notification = NotificationService.get_notification_by_id(
        db=db,
        notification_id=notification_id,
        user_id=current_user.id,
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    return notification


@router.patch("/{notification_id}/read", response_model=NotificationOut, summary="Mark notification as read")
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mark a specific notification as read and set read_at timestamp.
    Enforces strict IDOR protection — returns 404 if not found or owned by another user.
    """
    notification = NotificationService.mark_as_read(
        db=db,
        notification_id=notification_id,
        user_id=current_user.id,
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    return notification


@router.patch("/read-all", response_model=MarkAllReadOut, summary="Mark all notifications as read")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mark all unread notifications for the authenticated user as read.
    """
    updated_count = NotificationService.mark_all_as_read(
        db=db,
        user_id=current_user.id,
    )
    return MarkAllReadOut(updated_count=updated_count)


# ---------------------------------------------------------------------------
# Admin Broadcast Endpoints
# ---------------------------------------------------------------------------

@admin_router.post("/broadcast", response_model=BroadcastNotificationOut, summary="Broadcast notification to users")
def broadcast_notification(
    payload: BroadcastNotificationCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Broadcast an administrative alert or system announcement to active users.
    Optionally filters target recipients by role.
    """
    count = NotificationService.broadcast_to_users(
        db=db,
        title=payload.title,
        message=payload.message,
        type=payload.type,
        severity=payload.severity,
        role_filter=payload.role_filter,
    )
    AuditService.record_event(
        db=db,
        action="NOTIFICATION_BROADCAST",
        entity_type="notification",
        entity_id=None,
        actor_user_id=current_admin.id,
        outcome="success",
        metadata={
            "broadcast_count": count,
            "role_filter": payload.role_filter,
            "type": payload.type,
            "severity": payload.severity,
        },
    )
    return BroadcastNotificationOut(
        broadcast_count=count,
        role_filter=payload.role_filter,
    )
