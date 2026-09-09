"""
app/api/simulation_routes.py

Module 19 — Advanced Disaster Simulation API Endpoints (Admin Only).
Provides endpoints for scenario configuration, requirement management,
deterministic execution, and results inspection.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models.user import User
from app.utils.security import get_current_admin
from app.services.simulation_service import SimulationService
from app.services.audit_service import AuditService
from app.schemas.schemas import (
    SimulationScenarioCreate,
    SimulationScenarioUpdate,
    SimulationRequirementCreate,
    SimulationRequirementOut,
    SimulationScenarioOut,
    SimulationResultOut,
    SimulationTimelineOut,
)

router = APIRouter(
    prefix="/api/simulations",
    tags=["Disaster Simulation"],
)


@router.post(
    "",
    response_model=SimulationScenarioOut,
    status_code=201,
    summary="Create disaster simulation scenario (Admin only)",
)
def create_scenario(
    scenario_in: SimulationScenarioCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Create a new hypothetical disaster simulation scenario.
    """
    return SimulationService.create_scenario(
        db=db,
        scenario_in=scenario_in,
        creator_id=admin.id,
    )


@router.get(
    "",
    response_model=List[SimulationScenarioOut],
    summary="List disaster simulation scenarios (Admin only)",
)
def list_scenarios(
    status: Optional[str] = Query(None, description="Filter by status (draft, configured, completed, cancelled)"),
    disaster_type: Optional[str] = Query(None, description="Filter by disaster type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """
    List all configured and executed simulation scenarios.
    """
    return SimulationService.list_scenarios(
        db=db,
        status_filter=status,
        disaster_type=disaster_type,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{scenario_id}",
    response_model=SimulationScenarioOut,
    summary="Get simulation scenario details (Admin only)",
)
def get_scenario(
    scenario_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """
    Retrieve scenario configuration and requirements.
    """
    return SimulationService.get_scenario(db=db, scenario_id=scenario_id)


@router.patch(
    "/{scenario_id}",
    response_model=SimulationScenarioOut,
    summary="Update simulation scenario (Admin only)",
)
def update_scenario(
    scenario_id: int = Path(..., ge=1),
    update_in: SimulationScenarioUpdate = ...,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """
    Update scenario parameters. Only available when scenario is in draft or configured state.
    """
    return SimulationService.update_scenario(
        db=db,
        scenario_id=scenario_id,
        update_in=update_in,
    )


@router.post(
    "/{scenario_id}/requirements",
    response_model=SimulationRequirementOut,
    status_code=201,
    summary="Add skill requirement to scenario (Admin only)",
)
def add_requirement(
    scenario_id: int = Path(..., ge=1),
    req_in: SimulationRequirementCreate = ...,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """
    Add a simulated skill requirement to the disaster scenario.
    """
    return SimulationService.add_requirement(
        db=db,
        scenario_id=scenario_id,
        req_in=req_in,
    )


@router.delete(
    "/{scenario_id}/requirements/{req_id}",
    summary="Delete skill requirement from scenario (Admin only)",
)
def delete_requirement(
    scenario_id: int = Path(..., ge=1),
    req_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """
    Remove a skill requirement from an active simulation scenario.
    """
    return SimulationService.delete_requirement(
        db=db,
        scenario_id=scenario_id,
        req_id=req_id,
    )


@router.post(
    "/{scenario_id}/run",
    response_model=SimulationResultOut,
    summary="Execute disaster simulation model (Admin only)",
)
def run_simulation(
    scenario_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Execute the deterministic disaster simulation engine against current volunteer pool snapshot.
    Calculates demand, capacity, skill gaps, response pressure, and time-step timeline.
    """
    result = SimulationService.run_simulation(
        db=db,
        scenario_id=scenario_id,
    )
    AuditService.record_event(
        db=db,
        action="SIMULATION_RUN",
        entity_type="simulation_scenario",
        entity_id=scenario_id,
        actor_user_id=admin.id,
        outcome="success",
        metadata={
            "scenario_id": scenario_id,
            "disaster_type": result.disaster_type,
            "total_demand": result.total_demand,
            "response_pressure": result.response_pressure,
        },
    )
    return result


@router.get(
    "/{scenario_id}/results",
    response_model=SimulationResultOut,
    summary="Get execution results of scenario (Admin only)",
)
def get_simulation_results(
    scenario_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """
    Retrieve stored simulation results for a completed scenario.
    """
    return SimulationService.get_simulation_results(
        db=db,
        scenario_id=scenario_id,
    )


@router.get(
    "/{scenario_id}/timeline",
    response_model=SimulationTimelineOut,
    summary="Get simulation progression timeline (Admin only)",
)
def get_simulation_timeline(
    scenario_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """
    Retrieve time-step progression timeline for a completed disaster scenario.
    """
    return SimulationService.get_simulation_timeline(
        db=db,
        scenario_id=scenario_id,
    )
