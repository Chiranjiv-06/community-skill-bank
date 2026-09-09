"""
app/models/volunteer_training.py

SQLAlchemy VolunteerTraining model — Volunteer course attendance and training completion records.
"""

from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class VolunteerTraining(Base):
    __tablename__ = "volunteer_trainings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    course_name = Column(String, nullable=False)
    provider = Column(String, nullable=False)

    completion_date = Column(Date, nullable=True)
    hours_completed = Column(Integer, default=0, nullable=False)
    credential_url = Column(String, nullable=True)

    # Status: completed, in_progress, verified
    status = Column(
        String(20),
        default="completed",
        nullable=False,
        index=True,
    )

    verified_by_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    verified_at = Column(DateTime(timezone=True), nullable=True)

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
    user = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="trainings",
    )
    verified_by = relationship("User", foreign_keys=[verified_by_id])
