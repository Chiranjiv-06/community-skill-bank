"""
app/services/recommendation_service.py

Deterministic, rule-based Recommendation Engine for Community Skill Bank (Module 14).
Transforms Module 6 matching scores into prioritized administrative recommendations
by layering staffing need, requirement urgency, assignment deduplication, and credential
verification metadata without AI/ML or stochastic scoring.
"""

from typing import List, Dict, Optional, Set
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.models.models import Emergency, Skill
from app.models.emergency_requirement import EmergencyRequirement
from app.models.emergency_assignment import EmergencyAssignment
from app.models.volunteer_certification import VolunteerCertification
from app.models.assignment_feedback import AssignmentFeedback
from app.models.user import User
from app.schemas.schemas import (
    EmergencyRecommendationsResponse,
    VolunteerRecommendationOut,
    PrimaryRequirementRecommendation,
    MatchedRequirementInfo,
    ScoreBreakdown,
)
from app.services.matching_service import match_volunteers_for_emergency

URGENCY_RANK = {
    "critical": 4,
    "high": 3,
    "medium": 2,
    "low": 1,
}


def _clean(val: Optional[str]) -> str:
    """Normalize text for consistent comparison."""
    return val.strip().lower() if val else ""


def generate_volunteer_recommendations(
    db: Session,
    emergency: Emergency,
    radius_km: float = 20.0,
    min_score: float = 0.0,
    limit: int = 50,
    only_unfulfilled: bool = False,
) -> EmergencyRecommendationsResponse:
    """
    Generate prioritized, explainable volunteer recommendations for an emergency.
    - Reuses Module 6 matching engine as the source of truth for candidate eligibility and 100-pt matching score.
    - Excludes volunteers already actively assigned to the emergency (Module 7).
    - Prioritizes staffing requirements with remaining unfilled headcount and higher urgency.
    - Enriches recommendations with verified credential and service metadata from Modules 8-9.
    - Produces deterministic, explainable recommendation reasons.
    """
    requirements: List[EmergencyRequirement] = emergency.requirements or []

    # If no requirements exist, return clean zero-recommendation response
    if len(requirements) == 0:
        return EmergencyRecommendationsResponse(
            emergency_id=emergency.id,
            emergency_title=emergency.title,
            emergency_status=emergency.status,
            radius_km=radius_km,
            total_recommendations=0,
            all_requirements_fulfilled=True,
            unfilled_requirements_count=0,
            message="No emergency requirements defined for this incident. Add requirements to generate recommendations.",
            recommendations=[],
        )

    # -------------------------------------------------------------
    # 1. MODULE 7 ASSIGNMENT & REQUIREMENT FULFILLMENT STATE
    # -------------------------------------------------------------
    assignments = (
        db.query(EmergencyAssignment)
        .filter(EmergencyAssignment.emergency_id == emergency.id)
        .all()
    )

    active_assigned_vol_ids: Set[int] = {
        a.volunteer_id for a in assignments if a.status in ["assigned", "in_progress", "completed"]
    }
    pending_vol_ids: Set[int] = {
        a.volunteer_id for a in assignments if a.status in ["pending", "accepted"]
    }

    req_remaining_map: Dict[int, int] = {}
    req_urgency_map: Dict[int, str] = {}
    req_obj_map: Dict[int, EmergencyRequirement] = {}

    unfilled_reqs_count = 0

    for req in requirements:
        req_assignments = [a for a in assignments if a.requirement_id == req.id]
        active_count = sum(1 for a in req_assignments if a.status in ["assigned", "in_progress", "completed"])
        remaining = max(0, req.min_volunteers_needed - active_count)

        req_remaining_map[req.id] = remaining
        req_urgency_map[req.id] = _clean(req.urgency) or "medium"
        req_obj_map[req.id] = req

        if remaining > 0:
            unfilled_reqs_count += 1

    all_fulfilled = (unfilled_reqs_count == 0)

    # -------------------------------------------------------------
    # 2. REUSE MODULE 6 MATCHING ENGINE
    # -------------------------------------------------------------
    match_response = match_volunteers_for_emergency(
        db=db,
        emergency=emergency,
        radius_km=radius_km,
        min_score=min_score,
        limit=200,  # Query candidate pool for recommendation ranking
    )

    candidates = match_response.matches
    today = date.today()

    recommendations: List[VolunteerRecommendationOut] = []

    for cand in candidates:
        # A. Filter out volunteers already actively assigned to this emergency
        if cand.volunteer_id in active_assigned_vol_ids:
            continue

        # Fetch candidate user record for availability & location metadata
        user_record = db.query(User).filter(User.id == cand.volunteer_id).first()
        avail_str = user_record.availability if user_record else None

        # Fetch Module 8 active verified certifications count
        verified_certs_count = (
            db.query(VolunteerCertification)
            .filter(
                VolunteerCertification.user_id == cand.volunteer_id,
                VolunteerCertification.verification_status == "verified",
                or_(
                    VolunteerCertification.expiry_date.is_(None),
                    VolunteerCertification.expiry_date >= today,
                ),
            )
            .count()
        )

        # Fetch Module 9 verified service hours
        service_hours_res = (
            db.query(func.coalesce(func.sum(AssignmentFeedback.hours_served), 0.0))
            .filter(AssignmentFeedback.volunteer_id == cand.volunteer_id)
            .scalar()
        )
        verified_hours = float(service_hours_res or 0.0)

        # -------------------------------------------------------------
        # 3. IDENTIFY PRIMARY REQUIREMENT & PRIORITIZATION
        # -------------------------------------------------------------
        matched_req_ids = [m.requirement_id for m in cand.matched_requirements if m.requirement_id in req_obj_map]

        if not matched_req_ids:
            continue

        # Separate matched requirements into unfilled vs fulfilled
        unfilled_matches = [r_id for r_id in matched_req_ids if req_remaining_map.get(r_id, 0) > 0]
        fulfilled_matches = [r_id for r_id in matched_req_ids if req_remaining_map.get(r_id, 0) == 0]

        if only_unfulfilled and not unfilled_matches:
            continue

        # Pick primary requirement:
        # Prioritize unfilled requirements first, then highest urgency, then highest remaining needed
        if unfilled_matches:
            best_req_id = max(
                unfilled_matches,
                key=lambda r_id: (
                    URGENCY_RANK.get(req_urgency_map.get(r_id, "medium"), 2),
                    req_remaining_map.get(r_id, 0),
                ),
            )
        else:
            best_req_id = max(
                fulfilled_matches,
                key=lambda r_id: URGENCY_RANK.get(req_urgency_map.get(r_id, "medium"), 2),
            )

        primary_req_obj = req_obj_map[best_req_id]
        primary_remaining = req_remaining_map.get(best_req_id, 0)
        is_unfilled_flag = primary_remaining > 0

        primary_req_summary = PrimaryRequirementRecommendation(
            requirement_id=primary_req_obj.id,
            skill_category=primary_req_obj.skill_category,
            skill_title=primary_req_obj.skill_title,
            min_proficiency=primary_req_obj.min_proficiency,
            urgency=primary_req_obj.urgency,
            remaining_needed=primary_remaining,
            is_unfilled=is_unfilled_flag,
        )

        # -------------------------------------------------------------
        # 4. EXPLAINABLE RECOMMENDATION REASONS
        # -------------------------------------------------------------
        reasons: List[str] = [
            f"Rule-based recommendation for {primary_req_obj.skill_category} requirement ({cand.match_score}/100 match score).",
        ]

        if primary_req_obj.skill_title:
            reasons.append(f"Satisfies specific requested skill title: '{primary_req_obj.skill_title}'.")

        # Find matching details for primary requirement
        primary_match_info = next((m for m in cand.matched_requirements if m.requirement_id == best_req_id), None)
        if primary_match_info:
            reasons.append(f"Volunteer proficiency level is '{primary_match_info.proficiency}' with {primary_match_info.experience_years} years experience.")

        reasons.append(f"Distance: {cand.distance_km} km from incident location.")

        if is_unfilled_flag:
            reasons.append(f"Target requirement has {primary_remaining} remaining volunteer slot(s) needed (Urgency: {primary_req_obj.urgency}).")
        else:
            reasons.append("Target requirement is currently 100% staffed with active responders.")

        if verified_certs_count > 0:
            reasons.append(f"Volunteer holds {verified_certs_count} active verified credential(s).")
        if verified_hours > 0.0:
            reasons.append(f"Volunteer has {round(verified_hours, 1)} verified platform disaster response hours.")

        if cand.volunteer_id in pending_vol_ids:
            reasons.append("Volunteer currently has a pending invitation for this emergency incident.")

        # Recommendation score matches authoritative Module 6 score
        rec_out = VolunteerRecommendationOut(
            volunteer_id=cand.volunteer_id,
            full_name=cand.full_name,
            email=cand.email,
            phone=cand.phone,
            role=cand.role,
            location=cand.location,
            distance_km=cand.distance_km,
            matching_score=cand.match_score,
            recommendation_score=cand.match_score,
            primary_requirement=primary_req_summary,
            matched_requirements=cand.matched_requirements,
            score_breakdown=cand.score_breakdown,
            availability=avail_str,
            verified_certifications_count=verified_certs_count,
            verified_service_hours=round(verified_hours, 2),
            recommendation_reasons=reasons,
        )

        recommendations.append(rec_out)

    # -------------------------------------------------------------
    # 5. DETERMINISTIC PRIORITIZED ORDERING
    # -------------------------------------------------------------
    # Ordering tuple:
    # 1. Primary requirement is unfilled (True before False)
    # 2. Urgency rank of primary requirement (Critical=4, High=3, Medium=2, Low=1)
    # 3. Matching score DESC
    # 4. Verified certifications count DESC
    # 5. Distance ASC
    recommendations.sort(
        key=lambda r: (
            not r.primary_requirement.is_unfilled,  # False (0) sorts before True (1)
            -URGENCY_RANK.get(_clean(r.primary_requirement.urgency), 2),
            -r.matching_score,
            -r.verified_certifications_count,
            r.distance_km,
        )
    )

    final_recommendations = recommendations[:limit]

    message = None
    if all_fulfilled:
        message = "All staffing requirements for this emergency are currently fulfilled by active responders."
    elif len(final_recommendations) == 0:
        message = "No eligible volunteer recommendations found within the search radius."

    return EmergencyRecommendationsResponse(
        emergency_id=emergency.id,
        emergency_title=emergency.title,
        emergency_status=emergency.status,
        radius_km=radius_km,
        total_recommendations=len(final_recommendations),
        all_requirements_fulfilled=all_fulfilled,
        unfilled_requirements_count=unfilled_reqs_count,
        message=message,
        recommendations=final_recommendations,
    )
