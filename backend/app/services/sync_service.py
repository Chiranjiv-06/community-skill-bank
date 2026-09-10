"""
app/services/sync_service.py

Module 18 — Offline Synchronization & Conflict Resolution Service for Community Skill Bank.
Provides:
- Notification catch-up queries with timestamp delta filtering
- Domain delta change feeds (emergencies, assignments, community activities)
- Safe, narrow batch action replay with server-authoritative conflict detection
- Idempotent request handling ensuring zero duplicate operations
"""

from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from app.models.user import User
from app.models.models import Emergency
from app.models.emergency_assignment import EmergencyAssignment
from app.models.community_activity import CommunityActivity
from app.models.community_participation import CommunityParticipation
from app.models.notification import Notification
from app.services.notification_service import NotificationService
from app.services.audit_service import AuditService
from app.schemas.schemas import (
    NotificationOut,
    NotificationSyncOut,
    SyncChangesOut,
    SyncEmergencyItem,
    SyncAssignmentItem,
    SyncCommunityActivityItem,
    SyncCommunityParticipationItem,
    SyncBatchRequest,
    SyncBatchResponse,
    SyncActionResultItem,
    SyncActionConflictItem,
    SyncActionRejectedItem,
)


class SyncService:

    @staticmethod
    def sync_notifications(
        db: Session,
        user_id: int,
        since: Optional[datetime] = None,
        limit: int = 50,
    ) -> NotificationSyncOut:
        """
        Retrieve notifications for catch-up synchronization since a specific timestamp.
        Strictly enforces user isolation.
        """
        query = db.query(Notification).filter(Notification.user_id == user_id)

        if since:
            query = query.filter(Notification.created_at >= since)

        notifications = (
            query.order_by(Notification.created_at.desc())
            .limit(limit)
            .all()
        )

        unread_count = NotificationService.get_unread_count(db=db, user_id=user_id)
        now = datetime.now(timezone.utc)

        notif_items = [NotificationOut.model_validate(n) for n in notifications]

        return NotificationSyncOut(
            server_time=now,
            unread_count=unread_count,
            notifications=notif_items,
        )

    @staticmethod
    def get_delta_changes(
        db: Session,
        user: User,
        since: Optional[datetime] = None,
        limit: int = 50,
    ) -> SyncChangesOut:
        """
        Return delta changes across relevant domain entities updated on or after `since`.
        Ensures strict user privacy and role-based data filtering.
        """
        now = datetime.now(timezone.utc)

        # 1. Emergencies (Public view: open/in_progress/resolved; Admin: all)
        em_query = db.query(Emergency)
        if since:
            em_query = em_query.filter(
                or_(
                    Emergency.updated_at >= since,
                    Emergency.created_at >= since,
                )
            )
        if user.role != "admin":
            em_query = em_query.filter(Emergency.status.in_(["open", "in_progress", "resolved"]))

        emergencies = em_query.order_by(Emergency.updated_at.desc()).limit(limit).all()
        em_items = [SyncEmergencyItem.model_validate(e) for e in emergencies]

        # 2. User's Assignments
        asg_query = db.query(EmergencyAssignment).filter(EmergencyAssignment.volunteer_id == user.id)
        if since:
            asg_query = asg_query.filter(
                or_(
                    EmergencyAssignment.updated_at >= since,
                    EmergencyAssignment.created_at >= since,
                )
            )
        assignments = asg_query.order_by(EmergencyAssignment.updated_at.desc()).limit(limit).all()
        asg_items = [SyncAssignmentItem.model_validate(a) for a in assignments]

        # 3. Community Activities
        act_query = db.query(CommunityActivity).filter(CommunityActivity.status.in_(["published", "ongoing", "completed"]))
        if since:
            act_query = act_query.filter(
                or_(
                    CommunityActivity.updated_at >= since,
                    CommunityActivity.created_at >= since,
                )
            )
        activities = act_query.order_by(CommunityActivity.updated_at.desc()).limit(limit).all()
        act_items = [SyncCommunityActivityItem.model_validate(ac) for ac in activities]

        # 4. User's Community Participations
        part_query = db.query(CommunityParticipation).filter(CommunityParticipation.volunteer_id == user.id)
        if since:
            part_query = part_query.filter(
                or_(
                    CommunityParticipation.updated_at >= since,
                    CommunityParticipation.created_at >= since,
                )
            )
        participations = part_query.order_by(CommunityParticipation.updated_at.desc()).limit(limit).all()
        part_items = [SyncCommunityParticipationItem.model_validate(p) for p in participations]

        return SyncChangesOut(
            server_time=now,
            since=since,
            emergencies=em_items,
            my_assignments=asg_items,
            community_activities=act_items,
            my_participations=part_items,
        )

    @staticmethod
    def process_batch_sync(
        db: Session,
        user: User,
        request: SyncBatchRequest,
    ) -> SyncBatchResponse:
        """
        Process a batch of queued client actions with server-authoritative conflict resolution
        and idempotent deduplication.
        """
        now = datetime.now(timezone.utc)
        accepted: List[SyncActionResultItem] = []
        conflicts: List[SyncActionConflictItem] = []
        rejected: List[SyncActionRejectedItem] = []

        for action in request.actions:
            action_id = action.client_action_id
            action_type = action.action_type
            payload = action.payload or {}

            try:
                # -----------------------------------------------------------
                # Action: assignment_response (Accept / Reject assignment)
                # -----------------------------------------------------------
                if action_type == "assignment_response":
                    asg_id = payload.get("assignment_id")
                    resp_choice = payload.get("response")
                    notes = payload.get("notes")

                    if not asg_id or resp_choice not in ("accepted", "rejected"):
                        rejected.append(SyncActionRejectedItem(
                            client_action_id=action_id,
                            action_type=action_type,
                            error="Invalid payload: assignment_id and valid response ('accepted'/'rejected') required",
                        ))
                        continue

                    asg = db.query(EmergencyAssignment).filter(
                        EmergencyAssignment.id == asg_id,
                        EmergencyAssignment.volunteer_id == user.id,
                    ).first()

                    if not asg:
                        rejected.append(SyncActionRejectedItem(
                            client_action_id=action_id,
                            action_type=action_type,
                            error="Assignment not found or does not belong to user",
                        ))
                        continue

                    # Idempotency check: Already in the desired state
                    if asg.status == resp_choice:
                        accepted.append(SyncActionResultItem(
                            client_action_id=action_id,
                            action_type=action_type,
                            message=f"Assignment was already {resp_choice} (idempotent)",
                            data={"assignment_id": asg.id, "status": asg.status},
                        ))
                        continue

                    # Server-authoritative conflict checks
                    if asg.status == "cancelled":
                        reason = "Assignment was cancelled by administrators on the server"
                        conflicts.append(SyncActionConflictItem(
                            client_action_id=action_id,
                            action_type=action_type,
                            reason=reason,
                            server_state={"status": "cancelled"},
                        ))
                        AuditService.record_event(
                            db=db,
                            action="SYNC_CONFLICT",
                            entity_type="sync_action",
                            entity_id=asg.id,
                            actor_user_id=user.id,
                            outcome="conflict",
                            metadata={
                                "action_type": action_type,
                                "client_action_id": action_id,
                                "reason": reason,
                            },
                        )
                        continue

                    if asg.status in ("completed", "rejected") and resp_choice == "accepted":
                        reason = f"Assignment is in terminal state '{asg.status}' on server"
                        conflicts.append(SyncActionConflictItem(
                            client_action_id=action_id,
                            action_type=action_type,
                            reason=reason,
                            server_state={"status": asg.status},
                        ))
                        AuditService.record_event(
                            db=db,
                            action="SYNC_CONFLICT",
                            entity_type="sync_action",
                            entity_id=asg.id,
                            actor_user_id=user.id,
                            outcome="conflict",
                            metadata={
                                "action_type": action_type,
                                "client_action_id": action_id,
                                "reason": reason,
                            },
                        )
                        continue

                    if asg.emergency and asg.emergency.status in ("resolved", "cancelled"):
                        reason = f"Associated emergency is {asg.emergency.status} on server"
                        conflicts.append(SyncActionConflictItem(
                            client_action_id=action_id,
                            action_type=action_type,
                            reason=reason,
                            server_state={"emergency_status": asg.emergency.status},
                        ))
                        AuditService.record_event(
                            db=db,
                            action="SYNC_CONFLICT",
                            entity_type="sync_action",
                            entity_id=asg.id,
                            actor_user_id=user.id,
                            outcome="conflict",
                            metadata={
                                "action_type": action_type,
                                "client_action_id": action_id,
                                "reason": reason,
                            },
                        )
                        continue

                    # Apply mutation
                    asg.status = resp_choice
                    asg.responded_at = now
                    if notes:
                        asg.volunteer_notes = notes
                    db.commit()
                    db.refresh(asg)

                    accepted.append(SyncActionResultItem(
                        client_action_id=action_id,
                        action_type=action_type,
                        message=f"Assignment successfully {resp_choice}",
                        data={"assignment_id": asg.id, "status": asg.status},
                    ))

                # -----------------------------------------------------------
                # Action: mark_notification_read
                # -----------------------------------------------------------
                elif action_type == "mark_notification_read":
                    notif_id = payload.get("notification_id")
                    if not notif_id:
                        rejected.append(SyncActionRejectedItem(
                            client_action_id=action_id,
                            action_type=action_type,
                            error="Missing notification_id in payload",
                        ))
                        continue

                    notif = db.query(Notification).filter(
                        Notification.id == notif_id,
                        Notification.user_id == user.id,
                    ).first()

                    if not notif:
                        rejected.append(SyncActionRejectedItem(
                            client_action_id=action_id,
                            action_type=action_type,
                            error="Notification not found or does not belong to user",
                        ))
                        continue

                    # Idempotent if already read
                    if notif.is_read:
                        accepted.append(SyncActionResultItem(
                            client_action_id=action_id,
                            action_type=action_type,
                            message="Notification was already marked as read",
                            data={"notification_id": notif.id, "is_read": True},
                        ))
                        continue

                    notif.is_read = True
                    notif.read_at = now
                    db.commit()
                    db.refresh(notif)

                    accepted.append(SyncActionResultItem(
                        client_action_id=action_id,
                        action_type=action_type,
                        message="Notification marked as read",
                        data={"notification_id": notif.id, "is_read": True},
                    ))

                # -----------------------------------------------------------
                # Action: community_rsvp
                # -----------------------------------------------------------
                elif action_type == "community_rsvp":
                    activity_id = payload.get("activity_id")
                    if not activity_id:
                        rejected.append(SyncActionRejectedItem(
                            client_action_id=action_id,
                            action_type=action_type,
                            error="Missing activity_id in payload",
                        ))
                        continue

                    activity = db.query(CommunityActivity).filter(CommunityActivity.id == activity_id).first()
                    if not activity:
                        rejected.append(SyncActionRejectedItem(
                            client_action_id=action_id,
                            action_type=action_type,
                            error="Community activity not found",
                        ))
                        continue

                    # Conflict check: Activity cancelled or completed
                    if activity.status in ("cancelled", "completed"):
                        reason = f"Activity status is '{activity.status}' on server"
                        conflicts.append(SyncActionConflictItem(
                            client_action_id=action_id,
                            action_type=action_type,
                            reason=reason,
                            server_state={"activity_status": activity.status},
                        ))
                        AuditService.record_event(
                            db=db,
                            action="SYNC_CONFLICT",
                            entity_type="sync_action",
                            entity_id=activity.id,
                            actor_user_id=user.id,
                            outcome="conflict",
                            metadata={
                                "action_type": action_type,
                                "client_action_id": action_id,
                                "reason": reason,
                            },
                        )
                        continue

                    # Idempotency check: Already registered
                    existing_part = db.query(CommunityParticipation).filter(
                        CommunityParticipation.activity_id == activity_id,
                        CommunityParticipation.volunteer_id == user.id,
                    ).first()

                    if existing_part:
                        accepted.append(SyncActionResultItem(
                            client_action_id=action_id,
                            action_type=action_type,
                            message="User is already registered for this activity (idempotent)",
                            data={"participation_id": existing_part.id, "status": existing_part.status},
                        ))
                        continue

                    # Capacity conflict check
                    if activity.capacity is not None:
                        current_reg = db.query(func.count(CommunityParticipation.id)).filter(
                            CommunityParticipation.activity_id == activity_id,
                            CommunityParticipation.status != "withdrawn",
                        ).scalar() or 0
                        if current_reg >= activity.capacity:
                            reason = "Activity has reached maximum registration capacity"
                            conflicts.append(SyncActionConflictItem(
                                client_action_id=action_id,
                                action_type=action_type,
                                reason=reason,
                                server_state={"capacity": activity.capacity, "registered": current_reg},
                            ))
                            AuditService.record_event(
                                db=db,
                                action="SYNC_CONFLICT",
                                entity_type="sync_action",
                                entity_id=activity.id,
                                actor_user_id=user.id,
                                outcome="conflict",
                                metadata={
                                    "action_type": action_type,
                                    "client_action_id": action_id,
                                    "reason": reason,
                                },
                            )
                            continue

                    # Create participation
                    new_part = CommunityParticipation(
                        activity_id=activity_id,
                        volunteer_id=user.id,
                        status="registered",
                    )
                    db.add(new_part)
                    db.commit()
                    db.refresh(new_part)

                    accepted.append(SyncActionResultItem(
                        client_action_id=action_id,
                        action_type=action_type,
                        message="Successfully registered for community activity",
                        data={"participation_id": new_part.id, "status": new_part.status},
                    ))

                # -----------------------------------------------------------
                # Action: volunteer_availability
                # -----------------------------------------------------------
                elif action_type == "volunteer_availability":
                    avail = payload.get("availability")
                    valid_avail = {"available", "busy", "unavailable"}
                    if avail not in valid_avail:
                        rejected.append(SyncActionRejectedItem(
                            client_action_id=action_id,
                            action_type=action_type,
                            error=f"Invalid availability '{avail}'. Allowed: {sorted(valid_avail)}",
                        ))
                        continue

                    if user.availability == avail:
                        accepted.append(SyncActionResultItem(
                            client_action_id=action_id,
                            action_type=action_type,
                            message="Availability was already up to date (idempotent)",
                            data={"availability": user.availability},
                        ))
                        continue

                    user.availability = avail
                    db.commit()
                    db.refresh(user)

                    accepted.append(SyncActionResultItem(
                        client_action_id=action_id,
                        action_type=action_type,
                        message="Volunteer availability successfully updated",
                        data={"availability": user.availability},
                    ))

                else:
                    rejected.append(SyncActionRejectedItem(
                        client_action_id=action_id,
                        action_type=action_type,
                        error=f"Unsupported action type: {action_type}",
                    ))

            except Exception as e:
                db.rollback()
                rejected.append(SyncActionRejectedItem(
                    client_action_id=action_id,
                    action_type=action_type,
                    error=f"Internal error processing action: {str(e)}",
                ))

        return SyncBatchResponse(
            server_time=now,
            accepted=accepted,
            conflicts=conflicts,
            rejected=rejected,
        )
