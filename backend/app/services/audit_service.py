"""
app/services/audit_service.py

Module 20 — Audit Logging Service for Community Skill Bank.
Provides persistent, append-only records of important state-changing domain events,
administrative actions, and security occurrences with credential redaction.
"""

import logging
from datetime import datetime
from typing import Optional, Dict, Any, List

from sqlalchemy.orm import Session, joinedload

from app.models.audit_log import AuditLog
from app.utils.observability import get_request_id, sanitize_log_data, metrics_collector
from app.schemas.schemas import AuditLogOut, AuditLogsListOut

logger = logging.getLogger("app.audit")


class AuditService:

    @staticmethod
    def record_event(
        db: Session,
        action: str,
        entity_type: str,
        entity_id: Optional[int] = None,
        actor_user_id: Optional[int] = None,
        outcome: str = "success",
        metadata: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        auto_commit: bool = True,
    ) -> AuditLog:
        """
        Record an append-only audit event in the database and structured log.
        Safely strips any sensitive credentials or tokens from metadata.
        """
        eff_request_id = request_id or get_request_id()
        sanitized_meta = sanitize_log_data(metadata) if metadata else None

        audit_entry = AuditLog(
            actor_user_id=actor_user_id,
            action=action.upper(),
            entity_type=entity_type.lower(),
            entity_id=entity_id,
            outcome=outcome.lower(),
            request_id=eff_request_id,
            ip_address=ip_address,
            metadata_json=sanitized_meta,
        )

        try:
            db.add(audit_entry)
            if auto_commit:
                db.commit()
                db.refresh(audit_entry)
            metrics_collector.record_audit_event()
        except Exception as e:
            logger.error(
                "Failed to write audit log entry: %s",
                str(e),
                extra={"request_id": eff_request_id, "action": action},
            )
            if auto_commit:
                db.rollback()

        # Structured application logging
        logger.info(
            "AUDIT_EVENT: action=%s entity_type=%s entity_id=%s outcome=%s actor_id=%s",
            audit_entry.action,
            audit_entry.entity_type,
            audit_entry.entity_id,
            audit_entry.outcome,
            audit_entry.actor_user_id,
            extra={
                "request_id": eff_request_id,
                "action": audit_entry.action,
                "entity_type": audit_entry.entity_type,
                "entity_id": audit_entry.entity_id,
                "outcome": audit_entry.outcome,
                "actor_user_id": audit_entry.actor_user_id,
            },
        )

        return audit_entry

    @staticmethod
    def list_audit_logs(
        db: Session,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        actor_user_id: Optional[int] = None,
        outcome: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> AuditLogsListOut:
        """
        List and filter audit trail logs for administrative review.
        """
        query = db.query(AuditLog).options(joinedload(AuditLog.actor))

        if action:
            query = query.filter(AuditLog.action == action.upper())
        if entity_type:
            query = query.filter(AuditLog.entity_type == entity_type.lower())
        if actor_user_id is not None:
            query = query.filter(AuditLog.actor_user_id == actor_user_id)
        if outcome:
            query = query.filter(AuditLog.outcome == outcome.lower())
        if date_from:
            query = query.filter(AuditLog.timestamp >= date_from)
        if date_to:
            query = query.filter(AuditLog.timestamp <= date_to)

        total = query.count()
        logs = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

        formatted_logs: List[AuditLogOut] = []
        for l in logs:
            formatted_logs.append(
                AuditLogOut(
                    id=l.id,
                    actor_user_id=l.actor_user_id,
                    actor_name=l.actor.full_name if l.actor else None,
                    actor_email=l.actor.email if l.actor else None,
                    action=l.action,
                    entity_type=l.entity_type,
                    entity_id=l.entity_id,
                    outcome=l.outcome,
                    request_id=l.request_id,
                    ip_address=l.ip_address,
                    metadata_json=l.metadata_json,
                    timestamp=l.timestamp,
                )
            )

        return AuditLogsListOut(
            total=total,
            skip=skip,
            limit=limit,
            logs=formatted_logs,
        )
