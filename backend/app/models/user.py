from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    phone = Column(String, nullable=True)
    location = Column(String, nullable=True)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    role = Column(String, default="volunteer", nullable=False)

    certifications = Column(Text, nullable=True)
    availability = Column(String, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    skills = relationship(
        "Skill",
        back_populates="owner"
    )

    emergencies = relationship(
        "Emergency",
        back_populates="reporter"
    )