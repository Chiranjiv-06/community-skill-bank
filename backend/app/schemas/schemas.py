from datetime import datetime, date
from typing import Optional, Literal, List

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


# User schemas

class UserCreate(BaseModel):
    """Schema for creating a new user account (used by /api/auth/register)."""
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    certifications: Optional[str] = None
    availability: Optional[str] = None
    # Role defaults to citizen_volunteer — no formal skills required by default.
    # Accepted values: skilled_volunteer, citizen_volunteer, admin, volunteer (legacy)
    role: str = "citizen_volunteer"


class UserOut(BaseModel):
    """Schema for returning user data in API responses."""
    id: int
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    role: str
    bio: Optional[str] = None
    certifications: Optional[str] = None
    availability: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Token schema

class Token(BaseModel):
    """JWT access token response."""
    access_token: str
    token_type: str = "bearer"


from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# Skill schemas

ProficiencyLevel = Literal["beginner", "intermediate", "advanced", "expert"]


class SkillCreate(BaseModel):
    """Schema for creating a new skill record."""
    title: str
    category: str
    description: Optional[str] = None
    experience_years: int = Field(default=0, ge=0)
    proficiency: ProficiencyLevel = "intermediate"


class SkillUpdate(BaseModel):
    """Schema for updating an existing skill record."""
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    experience_years: Optional[int] = Field(default=None, ge=0)
    proficiency: Optional[ProficiencyLevel] = None


class SkillOut(BaseModel):
    """Schema for returning skill data in API responses."""
    id: int
    title: str
    category: str
    description: Optional[str] = None
    experience_years: int = 0
    proficiency: str = "intermediate"
    owner_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Emergency schemas
# ---------------------------------------------------------------------------

SeverityLevel = Literal["critical", "high", "medium", "low"]
UrgencyLevel = Literal["critical", "high", "medium", "low"]
EmergencyStatus = Literal["open", "in_progress", "resolved", "cancelled"]


class EmergencyCreate(BaseModel):
    """Schema for reporting a new emergency."""
    title: str
    description: Optional[str] = None
    category: str
    severity: SeverityLevel = "medium"
    location: Optional[str] = None
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)


class EmergencyUpdate(BaseModel):
    """Schema for updating emergency incident details."""
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[SeverityLevel] = None
    location: Optional[str] = None
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)

    model_config = ConfigDict(extra="forbid")


class EmergencyStatusUpdate(BaseModel):
    """Schema for updating emergency lifecycle status."""
    status: EmergencyStatus


class EmergencyOut(BaseModel):
    """Schema for returning emergency data in API responses."""
    id: int
    title: str
    description: Optional[str] = None
    category: str
    severity: str = "medium"
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: str
    reporter_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Emergency Requirement schemas
# ---------------------------------------------------------------------------

class EmergencyRequirementCreate(BaseModel):
    """Schema for adding a skill requirement to an emergency."""
    skill_category: str
    skill_title: Optional[str] = None
    min_volunteers_needed: int = Field(default=1, ge=1)
    min_proficiency: ProficiencyLevel = "intermediate"
    urgency: UrgencyLevel = "medium"


class EmergencyRequirementUpdate(BaseModel):
    """Schema for updating an emergency skill requirement."""
    skill_category: Optional[str] = None
    skill_title: Optional[str] = None
    min_volunteers_needed: Optional[int] = Field(default=None, ge=1)
    min_proficiency: Optional[ProficiencyLevel] = None
    urgency: Optional[UrgencyLevel] = None

    model_config = ConfigDict(extra="forbid")


class EmergencyRequirementOut(BaseModel):
    """Schema for returning emergency requirement data."""
    id: int
    emergency_id: int
    skill_category: str
    skill_title: Optional[str] = None
    min_volunteers_needed: int
    min_proficiency: str
    urgency: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Volunteer Matching schemas (Module 6)
# ---------------------------------------------------------------------------

class ScoreBreakdown(BaseModel):
    """Detailed explainable breakdown of a volunteer match score."""
    skill_match: float
    proficiency: float
    experience: float
    proximity: float


class MatchedRequirementInfo(BaseModel):
    """Information about a specific requirement satisfied by the volunteer."""
    requirement_id: int
    skill_category: str
    matched_skill_title: Optional[str] = None
    proficiency: str
    experience_years: int


class VolunteerMatchOut(BaseModel):
    """Recommended volunteer match candidate."""
    volunteer_id: int
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    location: Optional[str] = None
    distance_km: float
    match_score: float
    matched_requirements: list[MatchedRequirementInfo]
    score_breakdown: ScoreBreakdown


class EmergencyMatchResponse(BaseModel):
    """Response payload for emergency volunteer matching recommendations."""
    emergency_id: int
    emergency_title: str
    radius_km: float
    total_requirements: int
    total_matches: int
    message: Optional[str] = None
    matches: list[VolunteerMatchOut]


# ---------------------------------------------------------------------------
# Response & Assignment Lifecycle schemas (Module 7)
# ---------------------------------------------------------------------------

AssignmentStatus = Literal[
    "pending",
    "accepted",
    "rejected",
    "assigned",
    "in_progress",
    "completed",
    "cancelled",
]

VolunteerResponseStatus = Literal["pending", "accepted", "rejected"]


class VolunteerRespondRequest(BaseModel):
    """Schema for volunteer self-application or responding to an invitation."""
    status: VolunteerResponseStatus = "pending"
    volunteer_notes: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class AuthorityAssignmentCreate(BaseModel):
    """Schema for authority direct assignment or invitation of a volunteer."""
    volunteer_id: int
    requirement_id: Optional[int] = None
    initial_status: Literal["assigned", "pending"] = "assigned"
    admin_notes: Optional[str] = None
    match_score_at_assignment: Optional[float] = Field(default=None, ge=0.0, le=100.0)

    model_config = ConfigDict(extra="forbid")


class AuthorityAssignmentUpdate(BaseModel):
    """Schema for authority updating assignment state, notes, or requirement binding."""
    requirement_id: Optional[int] = None
    status: Optional[AssignmentStatus] = None
    admin_notes: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class VolunteerProgressUpdate(BaseModel):
    """Schema for volunteer updating on-scene check-in or mission completion."""
    target_status: Literal["in_progress", "completed"]
    volunteer_notes: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class AssignmentOut(BaseModel):
    """Schema for returning emergency assignment details."""
    id: int
    emergency_id: int
    volunteer_id: int
    requirement_id: Optional[int] = None
    status: str
    assigned_by_id: Optional[int] = None
    match_score_at_assignment: Optional[float] = None
    volunteer_notes: Optional[str] = None
    admin_notes: Optional[str] = None
    responded_at: Optional[datetime] = None
    deployed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Denormalized context fields for frontend display
    volunteer_name: Optional[str] = None
    volunteer_email: Optional[str] = None
    volunteer_phone: Optional[str] = None
    volunteer_role: Optional[str] = None
    emergency_title: Optional[str] = None
    requirement_category: Optional[str] = None
    requirement_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RequirementFulfillmentMetric(BaseModel):
    """Aggregated capacity and headcount fulfillment metrics for a requirement."""
    requirement_id: int
    skill_category: str
    skill_title: Optional[str] = None
    min_volunteers_needed: int
    active_dispatched_headcount: int
    pending_pipeline_count: int
    remaining_needed: int


class EmergencyAssignmentsOverview(BaseModel):
    """Summary overview of all assignments and requirement fulfillment for an incident."""
    emergency_id: int
    emergency_title: str
    emergency_status: str
    total_assignments: int
    requirements_fulfillment: list[RequirementFulfillmentMetric]
    assignments: list[AssignmentOut]


# ---------------------------------------------------------------------------
# Training & Certification schemas (Module 8)
# ---------------------------------------------------------------------------

CertificationVerificationStatus = Literal["pending", "verified", "rejected", "expired"]
TrainingStatus = Literal["completed", "in_progress", "verified"]


class VolunteerCertificationCreate(BaseModel):
    """Schema for volunteer submitting a structured certification."""
    title: str
    issuing_organization: str
    credential_id: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    skill_id: Optional[int] = None

    model_config = ConfigDict(extra="forbid")


class VolunteerCertificationUpdate(BaseModel):
    """Schema for volunteer updating an unverified certification."""
    title: Optional[str] = None
    issuing_organization: Optional[str] = None
    credential_id: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    skill_id: Optional[int] = None

    model_config = ConfigDict(extra="forbid")


class AdminCertificationVerify(BaseModel):
    """Schema for administrator verifying or rejecting a certification."""
    verification_status: Literal["verified", "rejected", "pending"]
    verification_notes: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class VolunteerCertificationOut(BaseModel):
    """Schema for returning volunteer certification details."""
    id: int
    user_id: int
    skill_id: Optional[int] = None
    title: str
    issuing_organization: str
    credential_id: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    verification_status: str
    verified_by_id: Optional[int] = None
    verification_notes: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Context fields
    skill_title: Optional[str] = None
    user_full_name: Optional[str] = None
    user_email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class VolunteerTrainingCreate(BaseModel):
    """Schema for volunteer logging a completed/in-progress training record."""
    course_name: str
    provider: str
    completion_date: Optional[date] = None
    hours_completed: int = Field(default=0, ge=0)
    credential_url: Optional[str] = None
    status: Literal["completed", "in_progress"] = "completed"

    model_config = ConfigDict(extra="forbid")


class VolunteerTrainingUpdate(BaseModel):
    """Schema for volunteer updating an unverified training record."""
    course_name: Optional[str] = None
    provider: Optional[str] = None
    completion_date: Optional[date] = None
    hours_completed: Optional[int] = Field(default=None, ge=0)
    credential_url: Optional[str] = None
    status: Optional[Literal["completed", "in_progress"]] = None

    model_config = ConfigDict(extra="forbid")


class AdminTrainingVerify(BaseModel):
    """Schema for administrator verifying a volunteer training record."""
    status: Literal["verified", "completed", "in_progress"] = "verified"

    model_config = ConfigDict(extra="forbid")


class VolunteerTrainingOut(BaseModel):
    """Schema for returning volunteer training details."""
    id: int
    user_id: int
    course_name: str
    provider: str
    completion_date: Optional[date] = None
    hours_completed: int = 0
    credential_url: Optional[str] = None
    status: str
    verified_by_id: Optional[int] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Context fields
    user_full_name: Optional[str] = None
    user_email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Trust, Contributions & Feedback schemas (Module 9)
# ---------------------------------------------------------------------------

class AssignmentFeedbackCreate(BaseModel):
    """Schema for supervisor submitting performance feedback on a completed assignment."""
    rating: int = Field(..., ge=1, le=5, description="Performance evaluation rating from 1 to 5")
    hours_served: float = Field(..., gt=0.0, le=168.0, description="Verified hours served (>0.0 and <=168.0)")
    feedback_notes: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class AdminFeedbackUpdate(BaseModel):
    """Schema for administrator correcting an existing feedback record."""
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    hours_served: Optional[float] = Field(default=None, gt=0.0, le=168.0)
    feedback_notes: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class AssignmentFeedbackOut(BaseModel):
    """Schema for returning assignment feedback details."""
    id: int
    assignment_id: int
    emergency_id: int
    volunteer_id: int
    submitted_by_id: Optional[int] = None
    rating: int
    hours_served: float
    feedback_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    volunteer_name: Optional[str] = None
    emergency_title: Optional[str] = None
    submitter_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class VolunteerMissionContributionOut(BaseModel):
    """Schema for a volunteer's completed mission contribution record."""
    assignment_id: int
    emergency_id: int
    emergency_title: str
    status: str
    deployed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    feedback_id: Optional[int] = None
    rating: Optional[int] = None
    hours_served: Optional[float] = None
    feedback_notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class VolunteerTrustSummary(BaseModel):
    """Aggregated explainable trust & reliability metrics for a volunteer."""
    volunteer_id: int
    volunteer_name: str
    role: str
    completed_missions: int
    rated_missions: int
    average_rating: Optional[float] = None
    total_verified_hours: float = 0.0
    active_verified_certifications: int = 0
    verified_training_hours: int = 0
    verified_skills_count: int = 0
    reliability_tier: str

    model_config = ConfigDict(from_attributes=True)


class VolunteerTrustProfile(BaseModel):
    """Protected trust profile for authorized review."""
    volunteer_id: int
    full_name: str
    role: str
    location: Optional[str] = None
    trust_summary: VolunteerTrustSummary
    verified_skills: List[str]
    recent_missions_count: int

    model_config = ConfigDict(from_attributes=True)


# =====================================================================
# MODULE 10: COMMUNITY ACTIVITIES & ENGAGEMENT SCHEMAS
# =====================================================================

class CommunityActivityCreate(BaseModel):
    """Schema for administrator creating a new community activity."""
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=5)
    activity_type: str = Field(..., min_length=2, max_length=50)
    location_name: str = Field(..., min_length=2, max_length=255)
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    start_datetime: datetime
    end_datetime: datetime
    capacity: Optional[int] = Field(default=None, ge=1)
    status: Literal["draft", "published"] = "published"

    model_config = ConfigDict(extra="forbid")

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_datetime <= self.start_datetime:
            raise ValueError("end_datetime must be strictly after start_datetime")
        return self


class CommunityActivityUpdate(BaseModel):
    """Schema for administrator updating an existing community activity."""
    title: Optional[str] = Field(default=None, min_length=3, max_length=255)
    description: Optional[str] = Field(default=None, min_length=5)
    activity_type: Optional[str] = Field(default=None, min_length=2, max_length=50)
    location_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    capacity: Optional[int] = Field(default=None, ge=1)
    status: Optional[Literal["draft", "published", "ongoing", "completed", "cancelled"]] = None

    model_config = ConfigDict(extra="forbid")

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_datetime is not None and self.end_datetime is not None:
            if self.end_datetime <= self.start_datetime:
                raise ValueError("end_datetime must be strictly after start_datetime")
        return self


class CommunityActivityOut(BaseModel):
    """Schema for returning community activity details with attendance capacity metrics."""
    id: int
    title: str
    description: str
    activity_type: str
    organizer_id: int
    location_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    start_datetime: datetime
    end_datetime: datetime
    capacity: Optional[int] = None
    registered_count: int = 0
    remaining_capacity: Optional[int] = None
    status: str
    created_at: datetime
    updated_at: datetime

    organizer_name: Optional[str] = None
    distance_km: Optional[float] = None
    is_user_registered: Optional[bool] = None
    user_participation_status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CommunityParticipationOut(BaseModel):
    """Schema for returning volunteer participation records."""
    id: int
    activity_id: int
    volunteer_id: int
    status: str
    participation_hours: Optional[float] = None
    feedback_notes: Optional[str] = None
    registered_at: datetime
    attended_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    activity_title: Optional[str] = None
    activity_type: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    location_name: Optional[str] = None
    volunteer_name: Optional[str] = None
    volunteer_email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AdminAttendanceUpdate(BaseModel):
    """Schema for administrator recording attendance, completion, and awarding participation hours."""
    status: Literal["registered", "attended", "completed", "withdrawn", "no_show"]
    participation_hours: Optional[float] = Field(default=None, gt=0.0, le=72.0)
    feedback_notes: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class VolunteerCommunitySummary(BaseModel):
    """Summary of non-emergency community participation and engagement hours."""
    volunteer_id: int
    volunteer_name: str
    role: str
    total_activities_joined: int
    activities_attended: int
    activities_completed: int
    total_community_hours: float = 0.0
    upcoming_activities_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Notification schemas (Module 11)
# ---------------------------------------------------------------------------

NotificationType = Literal[
    "emergency_alert",
    "assignment_invitation",
    "assignment_update",
    "certification_status",
    "community_activity",
    "feedback_received",
    "admin_alert",
    "system",
]

NotificationSeverity = Literal["info", "warning", "critical", "success"]


class NotificationOut(BaseModel):
    """Schema for returning in-app notification data."""
    id: int
    user_id: int
    title: str
    message: str
    type: str
    severity: str
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UnreadCountOut(BaseModel):
    """Schema for unread notification badge count."""
    unread_count: int


class MarkAllReadOut(BaseModel):
    """Schema for bulk mark-as-read response."""
    updated_count: int


class BroadcastNotificationCreate(BaseModel):
    """Schema for administrator broadcast announcements."""
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    type: NotificationType = "system"
    severity: NotificationSeverity = "info"
    role_filter: Optional[Literal["all", "admin", "skilled_volunteer", "citizen_volunteer", "volunteer"]] = None

    model_config = ConfigDict(extra="forbid")


class BroadcastNotificationOut(BaseModel):
    """Schema for broadcast announcement response."""
    broadcast_count: int
    role_filter: Optional[str] = None


# ---------------------------------------------------------------------------
# Module 13: Emergency Intelligence Schemas
# ---------------------------------------------------------------------------

class RequiredSkillExtraction(BaseModel):
    """Schema for extracted structured skill requirement details."""
    skill_category: str
    skill_title: Optional[str] = None
    min_proficiency: str
    min_volunteers: int
    urgency: str
    exact_title_required: bool


class HeadcountAnalysis(BaseModel):
    """Schema for staffing fulfillment and volunteer headcount tracking."""
    total_required: int
    active_dispatched: int
    pending_pipeline: int
    remaining_needed: int
    fulfillment_percentage: float


class SeverityAssessment(BaseModel):
    """Schema for authoritative stored severity and explainable rule-based assessment."""
    stored_severity: str
    rule_based_assessment: str
    assessment_reason: str


class UrgencyAssessment(BaseModel):
    """Schema for operational incident urgency derivation."""
    overall_urgency: str
    peak_requirement_urgency: Optional[str] = None
    urgency_reason: str


class EmergencyIntelligenceOut(BaseModel):
    """Schema for structured deterministic emergency intelligence summary."""
    emergency_id: int
    emergency_title: str
    emergency_status: str
    classification: str
    severity_analysis: SeverityAssessment
    urgency_analysis: UrgencyAssessment
    location_available: bool
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    total_requirements_count: int
    required_skills: List[RequiredSkillExtraction]
    headcount: HeadcountAnalysis
    intelligence_flags: List[str]
    explanation: List[str]


# ---------------------------------------------------------------------------
# Module 14: Volunteer Recommendation Engine Schemas
# ---------------------------------------------------------------------------

class PrimaryRequirementRecommendation(BaseModel):
    """Schema for the primary target requirement matched to the candidate."""
    requirement_id: int
    skill_category: str
    skill_title: Optional[str] = None
    min_proficiency: str
    urgency: str
    remaining_needed: int
    is_unfilled: bool


class VolunteerRecommendationOut(BaseModel):
    """Schema for a prioritized volunteer recommendation."""
    volunteer_id: int
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    location: Optional[str] = None
    distance_km: float
    matching_score: float
    recommendation_score: float
    primary_requirement: PrimaryRequirementRecommendation
    matched_requirements: List[MatchedRequirementInfo]
    score_breakdown: ScoreBreakdown
    availability: Optional[str] = None
    verified_certifications_count: int = 0
    verified_service_hours: float = 0.0
    recommendation_reasons: List[str]


class EmergencyRecommendationsResponse(BaseModel):
    """Schema for emergency volunteer recommendation response payload."""
    emergency_id: int
    emergency_title: str
    emergency_status: str
    radius_km: float
    total_recommendations: int
    all_requirements_fulfilled: bool
    unfilled_requirements_count: int
    message: Optional[str] = None
    recommendations: List[VolunteerRecommendationOut]


# ---------------------------------------------------------------------------
# Module 15: RAG / Knowledge Assistant Foundation Schemas
# ---------------------------------------------------------------------------

class KnowledgeDocumentCreate(BaseModel):
    """Schema for administrator creating a knowledge document."""
    title: str = Field(..., min_length=3, max_length=255)
    content: str = Field(..., min_length=10)
    description: Optional[str] = None
    category: str = Field(..., min_length=2, max_length=50)
    disaster_type: str = Field(..., min_length=2, max_length=50)
    source: str = Field(..., min_length=2, max_length=255)
    source_url: Optional[str] = Field(default=None, max_length=512)
    status: Literal["draft", "published", "archived"] = "draft"

    model_config = ConfigDict(extra="forbid")


class KnowledgeDocumentUpdate(BaseModel):
    """Schema for administrator updating an existing knowledge document."""
    title: Optional[str] = Field(default=None, min_length=3, max_length=255)
    content: Optional[str] = Field(default=None, min_length=10)
    description: Optional[str] = None
    category: Optional[str] = Field(default=None, min_length=2, max_length=50)
    disaster_type: Optional[str] = Field(default=None, min_length=2, max_length=50)
    source: Optional[str] = Field(default=None, min_length=2, max_length=255)
    source_url: Optional[str] = Field(default=None, max_length=512)
    status: Optional[Literal["draft", "published", "archived"]] = None

    model_config = ConfigDict(extra="forbid")


class KnowledgeDocumentOut(BaseModel):
    """Schema for returning knowledge document details."""
    id: int
    title: str
    content: str
    description: Optional[str] = None
    category: str
    disaster_type: str
    source: str
    source_url: Optional[str] = None
    status: str
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    creator_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class KnowledgeSearchOut(BaseModel):
    """Schema for paginated knowledge search response."""
    total_count: int
    results: List[KnowledgeDocumentOut]


class KnowledgeAssistantQuery(BaseModel):
    """Schema for user query to the deterministic knowledge assistant."""
    question: str = Field(..., min_length=2, max_length=500)
    disaster_type: Optional[str] = None
    category: Optional[str] = None
    limit: int = Field(default=5, ge=1, le=20)

    model_config = ConfigDict(extra="forbid")


class KnowledgeAssistantResultItem(BaseModel):
    """Schema for a single retrieved knowledge article in assistant response."""
    document_id: int
    title: str
    category: str
    disaster_type: str
    content: str
    summary: Optional[str] = None
    source: str
    source_url: Optional[str] = None
    relevance_score: float
    matched_terms: List[str]


class KnowledgeAssistantResponse(BaseModel):
    """Schema for deterministic knowledge assistant retrieval output."""
    question: str
    disaster_type_filter: Optional[str] = None
    category_filter: Optional[str] = None
    total_found: int
    results: List[KnowledgeAssistantResultItem]
    retrieval_strategy: str
    message: Optional[str] = None


# ---------------------------------------------------------------------------
# Module 16: Analytics & Dashboard Schemas
# ---------------------------------------------------------------------------

class EmergencyStatusBreakdown(BaseModel):
    open: int = 0
    in_progress: int = 0
    resolved: int = 0
    cancelled: int = 0


class EmergencySeverityBreakdown(BaseModel):
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0


class EmergencyAnalyticsOut(BaseModel):
    total_emergencies: int = 0
    by_status: EmergencyStatusBreakdown = Field(default_factory=EmergencyStatusBreakdown)
    by_severity: EmergencySeverityBreakdown = Field(default_factory=EmergencySeverityBreakdown)
    by_category: dict[str, int] = Field(default_factory=dict)
    total_requirements: int = 0
    total_required_headcount: int = 0
    active_response_headcount: int = 0
    emergencies_with_coordinates: int = 0
    emergencies_without_coordinates: int = 0


class UserRoleBreakdown(BaseModel):
    admin: int = 0
    skilled_volunteer: int = 0
    citizen_volunteer: int = 0
    volunteer: int = 0


class VolunteerAnalyticsOut(BaseModel):
    total_users: int = 0
    active_users: int = 0
    inactive_users: int = 0
    by_role: UserRoleBreakdown = Field(default_factory=UserRoleBreakdown)
    volunteers_with_skills: int = 0
    volunteers_with_profile: int = 0
    volunteers_with_certifications: int = 0
    volunteers_with_trainings: int = 0
    volunteers_with_coordinates: int = 0
    volunteers_without_coordinates: int = 0
    availability_distribution: dict[str, int] = Field(default_factory=dict)
    transportation_distribution: dict[str, int] = Field(default_factory=dict)


class SkillCoverageAnalyticsOut(BaseModel):
    total_skills: int = 0
    by_category: dict[str, int] = Field(default_factory=dict)
    by_proficiency: dict[str, int] = Field(default_factory=dict)
    top_skills: List[dict[str, int | str]] = Field(default_factory=list)
    requirement_category_coverage: dict[str, dict[str, int]] = Field(default_factory=dict)


class AssignmentStatusBreakdown(BaseModel):
    pending: int = 0
    accepted: int = 0
    assigned: int = 0
    in_progress: int = 0
    completed: int = 0
    rejected: int = 0
    cancelled: int = 0


class ResponseAnalyticsOut(BaseModel):
    total_assignments: int = 0
    by_status: AssignmentStatusBreakdown = Field(default_factory=AssignmentStatusBreakdown)
    active_assignments_count: int = 0
    pending_pipeline_count: int = 0
    unique_active_volunteers_deployed: int = 0
    acceptance_rate: float = 0.0
    completion_rate: float = 0.0
    total_feedbacks: int = 0
    average_rating: float = 0.0
    total_service_hours: float = 0.0


class CommunityAnalyticsOut(BaseModel):
    total_activities: int = 0
    by_status: dict[str, int] = Field(default_factory=dict)
    by_type: dict[str, int] = Field(default_factory=dict)
    total_participations: int = 0
    participations_by_status: dict[str, int] = Field(default_factory=dict)
    total_attended_or_completed: int = 0
    total_community_hours_awarded: float = 0.0


class TrainingCertificationAnalyticsOut(BaseModel):
    total_certifications: int = 0
    certifications_by_status: dict[str, int] = Field(default_factory=dict)
    active_verified_certifications: int = 0
    total_trainings: int = 0
    trainings_by_status: dict[str, int] = Field(default_factory=dict)
    total_training_hours_completed: int = 0


class NotificationAnalyticsOut(BaseModel):
    total_notifications: int = 0
    read_notifications: int = 0
    unread_notifications: int = 0
    read_rate: float = 0.0
    by_type: dict[str, int] = Field(default_factory=dict)
    by_severity: dict[str, int] = Field(default_factory=dict)


class GeographicAnalyticsOut(BaseModel):
    emergencies_with_coordinates: int = 0
    emergencies_without_coordinates: int = 0
    volunteers_with_coordinates: int = 0
    volunteers_without_coordinates: int = 0
    emergencies_by_location: dict[str, int] = Field(default_factory=dict)
    volunteers_by_location: dict[str, int] = Field(default_factory=dict)


class DashboardAnalyticsOut(BaseModel):
    emergencies: EmergencyAnalyticsOut
    volunteers: VolunteerAnalyticsOut
    skills: SkillCoverageAnalyticsOut
    response: ResponseAnalyticsOut
    community: CommunityAnalyticsOut
    training: TrainingCertificationAnalyticsOut
    notifications: NotificationAnalyticsOut
    geographic: GeographicAnalyticsOut


# ---------------------------------------------------------------------------
# Module 17: Real-Time Communication Schemas
# ---------------------------------------------------------------------------

class RealtimeEventEnvelope(BaseModel):
    """Structured event envelope for WebSocket transmissions."""
    event: str
    notification_id: Optional[int] = None
    notification_type: Optional[str] = None
    severity: str = "info"
    title: str
    message: str
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None
    created_at: Optional[str] = None


class RealtimeStatusOut(BaseModel):
    """Connection metrics for active real-time WebSocket manager."""
    connected_users_count: int
    active_sockets_count: int
    connected_admins_count: int


# ---------------------------------------------------------------------------
# Module 18: Offline / Synchronization Schemas
# ---------------------------------------------------------------------------

class NotificationSyncOut(BaseModel):
    """Schema for notification catch-up synchronization."""
    server_time: datetime
    unread_count: int
    notifications: List[NotificationOut]


class SyncEmergencyItem(BaseModel):
    id: int
    title: str
    category: str
    severity: str
    status: str
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SyncAssignmentItem(BaseModel):
    id: int
    emergency_id: int
    status: str
    requirement_id: Optional[int] = None
    match_score_at_assignment: Optional[float] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SyncCommunityActivityItem(BaseModel):
    id: int
    title: str
    activity_type: str
    location_name: str
    status: str
    start_datetime: datetime
    end_datetime: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SyncCommunityParticipationItem(BaseModel):
    id: int
    activity_id: int
    status: str
    participation_hours: Optional[float] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SyncChangesOut(BaseModel):
    """Schema for delta change feed."""
    server_time: datetime
    since: Optional[datetime] = None
    emergencies: List[SyncEmergencyItem]
    my_assignments: List[SyncAssignmentItem]
    community_activities: List[SyncCommunityActivityItem]
    my_participations: List[SyncCommunityParticipationItem]


class SyncActionItem(BaseModel):
    """A single queued offline client action."""
    client_action_id: str = Field(..., min_length=1, max_length=100)
    action_type: Literal["assignment_response", "mark_notification_read", "community_rsvp", "volunteer_availability"]
    payload: dict = Field(default_factory=dict)


class SyncBatchRequest(BaseModel):
    """Batch of queued offline actions submitted upon reconnection."""
    client_time: Optional[datetime] = None
    actions: List[SyncActionItem] = Field(default_factory=list, max_length=50)


class SyncActionResultItem(BaseModel):
    client_action_id: str
    action_type: str
    status: str = "accepted"
    message: str
    data: Optional[dict] = None


class SyncActionConflictItem(BaseModel):
    client_action_id: str
    action_type: str
    reason: str
    server_state: Optional[dict] = None


class SyncActionRejectedItem(BaseModel):
    client_action_id: str
    action_type: str
    error: str


class SyncBatchResponse(BaseModel):
    """Response reporting accepted, conflicted, and rejected offline actions."""
    server_time: datetime
    accepted: List[SyncActionResultItem]
    conflicts: List[SyncActionConflictItem]
    rejected: List[SyncActionRejectedItem]


# ---------------------------------------------------------------------------
# Module 19: Advanced Disaster Simulation Schemas
# ---------------------------------------------------------------------------

class SimulationRequirementCreate(BaseModel):
    """Schema for adding a simulated skill requirement to a disaster scenario."""
    skill_category: str = Field(..., min_length=2, max_length=100)
    skill_title: Optional[str] = Field(default=None, max_length=255)
    min_proficiency: Literal["beginner", "intermediate", "advanced", "expert"] = "intermediate"
    urgency: Literal["low", "medium", "high", "critical"] = "medium"
    required_volunteers: int = Field(default=1, ge=1, le=1000)

    model_config = ConfigDict(extra="forbid")


class SimulationRequirementOut(BaseModel):
    """Schema for returning simulated skill requirement."""
    id: int
    scenario_id: int
    skill_category: str
    skill_title: Optional[str] = None
    min_proficiency: str
    urgency: str
    required_volunteers: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SimulationScenarioCreate(BaseModel):
    """Schema for administrator creating a new disaster simulation scenario."""
    name: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    disaster_type: str = Field(..., min_length=2, max_length=50)
    severity: Literal["low", "medium", "high", "critical"] = "medium"
    center_latitude: float = Field(..., ge=-90.0, le=90.0)
    center_longitude: float = Field(..., ge=-180.0, le=180.0)
    affected_radius_km: float = Field(default=20.0, gt=0.0, le=500.0)
    affected_population: int = Field(default=1000, ge=1)
    duration_hours: int = Field(default=24, ge=1, le=720)
    demand_multiplier: float = Field(default=1.0, gt=0.0, le=10.0)
    requirements: Optional[List[SimulationRequirementCreate]] = None

    model_config = ConfigDict(extra="forbid")


class SimulationScenarioUpdate(BaseModel):
    """Schema for updating an existing disaster simulation scenario."""
    name: Optional[str] = Field(default=None, min_length=3, max_length=255)
    description: Optional[str] = None
    disaster_type: Optional[str] = Field(default=None, min_length=2, max_length=50)
    severity: Optional[Literal["low", "medium", "high", "critical"]] = None
    center_latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    center_longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    affected_radius_km: Optional[float] = Field(default=None, gt=0.0, le=500.0)
    affected_population: Optional[int] = Field(default=None, ge=1)
    duration_hours: Optional[int] = Field(default=None, ge=1, le=720)
    demand_multiplier: Optional[float] = Field(default=None, gt=0.0, le=10.0)
    status: Optional[Literal["draft", "configured", "cancelled"]] = None

    model_config = ConfigDict(extra="forbid")


class SimulationSkillBreakdown(BaseModel):
    """Per-skill demand vs supply breakdown."""
    skill_category: str
    skill_title: Optional[str] = None
    min_proficiency: str
    urgency: str
    required_volunteers: int
    simulated_demand: int
    available_volunteers: int
    fulfilled_volunteers: int
    gap: int
    fulfillment_percentage: float


class SimulationTimeStep(BaseModel):
    """Time step progression metrics."""
    step_number: int
    elapsed_hours: int
    active_demand: int
    mobilized_capacity: int
    fulfilled: int
    unfulfilled: int
    cumulative_hours: float
    response_pressure: str


class SimulationGeographicSummary(BaseModel):
    """Geographic volunteer distribution and coverage metrics."""
    center_latitude: float
    center_longitude: float
    affected_radius_km: float
    eligible_volunteer_count: int
    total_active_volunteers: int
    coverage_percentage: float


class SimulationResultOut(BaseModel):
    """Comprehensive result of executed disaster simulation."""
    id: int
    scenario_id: int
    scenario_name: str
    disaster_type: str
    severity: str
    total_demand: int
    total_available_capacity: int
    total_fulfilled: int
    total_unfulfilled: int
    fulfillment_percentage: float
    response_pressure: str
    geographic: SimulationGeographicSummary
    skills: List[SimulationSkillBreakdown]
    timeline: List[SimulationTimeStep]
    executed_at: datetime


class SimulationScenarioOut(BaseModel):
    """Scenario details including requirements and execution status."""
    id: int
    name: str
    description: Optional[str] = None
    disaster_type: str
    severity: str
    center_latitude: float
    center_longitude: float
    affected_radius_km: float
    affected_population: int
    duration_hours: int
    demand_multiplier: float
    status: str
    creator_id: Optional[int] = None
    creator_name: Optional[str] = None
    requirements: List[SimulationRequirementOut] = Field(default_factory=list)
    has_result: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SimulationTimelineOut(BaseModel):
    """Timeline progression view for scenario."""
    scenario_id: int
    scenario_name: str
    duration_hours: int
    timeline: List[SimulationTimeStep]


# ---------------------------------------------------------------------------
# Module 20: Audit & Observability Schemas
# ---------------------------------------------------------------------------

class AuditLogOut(BaseModel):
    """Schema for audit log record."""
    id: int
    actor_user_id: Optional[int] = None
    actor_name: Optional[str] = None
    actor_email: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    outcome: str
    request_id: Optional[str] = None
    ip_address: Optional[str] = None
    metadata_json: Optional[dict] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogsListOut(BaseModel):
    """Paginated list of audit log records."""
    total: int
    skip: int
    limit: int
    logs: List[AuditLogOut]


class OperationalMetricsOut(BaseModel):
    """Snapshot of in-process operational and request metrics."""
    requests_total: int
    errors_total: int
    status_distribution: dict[str, int]
    average_latency_ms: float
    sync_conflicts: int
    simulation_runs: int
    active_websockets: int
    audit_events_total: int
    uptime_seconds: float


class ReadinessOut(BaseModel):
    """Database and dependency readiness status."""
    status: str
    database: str