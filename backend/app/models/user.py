"""
app/models/user.py

SQLAlchemy User model — Community Skill Bank.

Roles:
    admin             — full system access
    skilled_volunteer — formal skills, training, certifications
    citizen_volunteer — willingness to help, capabilities, resources
    volunteer         — legacy value (backward compatible, treated as citizen_volunteer)
"""

from sqlalchemy import Boolean, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class User(Base):
    __tablename__ = "users"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Core identity
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # Contact
    phone = Column(String, nullable=True)

    # Location
    location = Column(String, nullable=True)       # human-readable address
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Role — controls actor type and access level
    # Valid values: admin, skilled_volunteer, citizen_volunteer, volunteer (legacy)
    role = Column(String(20), default="citizen_volunteer", nullable=False)

    # Profile
    bio = Column(Text, nullable=True)              # short self-description (Phase 2 addition)
    certifications = Column(Text, nullable=True)   # legacy free-text field (kept for compat)
    availability = Column(String, nullable=True)   # e.g. "available", "busy", "unavailable"

    # Account status
    is_active = Column(Boolean, default=True, nullable=False)  # Phase 2 addition

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    skills = relationship("Skill", back_populates="owner")
    emergencies = relationship("Emergency", back_populates="reporter")
    volunteer_profile = relationship("VolunteerProfile", uselist=False, back_populates="user", cascade="all, delete-orphan")
    assignments = relationship("EmergencyAssignment", foreign_keys="EmergencyAssignment.volunteer_id", back_populates="volunteer", cascade="all, delete-orphan")
    certifications_structured = relationship("VolunteerCertification", foreign_keys="VolunteerCertification.user_id", back_populates="user", cascade="all, delete-orphan")
    trainings = relationship("VolunteerTraining", foreign_keys="VolunteerTraining.user_id", back_populates="user", cascade="all, delete-orphan")
    received_feedbacks = relationship("AssignmentFeedback", foreign_keys="AssignmentFeedback.volunteer_id", back_populates="volunteer", cascade="all, delete-orphan")
    submitted_feedbacks = relationship("AssignmentFeedback", foreign_keys="AssignmentFeedback.submitted_by_id", back_populates="submitted_by")
    organized_activities = relationship("CommunityActivity", foreign_keys="CommunityActivity.organizer_id", back_populates="organizer", cascade="all, delete-orphan")
    community_participations = relationship("CommunityParticipation", foreign_keys="CommunityParticipation.volunteer_id", back_populates="volunteer", cascade="all, delete-orphan")
    notifications = relationship("Notification", foreign_keys="Notification.user_id", back_populates="user", cascade="all, delete-orphan")