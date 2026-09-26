/**
 * Disaster Simulation Service (Stage 14 — Disaster Simulation)
 * 
 * Provides isolated simulation management, hypothetical scenario modeling,
 * requirements configuration, capacity calculation, skill gap analysis,
 * response pressure scoring, and time-series progression.
 * 
 * STRICT ISOLATION RULE:
 * This service operates ONLY on simulated data (localStorage: csb_dev_simulations).
 * It NEVER mutates or invokes real emergencies, assignments, notifications, or volunteers.
 * 
 * Future Backend Architecture:
 * POST   /api/simulations
 * GET    /api/simulations
 * GET    /api/simulations/{id}
 * PATCH  /api/simulations/{id}
 * POST   /api/simulations/{id}/requirements
 * DELETE /api/simulations/{id}/requirements/{req_id}
 * POST   /api/simulations/{id}/run
 * GET    /api/simulations/{id}/results
 * GET    /api/simulations/{id}/timeline
 */

import {
  INITIAL_DEV_SIMULATIONS,
  SIMULATION_STATUSES,
  SIMULATION_DISASTER_TYPES
} from '../data/devSimulations.js';

const STORAGE_KEY = 'csb_dev_simulations';

/**
 * Safely retrieve simulations from local storage with fallback
 */
const getStoredSimulations = () => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_SIMULATIONS));
      }
      return JSON.parse(JSON.stringify(INITIAL_DEV_SIMULATIONS));
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[simulationService] Error reading cached simulations, using seed fallback:', err);
    return JSON.parse(JSON.stringify(INITIAL_DEV_SIMULATIONS));
  }
};

/**
 * Persist simulations to local storage
 */
const saveStoredSimulations = (simulations) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(simulations));
    }
  } catch (err) {
    console.error('[simulationService] Error saving simulations to storage:', err);
  }
};

/**
 * Calculate deterministic simulation metrics, capacity, gaps, pressure, and timeline
 * Keeps all mathematical calculations isolated in the service boundary.
 */
export const calculateSimulationMetrics = (simulation) => {
  const multiplier = Math.max(0.1, Number(simulation.demandMultiplier) || 1.0);
  const requirements = Array.isArray(simulation.requirements) ? simulation.requirements : [];

  let totalDemand = 0;
  let availableCapacity = 0;
  let fulfilledDemand = 0;
  const skillGaps = [];

  requirements.forEach((req) => {
    const baseRequired = Math.max(1, Number(req.minVolunteers) || 1);
    const required = Math.round(baseRequired * multiplier);
    totalDemand += required;

    // Deterministic simulated capacity based on skill, radius, and urgency
    const skillHash = (req.skill || '').length + (req.category || '').length + (req.minProficiency || '').length;
    // Radius factor: larger radius reaches slightly more volunteer pool
    const radiusFactor = Math.min(1.4, Math.max(0.7, (Number(simulation.radius) || 15) / 15));
    // Variance factor between 0.60 and 1.15
    const variance = (0.60 + ((skillHash % 11) * 0.05)) * radiusFactor;
    const available = Math.max(1, Math.round(required * variance));
    availableCapacity += available;

    const fulfilled = Math.min(required, available);
    fulfilledDemand += fulfilled;

    const gap = Math.max(0, required - available);

    skillGaps.push({
      skill: req.skill,
      category: req.category,
      minProficiency: req.minProficiency,
      required,
      available,
      gap,
      urgency: req.urgency || 'High'
    });
  });

  const unfulfilledDemand = Math.max(0, totalDemand - fulfilledDemand);
  const fulfillmentRate = totalDemand > 0 ? Number(((fulfilledDemand / totalDemand) * 100).toFixed(1)) : 100;

  // Response pressure calculation
  const deficitRatio = totalDemand > 0 ? unfulfilledDemand / totalDemand : 0;
  const criticalDeficits = skillGaps.filter(
    (g) => (g.urgency === 'Critical' || g.urgency === 'High') && g.gap > 0
  ).length;
  const criticalWeight = skillGaps.length > 0 ? criticalDeficits / skillGaps.length : 0;

  const rawPressure = Math.min(100, Math.max(10, Math.round(deficitRatio * 60 + criticalWeight * 40)));
  
  let responsePressureTier = 'Low';
  if (rawPressure >= 80) responsePressureTier = 'Critical';
  else if (rawPressure >= 65) responsePressureTier = 'Severe';
  else if (rawPressure >= 45) responsePressureTier = 'High';
  else if (rawPressure >= 25) responsePressureTier = 'Moderate';

  // Generate 5-step timeline over duration
  const duration = Math.max(6, Number(simulation.duration) || 48);
  const t0 = 0;
  const t1 = Math.max(2, Math.round(duration * 0.15));
  const t2 = Math.max(t1 + 2, Math.round(duration * 0.35));
  const t3 = Math.max(t2 + 2, Math.round(duration * 0.65));
  const t4 = duration;

  const timeline = [
    {
      step: `T+${t0}h`,
      label: `T+${t0}h (Onset & Initial Impact)`,
      demand: Math.round(totalDemand * 0.35),
      capacity: Math.round(availableCapacity * 0.20),
      fulfilled: Math.round(availableCapacity * 0.20),
      pressure: Math.min(100, rawPressure + 10)
    },
    {
      step: `T+${t1}h`,
      label: `T+${t1}h (First-Wave Mobilization)`,
      demand: Math.round(totalDemand * 0.70),
      capacity: Math.round(availableCapacity * 0.50),
      fulfilled: Math.round(availableCapacity * 0.50),
      pressure: Math.min(100, rawPressure + 5)
    },
    {
      step: `T+${t2}h`,
      label: `T+${t2}h (Peak Response Pressure)`,
      demand: totalDemand,
      capacity: Math.round(availableCapacity * 0.85),
      fulfilled: Math.round(Math.min(totalDemand, availableCapacity * 0.85)),
      pressure: rawPressure
    },
    {
      step: `T+${t3}h`,
      label: `T+${t3}h (Secondary Staging Relief)`,
      demand: Math.round(totalDemand * 0.90),
      capacity: availableCapacity,
      fulfilled: fulfilledDemand,
      pressure: Math.max(15, rawPressure - 15)
    },
    {
      step: `T+${t4}h`,
      label: `T+${t4}h (Stabilization & Demobilization)`,
      demand: Math.round(totalDemand * 0.45),
      capacity: availableCapacity,
      fulfilled: Math.round(totalDemand * 0.45),
      pressure: Math.max(10, Math.round(rawPressure * 0.45))
    }
  ];

  return {
    results: {
      totalDemand,
      availableCapacity,
      fulfilledDemand,
      unfulfilledDemand,
      fulfillmentRate,
      responsePressureScore: rawPressure,
      responsePressureTier,
      executedAt: new Date().toISOString(),
      skillGaps
    },
    timeline
  };
};

export const simulationService = {
  /**
   * Retrieve all disaster simulation scenarios
   */
  async getSimulations() {
    const list = getStoredSimulations();
    return JSON.parse(JSON.stringify(list));
  },

  /**
   * Retrieve specific disaster simulation scenario by ID
   */
  async getSimulation(id) {
    const list = getStoredSimulations();
    const match = list.find((s) => s.id === id);
    if (!match) {
      throw new Error(`Simulation scenario not found: ${id}`);
    }
    return JSON.parse(JSON.stringify(match));
  },

  /**
   * Create a new simulation scenario
   */
  async createSimulation(data) {
    if (!data.name || !data.name.trim()) {
      throw new Error('Scenario name is required.');
    }
    if (!data.disasterType || !SIMULATION_DISASTER_TYPES.includes(data.disasterType)) {
      throw new Error('Valid disaster type must be selected.');
    }
    if (!data.affectedArea || !data.affectedArea.trim()) {
      throw new Error('Affected area is required.');
    }
    if (isNaN(Number(data.radius)) || Number(data.radius) <= 0) {
      throw new Error('Radius must be a valid positive number in kilometers.');
    }
    if (isNaN(Number(data.duration)) || Number(data.duration) <= 0) {
      throw new Error('Duration must be a valid positive number in hours.');
    }
    if (isNaN(Number(data.demandMultiplier)) || Number(data.demandMultiplier) <= 0) {
      throw new Error('Demand multiplier must be a valid positive number.');
    }

    const list = getStoredSimulations();
    const id = `sim-${Date.now().toString(36)}`;

    // Default coordinates based on typical municipal areas or fallback
    let coords = [34.055, -118.25];
    if (data.coordinates && Array.isArray(data.coordinates) && data.coordinates.length >= 2) {
      coords = data.coordinates;
    }

    const newSim = {
      id,
      name: data.name.trim(),
      disasterType: data.disasterType,
      affectedArea: data.affectedArea.trim(),
      coordinates: coords,
      radius: Number(data.radius),
      duration: Number(data.duration),
      demandMultiplier: Number(data.demandMultiplier),
      status: SIMULATION_STATUSES.DRAFT,
      createdAt: new Date().toISOString(),
      lastRun: null,
      notes: data.notes ? data.notes.trim() : '',
      requirements: Array.isArray(data.requirements) ? data.requirements : [],
      results: null,
      timeline: []
    };

    if (newSim.requirements.length > 0) {
      newSim.status = SIMULATION_STATUSES.CONFIGURED;
    }

    list.unshift(newSim);
    saveStoredSimulations(list);
    return JSON.parse(JSON.stringify(newSim));
  },

  /**
   * Update scenario configuration
   */
  async updateSimulation(id, updates) {
    const list = getStoredSimulations();
    const index = list.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Simulation scenario not found: ${id}`);
    }

    const current = list[index];

    if (updates.name !== undefined && !updates.name.trim()) {
      throw new Error('Scenario name cannot be empty.');
    }
    if (updates.radius !== undefined && (isNaN(Number(updates.radius)) || Number(updates.radius) <= 0)) {
      throw new Error('Radius must be a positive number.');
    }
    if (updates.duration !== undefined && (isNaN(Number(updates.duration)) || Number(updates.duration) <= 0)) {
      throw new Error('Duration must be a positive number.');
    }
    if (updates.demandMultiplier !== undefined && (isNaN(Number(updates.demandMultiplier)) || Number(updates.demandMultiplier) <= 0)) {
      throw new Error('Demand multiplier must be a positive number.');
    }

    const updated = {
      ...current,
      ...updates,
      id: current.id,
      createdAt: current.createdAt
    };

    // If requirements are present and status was Draft, advance to Configured
    if (updated.requirements.length > 0 && updated.status === SIMULATION_STATUSES.DRAFT) {
      updated.status = SIMULATION_STATUSES.CONFIGURED;
    }

    list[index] = updated;
    saveStoredSimulations(list);
    return JSON.parse(JSON.stringify(updated));
  },

  /**
   * Delete a simulation scenario
   */
  async deleteSimulation(id) {
    const list = getStoredSimulations();
    const filtered = list.filter((s) => s.id !== id);
    if (filtered.length === list.length) {
      throw new Error(`Simulation scenario not found: ${id}`);
    }
    saveStoredSimulations(filtered);
    return { success: true, id };
  },

  /**
   * Add a requirement to a simulation scenario
   */
  async addRequirement(id, requirement) {
    if (!requirement.skill || !requirement.skill.trim()) {
      throw new Error('Skill name is required.');
    }
    if (isNaN(Number(requirement.minVolunteers)) || Number(requirement.minVolunteers) <= 0) {
      throw new Error('Minimum volunteers must be a positive number.');
    }

    const list = getStoredSimulations();
    const index = list.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Simulation scenario not found: ${id}`);
    }

    const current = list[index];
    const reqId = `req-sim-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;

    const newReq = {
      id: reqId,
      skill: requirement.skill.trim(),
      category: requirement.category || 'General Emergency',
      minProficiency: requirement.minProficiency || 'Intermediate',
      minVolunteers: Number(requirement.minVolunteers),
      urgency: requirement.urgency || 'High'
    };

    current.requirements = [...(current.requirements || []), newReq];
    if (current.status === SIMULATION_STATUSES.DRAFT) {
      current.status = SIMULATION_STATUSES.CONFIGURED;
    }

    list[index] = current;
    saveStoredSimulations(list);
    return JSON.parse(JSON.stringify(newReq));
  },

  /**
   * Update an existing simulation requirement
   */
  async updateRequirement(id, reqId, updates) {
    const list = getStoredSimulations();
    const simIndex = list.findIndex((s) => s.id === id);
    if (simIndex === -1) {
      throw new Error(`Simulation scenario not found: ${id}`);
    }

    const current = list[simIndex];
    const reqIndex = (current.requirements || []).findIndex((r) => r.id === reqId);
    if (reqIndex === -1) {
      throw new Error(`Requirement not found: ${reqId}`);
    }

    const updatedReq = {
      ...current.requirements[reqIndex],
      ...updates,
      id: reqId
    };

    current.requirements[reqIndex] = updatedReq;
    list[simIndex] = current;
    saveStoredSimulations(list);
    return JSON.parse(JSON.stringify(updatedReq));
  },

  /**
   * Delete a requirement from a simulation scenario
   */
  async deleteRequirement(id, reqId) {
    const list = getStoredSimulations();
    const index = list.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Simulation scenario not found: ${id}`);
    }

    const current = list[index];
    current.requirements = (current.requirements || []).filter((r) => r.id !== reqId);

    if (current.requirements.length === 0 && current.status === SIMULATION_STATUSES.CONFIGURED) {
      current.status = SIMULATION_STATUSES.DRAFT;
    }

    list[index] = current;
    saveStoredSimulations(list);
    return { success: true, reqId };
  },

  /**
   * Run simulation execution
   * Calculates metrics, updates state from Running -> Completed (or Failed), produces results and timeline.
   */
  async runSimulation(id) {
    const list = getStoredSimulations();
    const index = list.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Simulation scenario not found: ${id}`);
    }

    const current = list[index];

    if (!current.requirements || current.requirements.length === 0) {
      current.status = SIMULATION_STATUSES.FAILED;
      saveStoredSimulations(list);
      throw new Error('Simulation failed: Cannot execute scenario without at least one requirement.');
    }

    // Set status to Running
    current.status = SIMULATION_STATUSES.RUNNING;
    list[index] = current;
    saveStoredSimulations(list);

    // Compute deterministic simulation outputs
    const { results, timeline } = calculateSimulationMetrics(current);

    current.status = SIMULATION_STATUSES.COMPLETED;
    current.lastRun = new Date().toISOString();
    current.results = results;
    current.timeline = timeline;

    list[index] = current;
    saveStoredSimulations(list);
    return JSON.parse(JSON.stringify(current));
  },

  /**
   * Get simulation results by scenario ID
   */
  async getSimulationResults(id) {
    const sim = await this.getSimulation(id);
    if (!sim.results) {
      throw new Error(`No simulation results available for scenario: ${id}`);
    }
    return JSON.parse(JSON.stringify(sim.results));
  },

  /**
   * Get simulation timeline progression by scenario ID
   */
  async getSimulationTimeline(id) {
    const sim = await this.getSimulation(id);
    if (!sim.timeline || sim.timeline.length === 0) {
      throw new Error(`No simulation timeline available for scenario: ${id}`);
    }
    return JSON.parse(JSON.stringify(sim.timeline));
  },

  /**
   * Reset simulation data store to initial seed records
   */
  resetDevelopmentSimulations() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_SIMULATIONS));
    }
    return JSON.parse(JSON.stringify(INITIAL_DEV_SIMULATIONS));
  }
};

export default simulationService;
