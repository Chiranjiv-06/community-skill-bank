"""
app/models/community_participation.py

SQLAlchemy CommunityParticipation model — Community Skill Bank.
Tracks volunteer RSVPs, registrations, attendance, and awarded community hours.
"""

from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class CommunityParticipation(Base):
    __tablename__ = "community_participations"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(
        Integer,
        ForeignKey("community_activities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    volunteer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(String(20), nullable=False, default="registered", index=True)
    participation_hours = Column(Float, nullable=True)
    feedback_notes = Column(Text, nullable=True)
    registered_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    attended_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
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
    activity = relationship("CommunityActivity", back_populates="participations")
    volunteer = relationship("User", back_populates="community_participations")

    __table_args__ = (
        UniqueConstraint("activity_id", "volunteer_id", name="uq_activity_volunteer_participation"),
    )
