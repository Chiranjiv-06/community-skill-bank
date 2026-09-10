"""
app/models/emergency_assignment.py

SQLAlchemy EmergencyAssignment model — Response & Assignment Lifecycle for Disaster Incidents.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class EmergencyAssignment(Base):
    __tablename__ = "emergency_assignments"

    id = Column(Integer, primary_key=True, index=True)
    emergency_id = Column(
        Integer,
        ForeignKey("emergencies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    volunteer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    requirement_id = Column(
        Integer,
        ForeignKey("emergency_requirements.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Lifecycle status: pending, accepted, rejected, assigned, in_progress, completed, cancelled
    status = Column(String(20), default="pending", nullable=False, index=True)

    assigned_by_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    match_score_at_assignment = Column(Float, nullable=True)

    volunteer_notes = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)

    responded_at = Column(DateTime(timezone=True), nullable=True)
    deployed_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("emergency_id", "volunteer_id", name="uq_emergency_volunteer"),
    )

    # Relationships
    emergency = relationship("Emergency", back_populates="assignments")
    volunteer = relationship("User", foreign_keys=[volunteer_id], back_populates="assignments")
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])
    requirement = relationship("EmergencyRequirement", back_populates="assignments")
    feedback = relationship("AssignmentFeedback", uselist=False, back_populates="assignment", cascade="all, delete-orphan")
