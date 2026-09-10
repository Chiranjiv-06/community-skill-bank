"""
app/services/simulation_service.py

Module 19 — Advanced Disaster Simulation Engine for Community Skill Bank.
Provides deterministic, explainable scenario modeling, capacity evaluation,
spatial coverage calculation, skill gap analysis, and time-step timeline projection.
Operates with strictly read-only access to operational tables.
"""

import math
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, Tuple

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.user import User
from app.models.models import Skill
from app.models.volunteer_profile import VolunteerProfile
from app.models.simulation import SimulationScenario, SimulationRequirement, SimulationResult
from app.services.location_service import (
    haversine_distance,
    validate_coordinates,
    DEFAULT_MAX_TRAVEL_DISTANCE_KM,
    ELIGIBLE_VOLUNTEER_ROLES,
)
from app.schemas.schemas import (
    SimulationScenarioCreate,
    SimulationScenarioUpdate,
    SimulationRequirementCreate,
    SimulationRequirementOut,
    SimulationScenarioOut,
    SimulationSkillBreakdown,
    SimulationTimeStep,
    SimulationGeographicSummary,
    SimulationResultOut,
    SimulationTimelineOut,
)

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


class SimulationService:

    @staticmethod
    def create_scenario(
        db: Session,
        scenario_in: SimulationScenarioCreate,
        creator_id: Optional[int] = None,
    ) -> SimulationScenarioOut:
        """Create a new hypothetical disaster simulation scenario in draft status."""
        if not validate_coordinates(scenario_in.center_latitude, scenario_in.center_longitude):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid center coordinates. Latitude must be in [-90, 90], Longitude in [-180, 180].",
            )

        scenario = SimulationScenario(
            name=scenario_in.name,
            description=scenario_in.description,
            disaster_type=_clean(scenario_in.disaster_type),
            severity=scenario_in.severity,
            center_latitude=scenario_in.center_latitude,
            center_longitude=scenario_in.center_longitude,
            affected_radius_km=scenario_in.affected_radius_km,
            affected_population=scenario_in.affected_population,
            duration_hours=scenario_in.duration_hours,
            demand_multiplier=scenario_in.demand_multiplier,
            status="draft",
            creator_id=creator_id,
        )
        db.add(scenario)
        db.flush()

        if scenario_in.requirements:
            for req in scenario_in.requirements:
                sim_req = SimulationRequirement(
                    scenario_id=scenario.id,
                    skill_category=_clean(req.skill_category),
                    skill_title=_clean(req.skill_title) if req.skill_title else None,
                    min_proficiency=req.min_proficiency,
                    urgency=req.urgency,
                    required_volunteers=req.required_volunteers,
                )
                db.add(sim_req)
            scenario.status = "configured"

        db.commit()
        db.refresh(scenario)

        return SimulationService._format_scenario_out(scenario)

    @staticmethod
    def get_scenario(db: Session, scenario_id: int) -> SimulationScenarioOut:
        """Fetch scenario by ID with requirements."""
        scenario = db.query(SimulationScenario).options(
            joinedload(SimulationScenario.requirements),
            joinedload(SimulationScenario.creator),
            joinedload(SimulationScenario.result),
        ).filter(SimulationScenario.id == scenario_id).first()

        if not scenario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Simulation scenario with id {scenario_id} not found",
            )
        return SimulationService._format_scenario_out(scenario)

    @staticmethod
    def list_scenarios(
        db: Session,
        status_filter: Optional[str] = None,
        disaster_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[SimulationScenarioOut]:
        """List disaster simulation scenarios with optional filtering."""
        query = db.query(SimulationScenario).options(
            joinedload(SimulationScenario.requirements),
            joinedload(SimulationScenario.creator),
            joinedload(SimulationScenario.result),
        )

        if status_filter:
            query = query.filter(SimulationScenario.status == status_filter)
        if disaster_type:
            query = query.filter(SimulationScenario.disaster_type == _clean(disaster_type))

        scenarios = query.order_by(SimulationScenario.created_at.desc()).offset(skip).limit(limit).all()
        return [SimulationService._format_scenario_out(s) for s in scenarios]

    @staticmethod
    def update_scenario(
        db: Session,
        scenario_id: int,
        update_in: SimulationScenarioUpdate,
    ) -> SimulationScenarioOut:
        """Update scenario parameters. Immutability enforced if status is 'completed'."""
        scenario = db.query(SimulationScenario).filter(SimulationScenario.id == scenario_id).first()
        if not scenario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Simulation scenario with id {scenario_id} not found",
            )

        if scenario.status == "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Completed simulation scenarios are historical and immutable. Reset or create a new scenario.",
            )

        update_dict = update_in.model_dump(exclude_unset=True)

        if "center_latitude" in update_dict or "center_longitude" in update_dict:
            lat = update_dict.get("center_latitude", scenario.center_latitude)
            lon = update_dict.get("center_longitude", scenario.center_longitude)
            if not validate_coordinates(lat, lon):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid coordinates provided",
                )

        for key, value in update_dict.items():
            if key == "disaster_type" and value:
                setattr(scenario, key, _clean(value))
            else:
                setattr(scenario, key, value)

        db.commit()
        db.refresh(scenario)
        return SimulationService._format_scenario_out(scenario)

    @staticmethod
    def add_requirement(
        db: Session,
        scenario_id: int,
        req_in: SimulationRequirementCreate,
    ) -> SimulationRequirementOut:
        """Add a skill requirement to a scenario."""
        scenario = db.query(SimulationScenario).filter(SimulationScenario.id == scenario_id).first()
        if not scenario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Simulation scenario with id {scenario_id} not found",
            )

        if scenario.status == "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify requirements of a completed simulation scenario",
            )

        req = SimulationRequirement(
            scenario_id=scenario.id,
            skill_category=_clean(req_in.skill_category),
            skill_title=_clean(req_in.skill_title) if req_in.skill_title else None,
            min_proficiency=req_in.min_proficiency,
            urgency=req_in.urgency,
            required_volunteers=req_in.required_volunteers,
        )
        db.add(req)
        if scenario.status == "draft":
            scenario.status = "configured"
        db.commit()
        db.refresh(req)

        return SimulationRequirementOut.model_validate(req)

    @staticmethod
    def delete_requirement(db: Session, scenario_id: int, req_id: int) -> dict:
        """Remove a requirement from a scenario."""
        scenario = db.query(SimulationScenario).filter(SimulationScenario.id == scenario_id).first()
        if not scenario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Simulation scenario with id {scenario_id} not found",
            )

        if scenario.status == "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete requirements from a completed simulation scenario",
            )

        req = db.query(SimulationRequirement).filter(
            SimulationRequirement.id == req_id,
            SimulationRequirement.scenario_id == scenario_id,
        ).first()

        if not req:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Requirement with id {req_id} not found on scenario {scenario_id}",
            )

        db.delete(req)
        db.commit()
        return {"message": "Requirement deleted successfully", "requirement_id": req_id}

    @staticmethod
    def run_simulation(db: Session, scenario_id: int) -> SimulationResultOut:
        """
        Execute deterministic disaster simulation model against current volunteer pool snapshot.
        Transitions scenario to 'completed' and records SimulationResult.
        """
        scenario = db.query(SimulationScenario).options(
            joinedload(SimulationScenario.requirements),
        ).filter(SimulationScenario.id == scenario_id).first()

        if not scenario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Simulation scenario with id {scenario_id} not found",
            )

        if not validate_coordinates(scenario.center_latitude, scenario.center_longitude):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Scenario has invalid coordinates and cannot be executed.",
            )

        # -------------------------------------------------------------
        # 1. Fetch active volunteer candidate pool (Read-Only)
        # -------------------------------------------------------------
        total_active_volunteers = db.query(User).filter(
            User.role.in_(ELIGIBLE_VOLUNTEER_ROLES),
            User.is_active.is_(True),
        ).count()

        volunteers = (
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

        # Filter geographically eligible volunteers
        eligible_volunteers: List[Tuple[User, float]] = []
        for vol in volunteers:
            if not validate_coordinates(vol.latitude, vol.longitude):
                continue

            dist = haversine_distance(
                scenario.center_latitude,
                scenario.center_longitude,
                vol.latitude,
                vol.longitude,
            )

            # Scenario radius constraint
            if dist > scenario.affected_radius_km:
                continue

            # Volunteer operational travel constraint
            profile = vol.volunteer_profile
            max_travel = DEFAULT_MAX_TRAVEL_DISTANCE_KM
            if profile and profile.max_travel_distance_km and profile.max_travel_distance_km > 0:
                max_travel = profile.max_travel_distance_km

            if dist > max_travel:
                continue

            eligible_volunteers.append((vol, dist))

        eligible_volunteer_count = len(eligible_volunteers)
        coverage_pct = round(
            (eligible_volunteer_count / max(1, total_active_volunteers)) * 100.0,
            1,
        )

        # -------------------------------------------------------------
        # 2. Skill-Specific Demand & Supply Evaluation
        # -------------------------------------------------------------
        skill_breakdowns: List[Dict[str, Any]] = []
        total_demand = 0
        total_fulfilled = 0
        total_available_capacity = 0

        for req in scenario.requirements:
            req_category = _clean(req.skill_category)
            req_title = _clean(req.skill_title) if req.skill_title else ""
            req_min_prof_score = PROFICIENCY_TIERS.get(_clean(req.min_proficiency), 2)

            # Simulated demand applying multiplier
            sim_demand = max(1, int(round(req.required_volunteers * scenario.demand_multiplier))) if req.required_volunteers > 0 else 0

            # Count matching volunteers in eligible geographic pool
            matching_vols_count = 0
            for vol, _dist in eligible_volunteers:
                matched_skill = False

                # Check registered skills
                for sk in vol.skills:
                    sk_cat = _clean(sk.category)
                    sk_tit = _clean(sk.title)
                    sk_prof_score = PROFICIENCY_TIERS.get(_clean(sk.proficiency), 2)

                    if sk_cat == req_category:
                        if req_title and req_title not in sk_tit:
                            continue
                        if sk_prof_score >= req_min_prof_score:
                            matched_skill = True
                            break

                # Fallback for citizen volunteer / general emergency assistance
                if not matched_skill and req_category == GENERAL_ASSISTANCE_CATEGORY:
                    matched_skill = True

                if matched_skill:
                    matching_vols_count += 1

            fulfilled = min(sim_demand, matching_vols_count)
            gap = max(0, sim_demand - matching_vols_count)
            fulfillment_pct = min(100.0, round((fulfilled / sim_demand) * 100.0, 1)) if sim_demand > 0 else 100.0

            total_demand += sim_demand
            total_fulfilled += fulfilled
            total_available_capacity += matching_vols_count

            skill_breakdowns.append({
                "skill_category": req.skill_category,
                "skill_title": req.skill_title,
                "min_proficiency": req.min_proficiency,
                "urgency": req.urgency,
                "required_volunteers": req.required_volunteers,
                "simulated_demand": sim_demand,
                "available_volunteers": matching_vols_count,
                "fulfilled_volunteers": fulfilled,
                "gap": gap,
                "fulfillment_percentage": fulfillment_pct,
            })

        total_unfulfilled = max(0, total_demand - total_fulfilled)
        overall_fulfillment_pct = (
            min(100.0, round((total_fulfilled / total_demand) * 100.0, 1))
            if total_demand > 0
            else 100.0
        )

        # -------------------------------------------------------------
        # 3. Response Pressure Derivation
        # -------------------------------------------------------------
        if total_demand == 0:
            response_pressure = "low"
        elif overall_fulfillment_pct < 35.0 or total_available_capacity == 0:
            response_pressure = "critical"
        elif overall_fulfillment_pct < 60.0:
            response_pressure = "high"
        elif overall_fulfillment_pct < 85.0:
            response_pressure = "moderate"
        else:
            response_pressure = "low"

        # -------------------------------------------------------------
        # 4. Multi-Step Time Progression (Timeline)
        # -------------------------------------------------------------
        timeline: List[Dict[str, Any]] = []
        duration = scenario.duration_hours
        step_count = min(duration, 12) if duration > 0 else 1
        step_interval = max(1, duration // step_count) if duration > 0 else 1

        cumulative_hours = 0.0
        for step_idx in range(1, step_count + 1):
            elapsed = min(duration, step_idx * step_interval)
            
            # Mobilization curve: 25% at T0/start ramping up to 100%
            mobilization_ratio = min(1.0, 0.25 + 0.75 * (elapsed / max(1, duration)))
            mobilized_cap = int(round(total_available_capacity * mobilization_ratio))
            step_fulfilled = min(total_demand, mobilized_cap)
            step_unfulfilled = max(0, total_demand - step_fulfilled)
            
            step_hours = step_fulfilled * step_interval * 0.8
            cumulative_hours += step_hours

            step_fulfillment_pct = (
                (step_fulfilled / total_demand) * 100.0 if total_demand > 0 else 100.0
            )

            if total_demand == 0:
                step_pressure = "low"
            elif step_fulfillment_pct < 35.0 or mobilized_cap == 0:
                step_pressure = "critical"
            elif step_fulfillment_pct < 60.0:
                step_pressure = "high"
            elif step_fulfillment_pct < 85.0:
                step_pressure = "moderate"
            else:
                step_pressure = "low"

            timeline.append({
                "step_number": step_idx,
                "elapsed_hours": elapsed,
                "active_demand": total_demand,
                "mobilized_capacity": mobilized_cap,
                "fulfilled": step_fulfilled,
                "unfulfilled": step_unfulfilled,
                "cumulative_hours": round(cumulative_hours, 1),
                "response_pressure": step_pressure,
            })

        # -------------------------------------------------------------
        # 5. Persist Simulation Result & Complete Scenario
        # -------------------------------------------------------------
        now = datetime.now(timezone.utc)
        scenario.status = "completed"

        sim_result = db.query(SimulationResult).filter(SimulationResult.scenario_id == scenario.id).first()
        if not sim_result:
            sim_result = SimulationResult(
                scenario_id=scenario.id,
                total_demand=total_demand,
                total_available_capacity=total_available_capacity,
                total_fulfilled=total_fulfilled,
                total_unfulfilled=total_unfulfilled,
                fulfillment_percentage=overall_fulfillment_pct,
                response_pressure=response_pressure,
                geographic_coverage_percentage=coverage_pct,
                eligible_volunteer_count=eligible_volunteer_count,
                skill_results_json=skill_breakdowns,
                timeline_json=timeline,
                executed_at=now,
            )
            db.add(sim_result)
        else:
            sim_result.total_demand = total_demand
            sim_result.total_available_capacity = total_available_capacity
            sim_result.total_fulfilled = total_fulfilled
            sim_result.total_unfulfilled = total_unfulfilled
            sim_result.fulfillment_percentage = overall_fulfillment_pct
            sim_result.response_pressure = response_pressure
            sim_result.geographic_coverage_percentage = coverage_pct
            sim_result.eligible_volunteer_count = eligible_volunteer_count
            sim_result.skill_results_json = skill_breakdowns
            sim_result.timeline_json = timeline
            sim_result.executed_at = now

        db.commit()
        db.refresh(sim_result)

        geo_summary = SimulationGeographicSummary(
            center_latitude=scenario.center_latitude,
            center_longitude=scenario.center_longitude,
            affected_radius_km=scenario.affected_radius_km,
            eligible_volunteer_count=eligible_volunteer_count,
            total_active_volunteers=total_active_volunteers,
            coverage_percentage=coverage_pct,
        )

        return SimulationResultOut(
            id=sim_result.id,
            scenario_id=scenario.id,
            scenario_name=scenario.name,
            disaster_type=scenario.disaster_type,
            severity=scenario.severity,
            total_demand=total_demand,
            total_available_capacity=total_available_capacity,
            total_fulfilled=total_fulfilled,
            total_unfulfilled=total_unfulfilled,
            fulfillment_percentage=overall_fulfillment_pct,
            response_pressure=response_pressure,
            geographic=geo_summary,
            skills=[SimulationSkillBreakdown(**sb) for sb in skill_breakdowns],
            timeline=[SimulationTimeStep(**ts) for ts in timeline],
            executed_at=sim_result.executed_at,
        )

    @staticmethod
    def get_simulation_results(db: Session, scenario_id: int) -> SimulationResultOut:
        """Retrieve stored simulation results for a completed scenario."""
        scenario = db.query(SimulationScenario).options(
            joinedload(SimulationScenario.result),
        ).filter(SimulationScenario.id == scenario_id).first()

        if not scenario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Simulation scenario with id {scenario_id} not found",
            )

        if not scenario.result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Simulation scenario {scenario_id} has not been executed yet. Call POST /api/simulations/{scenario_id}/run first.",
            )

        res = scenario.result
        total_active_volunteers = db.query(User).filter(
            User.role.in_(ELIGIBLE_VOLUNTEER_ROLES),
            User.is_active.is_(True),
        ).count()

        geo_summary = SimulationGeographicSummary(
            center_latitude=scenario.center_latitude,
            center_longitude=scenario.center_longitude,
            affected_radius_km=scenario.affected_radius_km,
            eligible_volunteer_count=res.eligible_volunteer_count,
            total_active_volunteers=total_active_volunteers,
            coverage_percentage=res.geographic_coverage_percentage,
        )

        skills_list = [SimulationSkillBreakdown(**s) for s in (res.skill_results_json or [])]
        timeline_list = [SimulationTimeStep(**t) for t in (res.timeline_json or [])]

        return SimulationResultOut(
            id=res.id,
            scenario_id=scenario.id,
            scenario_name=scenario.name,
            disaster_type=scenario.disaster_type,
            severity=scenario.severity,
            total_demand=res.total_demand,
            total_available_capacity=res.total_available_capacity,
            total_fulfilled=res.total_fulfilled,
            total_unfulfilled=res.total_unfulfilled,
            fulfillment_percentage=res.fulfillment_percentage,
            response_pressure=res.response_pressure,
            geographic=geo_summary,
            skills=skills_list,
            timeline=timeline_list,
            executed_at=res.executed_at,
        )

    @staticmethod
    def get_simulation_timeline(db: Session, scenario_id: int) -> SimulationTimelineOut:
        """Retrieve time-step progression timeline for a completed scenario."""
        scenario = db.query(SimulationScenario).options(
            joinedload(SimulationScenario.result),
        ).filter(SimulationScenario.id == scenario_id).first()

        if not scenario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Simulation scenario with id {scenario_id} not found",
            )

        if not scenario.result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Simulation scenario {scenario_id} has not been executed yet.",
            )

        timeline_list = [SimulationTimeStep(**t) for t in (scenario.result.timeline_json or [])]

        return SimulationTimelineOut(
            scenario_id=scenario.id,
            scenario_name=scenario.name,
            duration_hours=scenario.duration_hours,
            timeline=timeline_list,
        )

    @staticmethod
    def _format_scenario_out(scenario: SimulationScenario) -> SimulationScenarioOut:
        """Helper to serialize SimulationScenario into SimulationScenarioOut."""
        reqs = [
            SimulationRequirementOut.model_validate(r)
            for r in (scenario.requirements or [])
        ]
        creator_name = scenario.creator.full_name if scenario.creator else None
        has_result = scenario.result is not None

        return SimulationScenarioOut(
            id=scenario.id,
            name=scenario.name,
            description=scenario.description,
            disaster_type=scenario.disaster_type,
            severity=scenario.severity,
            center_latitude=scenario.center_latitude,
            center_longitude=scenario.center_longitude,
            affected_radius_km=scenario.affected_radius_km,
            affected_population=scenario.affected_population,
            duration_hours=scenario.duration_hours,
            demand_multiplier=scenario.demand_multiplier,
            status=scenario.status,
            creator_id=scenario.creator_id,
            creator_name=creator_name,
            requirements=reqs,
            has_result=has_result,
            created_at=scenario.created_at,
            updated_at=scenario.updated_at,
        )
