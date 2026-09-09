"""
app/models/notification.py

SQLAlchemy Notification model — Community Skill Bank.
Supports persistent in-app notifications for disaster incidents, volunteer assignments,
certifications, community activities, post-incident feedback, and system announcements.
"""

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)

    # Notification category / domain event type
    # Allowed: emergency_alert, assignment_invitation, assignment_update,
    # certification_status, community_activity, feedback_received, admin_alert, system
    type = Column(String(50), nullable=False, index=True)

    # Urgency / visual emphasis: info, warning, critical, success
    severity = Column(String(20), nullable=False, default="info")

    # Polymorphic entity linkage
    related_entity_type = Column(String(50), nullable=True, index=True)
    related_entity_id = Column(Integer, nullable=True, index=True)

    # Read tracking
    is_read = Column(Boolean, nullable=False, default=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)

    # Creation timestamp
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Relationship to user
    user = relationship("User", back_populates="notifications")

    __table_args__ = (
        Index("ix_notifications_user_id_is_read", "user_id", "is_read"),
        Index("ix_notifications_user_id_created_at", "user_id", "created_at"),
    )
