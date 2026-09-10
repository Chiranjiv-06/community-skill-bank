"""
app/models/community_activity.py

SQLAlchemy CommunityActivity model — Community Skill Bank.
Supports scheduled non-emergency preparedness activities, safety workshops,
training drives, orientation sessions, and community engagement.
"""

from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class CommunityActivity(Base):
    __tablename__ = "community_activities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    activity_type = Column(String(50), nullable=False, index=True)
    organizer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    location_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    start_datetime = Column(DateTime(timezone=True), nullable=False, index=True)
    end_datetime = Column(DateTime(timezone=True), nullable=False)
    capacity = Column(Integer, nullable=True)  # NULL means unlimited capacity
    status = Column(String(20), nullable=False, default="published", index=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    organizer = relationship(
        "User",
        foreign_keys=[organizer_id],
        back_populates="organized_activities",
    )
    participations = relationship(
        "CommunityParticipation",
        back_populates="activity",
        cascade="all, delete-orphan",
        order_by="CommunityParticipation.registered_at.desc()",
    )
