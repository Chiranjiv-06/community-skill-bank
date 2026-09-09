"""
app/services/analytics_service.py

Module 16 — Analytics & Dashboard Service for Community Skill Bank.
Provides performant, read-only database-side SQL aggregations across domain tables:
- Emergencies & Requirements
- Volunteers & Profiles
- Skills & Coverage
- Assignments & Response Pipeline
- Community Preparedness & Participation
- Trainings & Certifications
- Notifications
- Geographic summaries
"""

from datetime import datetime
from typing import Optional, Dict, Any, List

from sqlalchemy import func, case, and_, or_, desc
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.models import Skill, Emergency
from app.models.volunteer_profile import VolunteerProfile
from app.models.emergency_requirement import EmergencyRequirement
from app.models.emergency_assignment import EmergencyAssignment
from app.models.volunteer_certification import VolunteerCertification
from app.models.volunteer_training import VolunteerTraining
from app.models.assignment_feedback import AssignmentFeedback
from app.models.community_activity import CommunityActivity
from app.models.community_participation import CommunityParticipation
from app.models.notification import Notification

from app.schemas.schemas import (
    EmergencyAnalyticsOut,
    EmergencyStatusBreakdown,
    EmergencySeverityBreakdown,
    VolunteerAnalyticsOut,
    UserRoleBreakdown,
    SkillCoverageAnalyticsOut,
    ResponseAnalyticsOut,
    AssignmentStatusBreakdown,
    CommunityAnalyticsOut,
    TrainingCertificationAnalyticsOut,
    NotificationAnalyticsOut,
    GeographicAnalyticsOut,
    DashboardAnalyticsOut,
)


# ---------------------------------------------------------------------------
# 1. Emergency Analytics
# ---------------------------------------------------------------------------

def get_emergency_analytics(
    db: Session,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    category: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
) -> EmergencyAnalyticsOut:
    """
    Calculate aggregate emergency metrics with optional filtering.
    """
    filters = []
    if date_from:
        filters.append(Emergency.created_at >= date_from)
    if date_to:
        filters.append(Emergency.created_at <= date_to)
    if category:
        filters.append(Emergency.category == category)
    if severity:
        filters.append(Emergency.severity == severity)
    if status:
        filters.append(Emergency.status == status)

    # Status and severity breakdown in single aggregation query
    stats_row = db.query(
        func.count(Emergency.id).label("total"),
        func.sum(case((Emergency.status == "open", 1), else_=0)).label("open"),
        func.sum(case((Emergency.status == "in_progress", 1), else_=0)).label("in_progress"),
        func.sum(case((Emergency.status == "resolved", 1), else_=0)).label("resolved"),
        func.sum(case((Emergency.status == "cancelled", 1), else_=0)).label("cancelled"),
        func.sum(case((Emergency.severity == "critical", 1), else_=0)).label("critical"),
        func.sum(case((Emergency.severity == "high", 1), else_=0)).label("high"),
        func.sum(case((Emergency.severity == "medium", 1), else_=0)).label("medium"),
        func.sum(case((Emergency.severity == "low", 1), else_=0)).label("low"),
        func.sum(case((and_(Emergency.latitude.isnot(None), Emergency.longitude.isnot(None)), 1), else_=0)).label("with_coords"),
        func.sum(case((or_(Emergency.latitude.is_(None), Emergency.longitude.is_(None)), 1), else_=0)).label("without_coords"),
    ).filter(*filters).first()

    total = stats_row.total if stats_row and stats_row.total else 0
    status_breakdown = EmergencyStatusBreakdown(
        open=int(stats_row.open or 0) if stats_row else 0,
        in_progress=int(stats_row.in_progress or 0) if stats_row else 0,
        resolved=int(stats_row.resolved or 0) if stats_row else 0,
        cancelled=int(stats_row.cancelled or 0) if stats_row else 0,
    )
    severity_breakdown = EmergencySeverityBreakdown(
        critical=int(stats_row.critical or 0) if stats_row else 0,
        high=int(stats_row.high or 0) if stats_row else 0,
        medium=int(stats_row.medium or 0) if stats_row else 0,
        low=int(stats_row.low or 0) if stats_row else 0,
    )

    # By category
    cat_rows = db.query(
        Emergency.category,
        func.count(Emergency.id)
    ).filter(*filters).group_by(Emergency.category).all()
    by_category = {cat: count for cat, count in cat_rows if cat}

    # Requirements stats
    req_query = db.query(
        func.count(EmergencyRequirement.id).label("total_reqs"),
        func.coalesce(func.sum(EmergencyRequirement.min_volunteers_needed), 0).label("total_headcount")
    )
    if filters:
        req_query = req_query.join(Emergency, EmergencyRequirement.emergency_id == Emergency.id).filter(*filters)
    req_stats = req_query.first()

    total_requirements = int(req_stats.total_reqs or 0) if req_stats else 0
    total_required_headcount = int(req_stats.total_headcount or 0) if req_stats else 0

    # Active response headcount (distinct volunteers with active assignment status)
    active_statuses = ["assigned", "in_progress", "completed"]
    assign_query = db.query(
        func.count(func.distinct(EmergencyAssignment.volunteer_id))
    ).filter(EmergencyAssignment.status.in_(active_statuses))

    if filters:
        assign_query = assign_query.join(Emergency, EmergencyAssignment.emergency_id == Emergency.id).filter(*filters)

    active_response_headcount = assign_query.scalar() or 0

    return EmergencyAnalyticsOut(
        total_emergencies=total,
        by_status=status_breakdown,
        by_severity=severity_breakdown,
        by_category=by_category,
        total_requirements=total_requirements,
        total_required_headcount=total_required_headcount,
        active_response_headcount=active_response_headcount,
        emergencies_with_coordinates=int(stats_row.with_coords or 0) if stats_row else 0,
        emergencies_without_coordinates=int(stats_row.without_coords or 0) if stats_row else 0,
    )


# ---------------------------------------------------------------------------
# 2. Volunteer Analytics
# ---------------------------------------------------------------------------

def get_volunteer_analytics(
    db: Session,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
) -> VolunteerAnalyticsOut:
    """
    Calculate aggregate volunteer and user metrics without exposing sensitive PII.
    """
    filters = []
    if date_from:
        filters.append(User.created_at >= date_from)
    if date_to:
        filters.append(User.created_at <= date_to)

    stats_row = db.query(
        func.count(User.id).label("total"),
        func.sum(case((User.is_active.is_(True), 1), else_=0)).label("active"),
        func.sum(case((User.is_active.is_(False), 1), else_=0)).label("inactive"),
        func.sum(case((User.role == "admin", 1), else_=0)).label("admin"),
        func.sum(case((User.role == "skilled_volunteer", 1), else_=0)).label("skilled_volunteer"),
        func.sum(case((User.role == "citizen_volunteer", 1), else_=0)).label("citizen_volunteer"),
        func.sum(case((User.role == "volunteer", 1), else_=0)).label("volunteer"),
        func.sum(case((and_(User.latitude.isnot(None), User.longitude.isnot(None)), 1), else_=0)).label("with_coords"),
        func.sum(case((or_(User.latitude.is_(None), User.longitude.is_(None)), 1), else_=0)).label("without_coords"),
    ).filter(*filters).first()

    total = stats_row.total if stats_row and stats_row.total else 0
    role_breakdown = UserRoleBreakdown(
        admin=int(stats_row.admin or 0) if stats_row else 0,
        skilled_volunteer=int(stats_row.skilled_volunteer or 0) if stats_row else 0,
        citizen_volunteer=int(stats_row.citizen_volunteer or 0) if stats_row else 0,
        volunteer=int(stats_row.volunteer or 0) if stats_row else 0,
    )

    # Distinct users with skills
    volunteers_with_skills = db.query(func.count(func.distinct(Skill.owner_id))).scalar() or 0
    # Volunteers with profile
    volunteers_with_profile = db.query(func.count(VolunteerProfile.id)).scalar() or 0
    # Distinct users with certifications
    volunteers_with_certs = db.query(func.count(func.distinct(VolunteerCertification.user_id))).scalar() or 0
    # Distinct users with trainings
    volunteers_with_trainings = db.query(func.count(func.distinct(VolunteerTraining.user_id))).scalar() or 0

    # Availability distribution
    avail_rows = db.query(
        User.availability,
        func.count(User.id)
    ).filter(*filters, User.availability.isnot(None)).group_by(User.availability).all()
    availability_dist = {avail: count for avail, count in avail_rows if avail}

    # Transportation distribution
    trans_rows = db.query(
        VolunteerProfile.transportation_type,
        func.count(VolunteerProfile.id)
    ).filter(VolunteerProfile.transportation_type.isnot(None)).group_by(VolunteerProfile.transportation_type).all()
    transportation_dist = {trans: count for trans, count in trans_rows if trans}

    return VolunteerAnalyticsOut(
        total_users=total,
        active_users=int(stats_row.active or 0) if stats_row else 0,
        inactive_users=int(stats_row.inactive or 0) if stats_row else 0,
        by_role=role_breakdown,
        volunteers_with_skills=volunteers_with_skills,
        volunteers_with_profile=volunteers_with_profile,
        volunteers_with_certifications=volunteers_with_certs,
        volunteers_with_trainings=volunteers_with_trainings,
        volunteers_with_coordinates=int(stats_row.with_coords or 0) if stats_row else 0,
        volunteers_without_coordinates=int(stats_row.without_coords or 0) if stats_row else 0,
        availability_distribution=availability_dist,
        transportation_distribution=transportation_dist,
    )


# ---------------------------------------------------------------------------
# 3. Skill Coverage Analytics
# ---------------------------------------------------------------------------

def get_skill_coverage_analytics(db: Session) -> SkillCoverageAnalyticsOut:
    """
    Calculate skill coverage across categories, proficiencies, and emergency requirements.
    """
    total_skills = db.query(func.count(Skill.id)).scalar() or 0

    cat_rows = db.query(
        Skill.category,
        func.count(Skill.id)
    ).group_by(Skill.category).all()
    by_category = {cat: count for cat, count in cat_rows if cat}

    prof_rows = db.query(
        Skill.proficiency,
        func.count(Skill.id)
    ).group_by(Skill.proficiency).all()
    by_proficiency = {prof: count for prof, count in prof_rows if prof}

    # Top skills
    top_skill_rows = db.query(
        Skill.title,
        Skill.category,
        func.count(Skill.id).label("count")
    ).group_by(Skill.title, Skill.category).order_by(desc("count")).limit(10).all()

    top_skills = [
        {"title": r.title, "category": r.category, "count": r.count}
        for r in top_skill_rows
    ]

    # Requirement category coverage vs skill availability
    req_cat_rows = db.query(
        EmergencyRequirement.skill_category,
        func.count(EmergencyRequirement.id).label("req_count"),
        func.coalesce(func.sum(EmergencyRequirement.min_volunteers_needed), 0).label("headcount_needed")
    ).group_by(EmergencyRequirement.skill_category).all()

    coverage_map: Dict[str, Dict[str, int]] = {}
    for r in req_cat_rows:
        cat = r.skill_category
        coverage_map[cat] = {
            "skills_available": by_category.get(cat, 0),
            "requirements_posted": r.req_count,
            "headcount_needed": int(r.headcount_needed),
        }

    # Add any skill categories that have no requirements posted yet
    for cat, count in by_category.items():
        if cat not in coverage_map:
            coverage_map[cat] = {
                "skills_available": count,
                "requirements_posted": 0,
                "headcount_needed": 0,
            }

    return SkillCoverageAnalyticsOut(
        total_skills=total_skills,
        by_category=by_category,
        by_proficiency=by_proficiency,
        top_skills=top_skills,
        requirement_category_coverage=coverage_map,
    )


# ---------------------------------------------------------------------------
# 4. Response & Assignment Analytics
# ---------------------------------------------------------------------------

def get_response_analytics(
    db: Session,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
) -> ResponseAnalyticsOut:
    """
    Calculate assignment lifecycle metrics, completion rate, acceptance rate, and feedback summary.
    """
    filters = []
    if date_from:
        filters.append(EmergencyAssignment.created_at >= date_from)
    if date_to:
        filters.append(EmergencyAssignment.created_at <= date_to)

    stats_row = db.query(
        func.count(EmergencyAssignment.id).label("total"),
        func.sum(case((EmergencyAssignment.status == "pending", 1), else_=0)).label("pending"),
        func.sum(case((EmergencyAssignment.status == "accepted", 1), else_=0)).label("accepted"),
        func.sum(case((EmergencyAssignment.status == "assigned", 1), else_=0)).label("assigned"),
        func.sum(case((EmergencyAssignment.status == "in_progress", 1), else_=0)).label("in_progress"),
        func.sum(case((EmergencyAssignment.status == "completed", 1), else_=0)).label("completed"),
        func.sum(case((EmergencyAssignment.status == "rejected", 1), else_=0)).label("rejected"),
        func.sum(case((EmergencyAssignment.status == "cancelled", 1), else_=0)).label("cancelled"),
    ).filter(*filters).first()

    total = stats_row.total if stats_row and stats_row.total else 0
    p_cnt = int(stats_row.pending or 0) if stats_row else 0
    acc_cnt = int(stats_row.accepted or 0) if stats_row else 0
    asg_cnt = int(stats_row.assigned or 0) if stats_row else 0
    inp_cnt = int(stats_row.in_progress or 0) if stats_row else 0
    cmp_cnt = int(stats_row.completed or 0) if stats_row else 0
    rej_cnt = int(stats_row.rejected or 0) if stats_row else 0
    cnc_cnt = int(stats_row.cancelled or 0) if stats_row else 0

    breakdown = AssignmentStatusBreakdown(
        pending=p_cnt,
        accepted=acc_cnt,
        assigned=asg_cnt,
        in_progress=inp_cnt,
        completed=cmp_cnt,
        rejected=rej_cnt,
        cancelled=cnc_cnt,
    )

    # Active assignments count: assigned + in_progress + completed
    active_count = asg_cnt + inp_cnt + cmp_cnt
    pending_pipeline = p_cnt + acc_cnt

    # Unique active volunteers deployed
    unique_active = db.query(
        func.count(func.distinct(EmergencyAssignment.volunteer_id))
    ).filter(*filters, EmergencyAssignment.status.in_(["assigned", "in_progress", "completed"])).scalar() or 0

    # Acceptance rate = (accepted + assigned + in_progress + completed) / total (if total > 0)
    acceptance_rate = round((acc_cnt + asg_cnt + inp_cnt + cmp_cnt) / total, 4) if total > 0 else 0.0
    # Completion rate = completed / (assigned + in_progress + completed) (if active_count > 0)
    completion_rate = round(cmp_cnt / active_count, 4) if active_count > 0 else 0.0

    # Feedback stats
    fb_filters = []
    if date_from:
        fb_filters.append(AssignmentFeedback.created_at >= date_from)
    if date_to:
        fb_filters.append(AssignmentFeedback.created_at <= date_to)

    fb_stats = db.query(
        func.count(AssignmentFeedback.id).label("total"),
        func.coalesce(func.avg(AssignmentFeedback.rating), 0.0).label("avg_rating"),
        func.coalesce(func.sum(AssignmentFeedback.hours_served), 0.0).label("total_hours")
    ).filter(*fb_filters).first()

    total_feedbacks = int(fb_stats.total or 0) if fb_stats else 0
    average_rating = round(float(fb_stats.avg_rating or 0.0), 2) if fb_stats else 0.0
    total_service_hours = round(float(fb_stats.total_hours or 0.0), 2) if fb_stats else 0.0

    return ResponseAnalyticsOut(
        total_assignments=total,
        by_status=breakdown,
        active_assignments_count=active_count,
        pending_pipeline_count=pending_pipeline,
        unique_active_volunteers_deployed=unique_active,
        acceptance_rate=acceptance_rate,
        completion_rate=completion_rate,
        total_feedbacks=total_feedbacks,
        average_rating=average_rating,
        total_service_hours=total_service_hours,
    )


# ---------------------------------------------------------------------------
# 5. Community Preparedness Analytics
# ---------------------------------------------------------------------------

def get_community_analytics(
    db: Session,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
) -> CommunityAnalyticsOut:
    """
    Calculate metrics for community activities and volunteer participation.
    """
    act_filters = []
    if date_from:
        act_filters.append(CommunityActivity.created_at >= date_from)
    if date_to:
        act_filters.append(CommunityActivity.created_at <= date_to)

    total_activities = db.query(func.count(CommunityActivity.id)).filter(*act_filters).scalar() or 0

    status_rows = db.query(
        CommunityActivity.status,
        func.count(CommunityActivity.id)
    ).filter(*act_filters).group_by(CommunityActivity.status).all()
    by_status = {st: count for st, count in status_rows if st}

    type_rows = db.query(
        CommunityActivity.activity_type,
        func.count(CommunityActivity.id)
    ).filter(*act_filters).group_by(CommunityActivity.activity_type).all()
    by_type = {tp: count for tp, count in type_rows if tp}

    # Participations
    part_filters = []
    if date_from:
        part_filters.append(CommunityParticipation.created_at >= date_from)
    if date_to:
        part_filters.append(CommunityParticipation.created_at <= date_to)

    part_stats = db.query(
        func.count(CommunityParticipation.id).label("total"),
        func.sum(case((CommunityParticipation.status.in_(["attended", "completed"]), 1), else_=0)).label("attended_or_completed"),
        func.coalesce(func.sum(CommunityParticipation.participation_hours), 0.0).label("total_hours"),
    ).filter(*part_filters).first()

    total_participations = int(part_stats.total or 0) if part_stats else 0
    attended_completed = int(part_stats.attended_or_completed or 0) if part_stats else 0
    total_hours = round(float(part_stats.total_hours or 0.0), 2) if part_stats else 0.0

    part_status_rows = db.query(
        CommunityParticipation.status,
        func.count(CommunityParticipation.id)
    ).filter(*part_filters).group_by(CommunityParticipation.status).all()
    participations_by_status = {st: count for st, count in part_status_rows if st}

    return CommunityAnalyticsOut(
        total_activities=total_activities,
        by_status=by_status,
        by_type=by_type,
        total_participations=total_participations,
        participations_by_status=participations_by_status,
        total_attended_or_completed=attended_completed,
        total_community_hours_awarded=total_hours,
    )


# ---------------------------------------------------------------------------
# 6. Training & Certification Analytics
# ---------------------------------------------------------------------------

def get_training_certification_analytics(db: Session) -> TrainingCertificationAnalyticsOut:
    """
    Calculate metrics for structured certifications and training records.
    """
    # Certifications
    total_certs = db.query(func.count(VolunteerCertification.id)).scalar() or 0
    cert_status_rows = db.query(
        VolunteerCertification.verification_status,
        func.count(VolunteerCertification.id)
    ).group_by(VolunteerCertification.verification_status).all()
    cert_by_status = {st: count for st, count in cert_status_rows if st}
    active_verified = cert_by_status.get("verified", 0)

    # Trainings
    total_trainings = db.query(func.count(VolunteerTraining.id)).scalar() or 0
    train_status_rows = db.query(
        VolunteerTraining.status,
        func.count(VolunteerTraining.id)
    ).group_by(VolunteerTraining.status).all()
    train_by_status = {st: count for st, count in train_status_rows if st}

    total_training_hours = db.query(
        func.coalesce(func.sum(VolunteerTraining.hours_completed), 0)
    ).filter(VolunteerTraining.status.in_(["completed", "verified"])).scalar() or 0

    return TrainingCertificationAnalyticsOut(
        total_certifications=total_certs,
        certifications_by_status=cert_by_status,
        active_verified_certifications=active_verified,
        total_trainings=total_trainings,
        trainings_by_status=train_by_status,
        total_training_hours_completed=int(total_training_hours),
    )


# ---------------------------------------------------------------------------
# 7. Notification Analytics
# ---------------------------------------------------------------------------

def get_notification_analytics(
    db: Session,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
) -> NotificationAnalyticsOut:
    """
    Calculate notification volume, read rate, and breakdown by type & severity.
    """
    filters = []
    if date_from:
        filters.append(Notification.created_at >= date_from)
    if date_to:
        filters.append(Notification.created_at <= date_to)

    stats_row = db.query(
        func.count(Notification.id).label("total"),
        func.sum(case((Notification.is_read.is_(True), 1), else_=0)).label("read_count"),
        func.sum(case((Notification.is_read.is_(False), 1), else_=0)).label("unread_count"),
    ).filter(*filters).first()

    total = int(stats_row.total or 0) if stats_row else 0
    read_cnt = int(stats_row.read_count or 0) if stats_row else 0
    unread_cnt = int(stats_row.unread_count or 0) if stats_row else 0
    read_rate = round(read_cnt / total, 4) if total > 0 else 0.0

    type_rows = db.query(
        Notification.type,
        func.count(Notification.id)
    ).filter(*filters).group_by(Notification.type).all()
    by_type = {tp: count for tp, count in type_rows if tp}

    sev_rows = db.query(
        Notification.severity,
        func.count(Notification.id)
    ).filter(*filters).group_by(Notification.severity).all()
    by_sev = {sv: count for sv, count in sev_rows if sv}

    return NotificationAnalyticsOut(
        total_notifications=total,
        read_notifications=read_cnt,
        unread_notifications=unread_cnt,
        read_rate=read_rate,
        by_type=by_type,
        by_severity=by_sev,
    )


# ---------------------------------------------------------------------------
# 8. Geographic Analytics
# ---------------------------------------------------------------------------

def get_geographic_analytics(db: Session) -> GeographicAnalyticsOut:
    """
    Calculate aggregate geographic metrics without exposing individual coordinates.
    """
    em_stats = db.query(
        func.sum(case((and_(Emergency.latitude.isnot(None), Emergency.longitude.isnot(None)), 1), else_=0)).label("with_coords"),
        func.sum(case((or_(Emergency.latitude.is_(None), Emergency.longitude.is_(None)), 1), else_=0)).label("without_coords"),
    ).first()

    vol_stats = db.query(
        func.sum(case((and_(User.latitude.isnot(None), User.longitude.isnot(None)), 1), else_=0)).label("with_coords"),
        func.sum(case((or_(User.latitude.is_(None), User.longitude.is_(None)), 1), else_=0)).label("without_coords"),
    ).first()

    # Aggregate location name counts
    em_loc_rows = db.query(
        Emergency.location,
        func.count(Emergency.id)
    ).filter(Emergency.location.isnot(None)).group_by(Emergency.location).all()
    em_by_location = {loc: count for loc, count in em_loc_rows if loc}

    vol_loc_rows = db.query(
        User.location,
        func.count(User.id)
    ).filter(User.location.isnot(None)).group_by(User.location).all()
    vol_by_location = {loc: count for loc, count in vol_loc_rows if loc}

    return GeographicAnalyticsOut(
        emergencies_with_coordinates=int(em_stats.with_coords or 0) if em_stats else 0,
        emergencies_without_coordinates=int(em_stats.without_coords or 0) if em_stats else 0,
        volunteers_with_coordinates=int(vol_stats.with_coords or 0) if vol_stats else 0,
        volunteers_without_coordinates=int(vol_stats.without_coords or 0) if vol_stats else 0,
        emergencies_by_location=em_by_location,
        volunteers_by_location=vol_by_location,
    )


# ---------------------------------------------------------------------------
# 9. Master Dashboard Summary
# ---------------------------------------------------------------------------

def get_dashboard_summary(db: Session) -> DashboardAnalyticsOut:
    """
    Generate the master admin dashboard overview in a structured format.
    """
    return DashboardAnalyticsOut(
        emergencies=get_emergency_analytics(db),
        volunteers=get_volunteer_analytics(db),
        skills=get_skill_coverage_analytics(db),
        response=get_response_analytics(db),
        community=get_community_analytics(db),
        training=get_training_certification_analytics(db),
        notifications=get_notification_analytics(db),
        geographic=get_geographic_analytics(db),
    )
