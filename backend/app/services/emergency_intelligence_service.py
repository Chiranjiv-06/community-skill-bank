"""
app/services/emergency_intelligence_service.py

Deterministic, explainable Emergency Intelligence service for Community Skill Bank.
Extracts structured staffing requirements, evaluates operational urgency, computes
deterministic rule-based severity assessments, tracks headcount fulfillment, and
detects operational intelligence flags without any stochastic or ML models.
"""

from typing import List, Optional, Set
from sqlalchemy.orm import Session

from app.models.models import Emergency
from app.models.emergency_requirement import EmergencyRequirement
from app.models.emergency_assignment import EmergencyAssignment
from app.schemas.schemas import (
    EmergencyIntelligenceOut,
    RequiredSkillExtraction,
    HeadcountAnalysis,
    SeverityAssessment,
    UrgencyAssessment,
)
from app.services.location_service import validate_coordinates

GENERAL_ASSISTANCE_CATEGORY = "general emergency assistance"

SEVERITY_WEIGHTS = {
    "low": 1,
    "medium": 2,
    "high": 3,
    "critical": 4,
}

URGENCY_WEIGHTS = {
    "low": 1,
    "medium": 2,
    "high": 3,
    "critical": 4,
}


def _clean(val: Optional[str]) -> str:
    """Normalize text for consistent comparison."""
    return val.strip().lower() if val else ""


def analyze_emergency_intelligence(db: Session, emergency: Emergency) -> EmergencyIntelligenceOut:
    """
    Perform 100% deterministic rule-based intelligence analysis on an emergency incident.
    - Extracts structured requirements and required skills.
    - Computes staffing/headcount fulfillment against active assignments.
    - Aggregates peak and requirement urgencies.
    - Performs rule-based severity assessment without overwriting authoritative stored severity.
    - Evaluates coordinate health and raises structured intelligence flags.
    """
    requirements: List[EmergencyRequirement] = emergency.requirements or []
    total_reqs = len(requirements)

    # -------------------------------------------------------------
    # 1. HEADCOUNT & ASSIGNMENT FULFILLMENT TRACKING
    # -------------------------------------------------------------
    total_required_headcount = sum(r.min_volunteers_needed for r in requirements)

    # Fetch active assignments
    assignments = (
        db.query(EmergencyAssignment)
        .filter(EmergencyAssignment.emergency_id == emergency.id)
        .all()
    )

    active_dispatched = sum(
        1 for a in assignments if a.status in ["assigned", "in_progress", "completed"]
    )
    pending_pipeline = sum(
        1 for a in assignments if a.status in ["pending", "accepted"]
    )
    remaining_needed = max(0, total_required_headcount - active_dispatched)
    fulfillment_pct = (
        round((active_dispatched / total_required_headcount) * 100.0, 1)
        if total_required_headcount > 0
        else (100.0 if total_reqs == 0 else 0.0)
    )

    headcount_summary = HeadcountAnalysis(
        total_required=total_required_headcount,
        active_dispatched=active_dispatched,
        pending_pipeline=pending_pipeline,
        remaining_needed=remaining_needed,
        fulfillment_percentage=fulfillment_pct,
    )

    # -------------------------------------------------------------
    # 2. REQUIRED SKILLS EXTRACTION
    # -------------------------------------------------------------
    extracted_skills: List[RequiredSkillExtraction] = []
    unique_categories: Set[str] = set()
    has_exact_title_req = False
    has_citizen_generic = False

    for req in requirements:
        cat_clean = _clean(req.skill_category)
        title_clean = req.skill_title.strip() if req.skill_title else None
        unique_categories.add(cat_clean)

        if title_clean:
            has_exact_title_req = True
        if cat_clean == GENERAL_ASSISTANCE_CATEGORY:
            has_citizen_generic = True

        extracted_skills.append(
            RequiredSkillExtraction(
                skill_category=req.skill_category,
                skill_title=title_clean,
                min_proficiency=req.min_proficiency,
                min_volunteers=req.min_volunteers_needed,
                urgency=req.urgency,
                exact_title_required=bool(title_clean),
            )
        )

    # -------------------------------------------------------------
    # 3. STRUCTURED CLASSIFICATION
    # -------------------------------------------------------------
    if total_reqs == 0:
        classification = f"General {emergency.category.title()} (Unspecified Requirements)"
    elif len(unique_categories) > 1:
        classification = f"Multi-Domain Emergency Response ({len(unique_categories)} Skill Categories)"
    else:
        single_cat = requirements[0].skill_category
        classification = f"Specialized {single_cat} Operation"

    # -------------------------------------------------------------
    # 4. URGENCY ASSESSMENT
    # -------------------------------------------------------------
    if total_reqs > 0:
        peak_urgency_req = max(requirements, key=lambda r: URGENCY_WEIGHTS.get(_clean(r.urgency), 2))
        peak_urgency = peak_urgency_req.urgency.lower()
        overall_urgency = peak_urgency
        urgency_reason = f"Derived from highest requirement urgency ({peak_urgency_req.urgency} for {peak_urgency_req.skill_category})."
    else:
        peak_urgency = None
        overall_urgency = emergency.severity.lower() if emergency.severity else "medium"
        urgency_reason = "No requirements defined; operational urgency defaults to stored incident severity level."

    urgency_summary = UrgencyAssessment(
        overall_urgency=overall_urgency,
        peak_requirement_urgency=peak_urgency,
        urgency_reason=urgency_reason,
    )

    # -------------------------------------------------------------
    # 5. DETERMINISTIC RULE-BASED SEVERITY ASSESSMENT
    # (Stored emergency.severity is authoritative and preserved)
    # -------------------------------------------------------------
    stored_sev = emergency.severity.lower() if emergency.severity else "medium"
    stored_wt = SEVERITY_WEIGHTS.get(stored_sev, 2)

    # Deterministic evaluation rules:
    # Rule A: If stored severity is already critical, assessed severity is critical.
    # Rule B: If peak requirement urgency is critical OR total headcount >= 10, assessed severity is critical.
    # Rule C: If peak requirement urgency is high OR total headcount >= 5, assessed severity is at least high.
    # Rule D: Otherwise, assessed severity defaults to stored severity.
    peak_urgency_wt = URGENCY_WEIGHTS.get(peak_urgency, 0) if peak_urgency else 0

    if stored_sev == "critical" or peak_urgency_wt >= 4 or total_required_headcount >= 10:
        rule_assessed_sev = "critical"
        if stored_sev == "critical":
            sev_reason = "Incident severity is officially recorded as critical."
        elif peak_urgency_wt >= 4:
            sev_reason = "Critical urgency in staffing requirements indicates critical operational severity."
        else:
            sev_reason = f"Large staffing requirement ({total_required_headcount} volunteers) indicates critical operational scale."
    elif stored_sev == "high" or peak_urgency_wt >= 3 or total_required_headcount >= 5:
        rule_assessed_sev = "high"
        if stored_sev == "high":
            sev_reason = "Incident severity is officially recorded as high."
        elif peak_urgency_wt >= 3:
            sev_reason = "High urgency in staffing requirements indicates high operational priority."
        else:
            sev_reason = f"Substantial staffing requirement ({total_required_headcount} volunteers) indicates high operational scale."
    else:
        rule_assessed_sev = stored_sev
        sev_reason = f"Assessed operational severity aligns with recorded severity ({stored_sev})."

    severity_summary = SeverityAssessment(
        stored_severity=stored_sev,
        rule_based_assessment=rule_assessed_sev,
        assessment_reason=sev_reason,
    )

    # -------------------------------------------------------------
    # 6. LOCATION HEALTH
    # -------------------------------------------------------------
    has_valid_coords = validate_coordinates(emergency.latitude, emergency.longitude)

    # -------------------------------------------------------------
    # 7. EXPLAINABLE INTELLIGENCE FLAGS
    # -------------------------------------------------------------
    flags: List[str] = []

    if not has_valid_coords:
        flags.append("missing_location")
    if total_reqs == 0:
        flags.append("no_skill_requirements")
    if stored_sev == "critical" or rule_assessed_sev == "critical":
        flags.append("critical_severity")
    if overall_urgency in ["critical", "high"]:
        flags.append("high_urgency")
    if remaining_needed > 0:
        flags.append("unfilled_headcount")
    if len(unique_categories) > 1:
        flags.append("multiple_skill_categories")
    if has_exact_title_req:
        flags.append("exact_skill_match_required")
    if has_citizen_generic:
        flags.append("citizen_general_assistance_compatible")

    # -------------------------------------------------------------
    # 8. EXPLAINABLE REASONING LOG
    # -------------------------------------------------------------
    explanations: List[str] = [
        f"Incident '{emergency.title}' is currently '{emergency.status}' with stored severity '{stored_sev}'.",
        f"Classification evaluated as '{classification}'.",
        sev_reason,
        urgency_reason,
        f"Staffing status: {active_dispatched}/{total_required_headcount} active volunteers assigned ({remaining_needed} remaining).",
    ]

    if not has_valid_coords:
        explanations.append("Warning: Geographic coordinates are invalid or missing; proximity dispatch is constrained.")
    if has_exact_title_req:
        explanations.append("Specific skill titles are mandated for one or more staffing requirements.")
    if has_citizen_generic:
        explanations.append("General Emergency Assistance requirement permits unspecialized citizen volunteer deployment.")

    return EmergencyIntelligenceOut(
        emergency_id=emergency.id,
        emergency_title=emergency.title,
        emergency_status=emergency.status,
        classification=classification,
        severity_analysis=severity_summary,
        urgency_analysis=urgency_summary,
        location_available=has_valid_coords,
        latitude=emergency.latitude,
        longitude=emergency.longitude,
        total_requirements_count=total_reqs,
        required_skills=extracted_skills,
        headcount=headcount_summary,
        intelligence_flags=flags,
        explanation=explanations,
    )
