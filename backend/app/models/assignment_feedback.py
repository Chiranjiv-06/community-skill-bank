"""
app/models/assignment_feedback.py

SQLAlchemy AssignmentFeedback model — Post-incident performance feedback, hours logging, and trust evaluation.
"""

from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class AssignmentFeedback(Base):
    __tablename__ = "assignment_feedbacks"

    id = Column(Integer, primary_key=True, index=True)

    # 1-to-1 relationship with EmergencyAssignment
    assignment_id = Column(
        Integer,
        ForeignKey("emergency_assignments.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

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

    submitted_by_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Operational evaluation
    rating = Column(Integer, nullable=False)            # 1 to 5
    hours_served = Column(Float, nullable=False)        # > 0.0 and <= 168.0
    feedback_notes = Column(Text, nullable=True)

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

    __table_args__ = (
        UniqueConstraint("assignment_id", name="uq_assignment_feedback"),
    )

    # Relationships
    assignment = relationship("EmergencyAssignment", back_populates="feedback")
    emergency = relationship("Emergency", back_populates="feedbacks")
    volunteer = relationship(
        "User",
        foreign_keys=[volunteer_id],
        back_populates="received_feedbacks",
    )
    submitted_by = relationship(
        "User",
        foreign_keys=[submitted_by_id],
        back_populates="submitted_feedbacks",
    )
