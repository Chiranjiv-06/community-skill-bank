"""
app/models/knowledge_document.py

SQLAlchemy KnowledgeDocument model — Structured disaster management, first-aid,
and emergency response knowledge articles for retrieval and assistant foundation.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(255), nullable=False, index=True)
    content = Column(Text, nullable=False)
    description = Column(Text, nullable=True)

    # e.g. "first_aid", "medical", "rescue", "evacuation", "shelter", "food_water", "communication", "general_emergency", "preparedness"
    category = Column(String(50), nullable=False, index=True)

    # e.g. "flood", "earthquake", "fire", "cyclone", "landslide", "tsunami", "general", "all"
    disaster_type = Column(String(50), nullable=False, index=True)

    source = Column(String(255), nullable=False)
    source_url = Column(String(512), nullable=True)

    # "draft", "published", "archived"
    status = Column(
        String(20),
        default="draft",
        nullable=False,
        index=True,
    )

    created_by_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_knowledge_documents_status_disaster_type", "status", "disaster_type"),
        Index("ix_knowledge_documents_status_category", "status", "category"),
    )

    # Relationships
    creator = relationship("User", foreign_keys=[created_by_id])
