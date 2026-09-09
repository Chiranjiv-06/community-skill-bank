"""
app/models/audit_log.py

SQLAlchemy Model for Module 20 — Audit Trail & Security Observability.
Provides persistent, append-only records of critical state-changing actions and security events.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    
    # Actor identity (null for unauthenticated events such as failed logins)
    actor_user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    
    # Event details
    action = Column(String(100), nullable=False, index=True)  # e.g., AUTH_LOGIN_SUCCESS, USER_ROLE_CHANGE
    entity_type = Column(String(50), nullable=False, index=True)  # e.g., user, emergency, assignment, certification
    entity_id = Column(Integer, nullable=True, index=True)
    outcome = Column(String(20), default="success", nullable=False)  # success, failure, conflict
    
    # Request correlation & network context
    request_id = Column(String(100), nullable=True, index=True)
    ip_address = Column(String(50), nullable=True)
    
    # Allowlisted non-sensitive metadata (e.g., {"changed_fields": ["role"], "status": "verified"})
    metadata_json = Column(JSON, nullable=True)
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    actor = relationship("User", foreign_keys=[actor_user_id])

    __table_args__ = (
        Index("ix_audit_logs_action_timestamp", "action", "timestamp"),
        Index("ix_audit_logs_entity_composite", "entity_type", "entity_id"),
    )
