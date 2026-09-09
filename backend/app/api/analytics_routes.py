"""
app/api/analytics_routes.py

Module 16 — Analytics & Dashboard API endpoints.
Provides admin-only access to platform-wide operational statistics,
emergency intelligence metrics, volunteer workforce distribution,
skills coverage, assignment response rates, community preparedness,
trainings & certifications, and notifications analytics.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models.user import User
from app.utils.security import get_current_admin
from app.services import analytics_service
from app.schemas.schemas import (
    DashboardAnalyticsOut,
    EmergencyAnalyticsOut,
    VolunteerAnalyticsOut,
    SkillCoverageAnalyticsOut,
    ResponseAnalyticsOut,
    CommunityAnalyticsOut,
    TrainingCertificationAnalyticsOut,
    NotificationAnalyticsOut,
    GeographicAnalyticsOut,
)

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"],
)


@router.get(
    "/dashboard",
    response_model=DashboardAnalyticsOut,
    summary="Master platform analytics dashboard (Admin only)",
)
def get_dashboard_overview(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """
    Return comprehensive, multi-domain analytics overview for the admin dashboard.
    """
    return analytics_service.get_dashboard_summary(db)


@router.get(
    "/emergencies",
    response_model=EmergencyAnalyticsOut,
    summary="Emergency incident & requirement analytics (Admin only)",
)
def get_emergency_metrics(
    date_from: Optional[datetime] = Query(None, description="Filter emergencies created on or after this timestamp"),
    date_to: Optional[datetime] = Query(None, description="Filter emergencies created on or before this timestamp"),
    category: Optional[str] = Query(None, description="Filter by emergency category (e.g. fire, flood)"),
    severity: Optional[str] = Query(None, description="Filter by severity level (critical, high, medium, low)"),
    status: Optional[str] = Query(None, description="Filter by status (open, in_progress, resolved, cancelled)"),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """
    Return aggregated emergency metrics with optional filtering.
    """
    return analytics_service.get_emergency_analytics(
        db=db,
        date_from=date_from,
        date_to=date_to,
        category=category,
        severity=severity,
        status=status,
    )


@router.get(
    "/volunteers",
    response_model=VolunteerAnalyticsOut,
    summary="Volunteer workforce & profile analytics (Admin only)",
)
def get_volunteer_metrics(
    date_from: Optional[datetime] = Query(None, description="Filter users registered on or after this timestamp"),
    date_to: Optional[datetime] = Query(None, description="Filter users registered on or before this timestamp"),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """
    Return aggregated volunteer counts, roles, availability, and readiness indicators without exposing PII.
    """
    return analytics_service.get_volunteer_analytics(
        db=db,
        date_from=date_from,
        date_to=date_to,
    )


@router.get(
    "/skills",
    response_model=SkillCoverageAnalyticsOut,
    summary="Skill bank coverage & requirement gap analysis (Admin only)",
)
def get_skill_metrics(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """
    Return breakdown of registered skills by category, proficiency, top skills, and emergency requirement coverage.
    """
    return analytics_service.get_skill_coverage_analytics(db=db)


@router.get(
    "/response",
    response_model=ResponseAnalyticsOut,
    summary="Emergency response & assignment pipeline analytics (Admin only)",
)
def get_response_metrics(
    date_from: Optional[datetime] = Query(None, description="Filter assignments created on or after this timestamp"),
    date_to: Optional[datetime] = Query(None, description="Filter assignments created on or before this timestamp"),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """
    Return deployment pipeline statistics, acceptance rate, completion rate, and average post-incident feedback ratings.
    """
    return analytics_service.get_response_analytics(
        db=db,
        date_from=date_from,
        date_to=date_to,
    )


@router.get(
    "/community",
    response_model=CommunityAnalyticsOut,
    summary="Community activities & preparedness participation analytics (Admin only)",
)
def get_community_metrics(
    date_from: Optional[datetime] = Query(None, description="Filter activities created on or after this timestamp"),
    date_to: Optional[datetime] = Query(None, description="Filter activities created on or before this timestamp"),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """
    Return metrics for scheduled preparedness events, attendance rates, and awarded community service hours.
    """
    return analytics_service.get_community_analytics(
        db=db,
        date_from=date_from,
        date_to=date_to,
    )


@router.get(
    "/training",
    response_model=TrainingCertificationAnalyticsOut,
    summary="Certifications & training hours analytics (Admin only)",
)
def get_training_metrics(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """
    Return verification status counts for professional certifications and volunteer training course completion hours.
    """
    return analytics_service.get_training_certification_analytics(db=db)


@router.get(
    "/notifications",
    response_model=NotificationAnalyticsOut,
    summary="Notification dispatch & read rate analytics (Admin only)",
)
def get_notification_metrics(
    date_from: Optional[datetime] = Query(None, description="Filter notifications created on or after this timestamp"),
    date_to: Optional[datetime] = Query(None, description="Filter notifications created on or before this timestamp"),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """
    Return notification volume, read vs unread counts, overall read rate, and breakdown by event type and severity.
    """
    return analytics_service.get_notification_analytics(
        db=db,
        date_from=date_from,
        date_to=date_to,
    )


@router.get(
    "/geographic",
    response_model=GeographicAnalyticsOut,
    summary="Aggregate geographic & coordinate coverage metrics (Admin only)",
)
def get_geographic_metrics(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """
    Return coordinate presence counts and broad locality distribution without exposing individual volunteer coordinates.
    """
    return analytics_service.get_geographic_analytics(db=db)
