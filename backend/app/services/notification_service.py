"""
backend/app/services/notification_service.py

Centralized Notification Service for Community Skill Bank.
Handles persistent in-app notifications, badge counts, mark-as-read workflows,
and system broadcasts while ensuring strict user isolation and IDOR protection.
"""

from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User
from app.services.realtime_service import realtime_manager

VALID_NOTIFICATION_TYPES = {
    "emergency_alert",
    "assignment_invitation",
    "assignment_update",
    "certification_status",
    "community_activity",
    "feedback_received",
    "admin_alert",
    "system",
}

VALID_SEVERITIES = {"info", "warning", "critical", "success"}


class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        type: str,
        severity: str = "info",
        related_entity_type: Optional[str] = None,
        related_entity_id: Optional[int] = None,
        auto_commit: bool = True,
    ) -> Notification:
        """
        Create and persist a single notification for a specific user.
        Dispatches a real-time event envelope to connected sockets.
        """
        if type not in VALID_NOTIFICATION_TYPES:
            raise ValueError(f"Invalid notification type: {type}. Allowed: {VALID_NOTIFICATION_TYPES}")
        if severity not in VALID_SEVERITIES:
            raise ValueError(f"Invalid notification severity: {severity}. Allowed: {VALID_SEVERITIES}")

        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            severity=severity,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            is_read=False,
            read_at=None,
        )
        db.add(notification)
        if auto_commit:
            db.commit()
            db.refresh(notification)
        else:
            db.flush()

        # Real-time WebSocket dispatch
        event = {
            "event": "notification.created",
            "notification_id": notification.id,
            "notification_type": notification.type,
            "severity": notification.severity,
            "title": notification.title,
            "message": notification.message,
            "related_entity_type": notification.related_entity_type,
            "related_entity_id": notification.related_entity_id,
            "created_at": notification.created_at.isoformat() if notification.created_at else datetime.now(timezone.utc).isoformat(),
        }
        realtime_manager.dispatch_event_sync(
            user_ids=[user_id],
            event=event,
            send_to_admins_flag=(severity == "critical" or type == "admin_alert"),
        )

        return notification

    @staticmethod
    def create_bulk_notifications(
        db: Session,
        user_ids: List[int],
        title: str,
        message: str,
        type: str,
        severity: str = "info",
        related_entity_type: Optional[str] = None,
        related_entity_id: Optional[int] = None,
        auto_commit: bool = True,
    ) -> int:
        """
        Create and persist notifications for multiple users efficiently.
        Returns the total number of notifications created.
        Dispatches real-time events to all connected recipient sockets.
        """
        if not user_ids:
            return 0

        if type not in VALID_NOTIFICATION_TYPES:
            raise ValueError(f"Invalid notification type: {type}. Allowed: {VALID_NOTIFICATION_TYPES}")
        if severity not in VALID_SEVERITIES:
            raise ValueError(f"Invalid notification severity: {severity}. Allowed: {VALID_SEVERITIES}")

        unique_user_ids = list(set(user_ids))
        notifications = [
            Notification(
                user_id=uid,
                title=title,
                message=message,
                type=type,
                severity=severity,
                related_entity_type=related_entity_type,
                related_entity_id=related_entity_id,
                is_read=False,
                read_at=None,
            )
            for uid in unique_user_ids
        ]
        db.add_all(notifications)
        if auto_commit:
            db.commit()
        else:
            db.flush()

        # Real-time WebSocket bulk dispatch
        event = {
            "event": "notification.created",
            "notification_id": None,
            "notification_type": type,
            "severity": severity,
            "title": title,
            "message": message,
            "related_entity_type": related_entity_type,
            "related_entity_id": related_entity_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        realtime_manager.dispatch_event_sync(
            user_ids=unique_user_ids,
            event=event,
            send_to_admins_flag=(severity == "critical" or type == "admin_alert"),
        )

        return len(notifications)


    @staticmethod
    def get_user_notifications(
        db: Session,
        user_id: int,
        is_read: Optional[bool] = None,
        type: Optional[str] = None,
        limit: int = 50,
        skip: int = 0,
    ) -> List[Notification]:
        """
        Retrieve notifications for the current user with optional filtering and pagination.
        Strictly enforces user isolation.
        """
        query = db.query(Notification).filter(Notification.user_id == user_id)

        if is_read is not None:
            query = query.filter(Notification.is_read == is_read)
        if type is not None:
            query = query.filter(Notification.type == type)

        return (
            query.order_by(Notification.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_unread_count(db: Session, user_id: int) -> int:
        """
        Return count of unread notifications for the given user.
        """
        return (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read == False)
            .count()
        )

    @staticmethod
    def get_notification_by_id(
        db: Session,
        notification_id: int,
        user_id: int,
    ) -> Optional[Notification]:
        """
        Retrieve a single notification ensuring ownership check.
        Returns None if not found or if the notification belongs to another user.
        """
        return (
            db.query(Notification)
            .filter(Notification.id == notification_id, Notification.user_id == user_id)
            .first()
        )

    @staticmethod
    def mark_as_read(
        db: Session,
        notification_id: int,
        user_id: int,
    ) -> Optional[Notification]:
        """
        Mark a single notification as read with the current timestamp.
        Enforces user ownership.
        """
        notification = (
            db.query(Notification)
            .filter(Notification.id == notification_id, Notification.user_id == user_id)
            .first()
        )
        if not notification:
            return None

        if not notification.is_read:
            notification.is_read = True
            notification.read_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(notification)

        return notification

    @staticmethod
    def mark_all_as_read(
        db: Session,
        user_id: int,
    ) -> int:
        """
        Mark all unread notifications for the given user as read.
        Returns the number of updated records.
        """
        unread_notifications = (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read == False)
            .all()
        )
        if not unread_notifications:
            return 0

        now = datetime.now(timezone.utc)
        count = len(unread_notifications)
        for n in unread_notifications:
            n.is_read = True
            n.read_at = now

        db.commit()
        return count

    @staticmethod
    def broadcast_to_users(
        db: Session,
        title: str,
        message: str,
        type: str = "system",
        severity: str = "info",
        role_filter: Optional[str] = None,
    ) -> int:
        """
        Broadcast a notification to active users, optionally filtered by role.
        """
        user_query = db.query(User.id).filter(User.is_active == True)

        if role_filter and role_filter != "all":
            if role_filter == "volunteer":
                user_query = user_query.filter(User.role.in_(["volunteer", "citizen_volunteer"]))
            elif role_filter == "citizen_volunteer":
                user_query = user_query.filter(User.role.in_(["citizen_volunteer", "volunteer"]))
            else:
                user_query = user_query.filter(User.role == role_filter)

        user_ids = [row[0] for row in user_query.all()]
        return NotificationService.create_bulk_notifications(
            db=db,
            user_ids=user_ids,
            title=title,
            message=message,
            type=type,
            severity=severity,
            related_entity_type="system",
            related_entity_id=None,
            auto_commit=True,
        )
