from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base
from app.models.user import User


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    experience_years = Column(Integer, default=0, nullable=False)
    proficiency = Column(String(20), default="intermediate", nullable=False)

    owner_id = Column(Integer, ForeignKey("users.id"))

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    owner = relationship(
        "User",
        back_populates="skills"
    )
    certifications = relationship(
        "VolunteerCertification",
        back_populates="skill"
    )


class Emergency(Base):
    __tablename__ = "emergencies"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False)
    severity = Column(String(20), default="medium", nullable=False)
    location = Column(String, nullable=True)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    status = Column(
        String,
        default="open"
    )

    reporter_id = Column(Integer, ForeignKey("users.id"))

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    reporter = relationship(
        "User",
        back_populates="emergencies"
    )
    requirements = relationship(
        "EmergencyRequirement",
        back_populates="emergency",
        cascade="all, delete-orphan"
    )
    assignments = relationship(
        "EmergencyAssignment",
        back_populates="emergency",
        cascade="all, delete-orphan"
    )
    feedbacks = relationship(
        "AssignmentFeedback",
        back_populates="emergency",
        cascade="all, delete-orphan"
    )