"""
app/models/volunteer_certification.py

SQLAlchemy VolunteerCertification model — Structured professional and disaster response certifications.
"""

from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class VolunteerCertification(Base):
    __tablename__ = "volunteer_certifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    skill_id = Column(
        Integer,
        ForeignKey("skills.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    title = Column(String, nullable=False)
    issuing_organization = Column(String, nullable=False)
    credential_id = Column(String, nullable=True)

    issue_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)

    # Verification status: pending, verified, rejected, expired
    verification_status = Column(
        String(20),
        default="pending",
        nullable=False,
        index=True,
    )

    verified_by_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    verification_notes = Column(Text, nullable=True)
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
        back_populates="certifications_structured",
    )
    skill = relationship("Skill", back_populates="certifications")
    verified_by = relationship("User", foreign_keys=[verified_by_id])
