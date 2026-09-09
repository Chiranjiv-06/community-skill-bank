"""
app/models/simulation.py

SQLAlchemy Models for Module 19 — Advanced Disaster Simulation Engine.
Provides isolated storage for hypothetical disaster scenarios, requirements, and execution results.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class SimulationScenario(Base):
    __tablename__ = "simulation_scenarios"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    disaster_type = Column(String(50), nullable=False)  # flood, earthquake, cyclone, fire, hazmat, pandemic, other
    severity = Column(String(20), default="medium", nullable=False)  # critical, high, medium, low
    
    # Geographic scope
    center_latitude = Column(Float, nullable=False)
    center_longitude = Column(Float, nullable=False)
    affected_radius_km = Column(Float, default=20.0, nullable=False)
    affected_population = Column(Integer, default=1000, nullable=False)
    
    # Operational constraints
    duration_hours = Column(Integer, default=24, nullable=False)
    demand_multiplier = Column(Float, default=1.0, nullable=False)
    
    # Scenario lifecycle: draft, configured, running, completed, cancelled
    status = Column(String(20), default="draft", nullable=False, index=True)
    
    creator_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    creator = relationship("User", foreign_keys=[creator_id])
    requirements = relationship(
        "SimulationRequirement",
        back_populates="scenario",
        cascade="all, delete-orphan",
        order_by="SimulationRequirement.id",
    )
    result = relationship(
        "SimulationResult",
        uselist=False,
        back_populates="scenario",
        cascade="all, delete-orphan",
    )


class SimulationRequirement(Base):
    __tablename__ = "simulation_requirements"

    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(
        Integer,
        ForeignKey("simulation_scenarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    skill_category = Column(String(100), nullable=False)
    skill_title = Column(String(255), nullable=True)
    min_proficiency = Column(String(20), default="intermediate", nullable=False)
    urgency = Column(String(20), default="medium", nullable=False)  # low, medium, high, critical
    required_volunteers = Column(Integer, default=1, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship
    scenario = relationship("SimulationScenario", back_populates="requirements")


class SimulationResult(Base):
    __tablename__ = "simulation_results"

    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(
        Integer,
        ForeignKey("simulation_scenarios.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    
    total_demand = Column(Integer, default=0, nullable=False)
    total_available_capacity = Column(Integer, default=0, nullable=False)
    total_fulfilled = Column(Integer, default=0, nullable=False)
    total_unfulfilled = Column(Integer, default=0, nullable=False)
    fulfillment_percentage = Column(Float, default=0.0, nullable=False)
    
    # Response pressure: low, moderate, high, critical
    response_pressure = Column(String(20), default="low", nullable=False)
    geographic_coverage_percentage = Column(Float, default=0.0, nullable=False)
    eligible_volunteer_count = Column(Integer, default=0, nullable=False)
    
    # Structured JSON data
    skill_results_json = Column(JSON, nullable=True)
    timeline_json = Column(JSON, nullable=True)
    
    executed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship
    scenario = relationship("SimulationScenario", back_populates="result")
