"""
app/services/matching_service.py

Deterministic, rule-based volunteer matching engine for Community Skill Bank.
Evaluates disaster response requirements against eligible candidate pools using a two-stage pipeline.
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.models import Emergency, Skill
from app.models.emergency_requirement import EmergencyRequirement
from app.models.user import User
from app.models.volunteer_profile import VolunteerProfile
from app.schemas.schemas import (
    EmergencyMatchResponse,
    VolunteerMatchOut,
    MatchedRequirementInfo,
    ScoreBreakdown,
)
from app.services.location_service import (
    haversine_distance,
    validate_coordinates,
    DEFAULT_MAX_TRAVEL_DISTANCE_KM,
    ELIGIBLE_VOLUNTEER_ROLES,
)

# Ordinal mapping for proficiency levels
PROFICIENCY_TIERS: Dict[str, int] = {
    "beginner": 1,
    "intermediate": 2,
    "advanced": 3,
    "expert": 4,
}

GENERAL_ASSISTANCE_CATEGORY = "general emergency assistance"


def _clean(val: Optional[str]) -> str:
    """Normalize text: stripped, lowercase."""
    return val.strip().lower() if val else ""


def match_volunteers_for_emergency(
    db: Session,
    emergency: Emergency,
    radius_km: float = 20.0,
    min_score: float = 0.0,
    limit: int = 50,
) -> EmergencyMatchResponse:
    """
    Two-stage rule-based matching engine:
    Stage 1: Hard capability, role, coordinate, travel radius, and requirement filtering.
    Stage 2: Deterministic 100-point scoring on qualified candidates (Skill: 40, Prof: 25, Exp: 15, Prox: 20).
    """
    if not validate_coordinates(emergency.latitude, emergency.longitude):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Emergency location is not available",
        )

    requirements: List[EmergencyRequirement] = emergency.requirements
    total_reqs = len(requirements)

    # If no requirements defined, return clean zero-match response (no fallback to proximity discovery)
    if total_reqs == 0:
        return EmergencyMatchResponse(
            emergency_id=emergency.id,
            emergency_title=emergency.title,
            radius_km=radius_km,
            total_requirements=0,
            total_matches=0,
            message="No emergency requirements defined for this incident. Use /nearby-volunteers for general proximity discovery.",
            matches=[],
        )

    # Query active volunteer pool with eager loaded skills and volunteer profiles
    candidates = (
        db.query(User)
        .options(
            joinedload(User.skills),
            joinedload(User.volunteer_profile),
        )
        .filter(
            User.role.in_(ELIGIBLE_VOLUNTEER_ROLES),
            User.is_active.is_(True),
            User.latitude.isnot(None),
            User.longitude.isnot(None),
        )
        .all()
    )

    matched_volunteers: List[VolunteerMatchOut] = []

    for cand in candidates:
        # -------------------------------------------------------------
        # STAGE 1: HARD ELIGIBILITY FILTERING
        # -------------------------------------------------------------
        if not validate_coordinates(cand.latitude, cand.longitude):
            continue

        # Spatial distance check
        distance = haversine_distance(
            emergency.latitude,
            emergency.longitude,
            cand.latitude,
            cand.longitude,
        )

        # 1. Incident search radius check
        if distance > radius_km:
            continue

        # 2. Volunteer max travel capacity check
        profile = cand.volunteer_profile
        max_travel = DEFAULT_MAX_TRAVEL_DISTANCE_KM
        if profile is not None and profile.max_travel_distance_km is not None and profile.max_travel_distance_km > 0:
            max_travel = profile.max_travel_distance_km

        if distance > max_travel:
            continue

        # 3. Requirement capability matching
        satisfied_reqs: List[MatchedRequirementInfo] = []
        req_evaluations: List[Dict[str, Any]] = []

        cand_skills: List[Skill] = cand.skills or []

        for req in requirements:
            req_cat_norm = _clean(req.skill_category)
            req_title_norm = _clean(req.skill_title)
            req_tier = PROFICIENCY_TIERS.get(_clean(req.min_proficiency), 2)

            best_skill_for_req: Optional[Skill] = None
            best_skill_tier = 0

            # A. Check registered skills
            for skill in cand_skills:
                skill_cat_norm = _clean(skill.category)
                skill_title_norm = _clean(skill.title)
                skill_tier = PROFICIENCY_TIERS.get(_clean(skill.proficiency), 2)

                # Must match category
                if skill_cat_norm != req_cat_norm:
                    continue

                # If requirement specifies a title, skill title must match exactly (normalized)
                if req_title_norm and skill_title_norm != req_title_norm:
                    continue

                # Must meet minimum required proficiency
                if skill_tier < req_tier:
                    continue

                # Pick highest tier skill for this requirement
                if skill_tier > best_skill_tier:
                    best_skill_tier = skill_tier
                    best_skill_for_req = skill

            # B. Check citizen volunteer generic assistance exception
            is_generic_assistance = (req_cat_norm == GENERAL_ASSISTANCE_CATEGORY)
            matched_via_citizen_generic = False

            if not best_skill_for_req and is_generic_assistance:
                # Citizen volunteers qualify for General Emergency Assistance without registered skills
                matched_via_citizen_generic = True

            # If qualified for this requirement, calculate independent requirement score
            if best_skill_for_req or matched_via_citizen_generic:
                # -------------------------------------------------------------
                # STAGE 2: 100-POINT SCORING (For Qualified Candidate)
                # -------------------------------------------------------------
                if best_skill_for_req:
                    matched_title = best_skill_for_req.title
                    matched_prof_str = best_skill_for_req.proficiency or "intermediate"
                    cand_tier = PROFICIENCY_TIERS.get(_clean(matched_prof_str), 2)
                    cand_exp = max(0, best_skill_for_req.experience_years or 0)

                    # 1. Skill Fit (Max 40 pts)
                    # 30 pts for category match + 10 pts for matching exact title
                    skill_fit_score = 30.0
                    if req_title_norm and _clean(best_skill_for_req.title) == req_title_norm:
                        skill_fit_score = 40.0
                    elif not req_title_norm:
                        skill_fit_score = 40.0

                    # 2. Proficiency (Max 25 pts)
                    # 15 pts for meeting min proficiency + 5 pts per tier above min (strictly capped at 25.0)
                    prof_score = min(25.0, 15.0 + max(0.0, 5.0 * (cand_tier - req_tier)))

                    # 3. Experience (Max 15 pts)
                    exp_score = min(15.0, round(1.5 * min(10, cand_exp), 2))

                else:
                    # General Emergency Assistance baseline for unspecialized citizen volunteers
                    matched_title = "General Volunteer Support"
                    matched_prof_str = "intermediate"
                    cand_exp = 0
                    skill_fit_score = 30.0
                    prof_score = 15.0
                    exp_score = 0.0

                # 4. Proximity (Max 20 pts)
                proximity_score = min(20.0, round(20.0 * max(0.0, 1.0 - (distance / radius_km)), 2))

                # Total score strictly capped at 100.0
                total_req_score = min(100.0, round(skill_fit_score + prof_score + exp_score + proximity_score, 2))

                satisfied_reqs.append(
                    MatchedRequirementInfo(
                        requirement_id=req.id,
                        skill_category=req.skill_category,
                        matched_skill_title=matched_title,
                        proficiency=matched_prof_str,
                        experience_years=cand_exp,
                    )
                )

                req_evaluations.append({
                    "score": total_req_score,
                    "breakdown": ScoreBreakdown(
                        skill_match=skill_fit_score,
                        proficiency=prof_score,
                        experience=exp_score,
                        proximity=proximity_score,
                    ),
                })

        # If candidate satisfied at least one requirement
        if satisfied_reqs and req_evaluations:
            # Highest valid requirement score as primary ranking score (never sum scores)
            best_eval = max(req_evaluations, key=lambda x: x["score"])
            primary_score = best_eval["score"]
            primary_breakdown = best_eval["breakdown"]

            if primary_score >= min_score:
                matched_volunteers.append(
                    VolunteerMatchOut(
                        volunteer_id=cand.id,
                        full_name=cand.full_name,
                        email=cand.email,
                        phone=cand.phone,
                        role=cand.role,
                        location=cand.location,
                        distance_km=round(distance, 2),
                        match_score=primary_score,
                        matched_requirements=satisfied_reqs,
                        score_breakdown=primary_breakdown,
                    )
                )

    # Sort candidates strictly by match_score DESC, distance_km ASC
    matched_volunteers.sort(key=lambda v: (-v.match_score, v.distance_km))

    # Apply limit
    final_matches = matched_volunteers[:limit]

    return EmergencyMatchResponse(
        emergency_id=emergency.id,
        emergency_title=emergency.title,
        radius_km=radius_km,
        total_requirements=total_reqs,
        total_matches=len(matched_volunteers),
        message=None,
        matches=final_matches,
    )
