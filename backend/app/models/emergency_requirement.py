"""
app/models/emergency_requirement.py

SQLAlchemy EmergencyRequirement model — Staffing and skill requirements for disaster incidents.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class EmergencyRequirement(Base):
    __tablename__ = "emergency_requirements"

    id = Column(Integer, primary_key=True, index=True)
    emergency_id = Column(
        Integer,
        ForeignKey("emergencies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    skill_category = Column(String, nullable=False)
    skill_title = Column(String, nullable=True)
    min_volunteers_needed = Column(Integer, default=1, nullable=False)
    min_proficiency = Column(String(20), default="intermediate", nullable=False)
    urgency = Column(String(20), default="medium", nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    emergency = relationship("Emergency", back_populates="requirements")
    assignments = relationship("EmergencyAssignment", back_populates="requirement")
