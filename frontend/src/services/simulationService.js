/**
 * Disaster Simulation Service (Stage 14 — Disaster Simulation)
 * 
 * Provides isolated simulation management, hypothetical scenario modeling,
 * requirements configuration, capacity calculation, skill gap analysis,
 * response pressure scoring, and time-series progression.
 * 
 * STRICT ISOLATION RULE:
 * Simulation actions operate purely within the isolated simulation domain.
 * They NEVER create or mutate real operational emergencies, assignments, or notifications.
 * 
 * Backend API Integration:
 * - GET    /api/simulations
 * - POST   /api/simulations
 * - GET    /api/simulations/{id}
 * - PATCH  /api/simulations/{id}
 * - POST   /api/simulations/{id}/requirements
 * - DELETE /api/simulations/{id}/requirements/{req_id}
 * - POST   /api/simulations/{id}/run
 * - GET    /api/simulations/{id}/results
 * - GET    /api/simulations/{id}/timeline
 */

import {
  INITIAL_DEV_SIMULATIONS,
  SIMULATION_STATUSES,
  SIMULATION_DISASTER_TYPES
} from '../data/devSimulations.js';
import api from './api.js';

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
 * Normalize backend results to frontend simulation results shape
 */
const normalizeBackendResults = (res) => {
  if (!res) return null;
  const rawPressure = res.response_pressure || 'moderate';
  let tier = 'Moderate';
  let score = 50;

  if (typeof rawPressure === 'string') {
    const p = rawPressure.toLowerCase();
    if (p === 'critical') { tier = 'Critical'; score = 90; }
    else if (p === 'severe' || p === 'high') { tier = 'Severe'; score = 75; }
    else if (p === 'moderate' || p === 'medium') { tier = 'Moderate'; score = 50; }
    else { tier = 'Low'; score = 25; }
  }

  const skillGaps = (res.skills || []).map((s) => ({
    skill: s.skill_title || s.skill_category,
    category: s.skill_category,
    minProficiency: s.min_proficiency ? s.min_proficiency.charAt(0).toUpperCase() + s.min_proficiency.slice(1) : 'Intermediate',
    required: s.simulated_demand || s.required_volunteers || 0,
    available: s.available_volunteers || 0,
    gap: s.gap || 0,
    urgency: s.urgency ? s.urgency.charAt(0).toUpperCase() + s.urgency.slice(1) : 'High'
  }));

  const timeline = (res.timeline || []).map((t) => ({
    step: `T+${t.elapsed_hours}h`,
    label: `T+${t.elapsed_hours}h`,
    demand: t.active_demand,
    capacity: t.mobilized_capacity,
    fulfilled: t.fulfilled,
    pressure: t.response_pressure === 'critical' ? 90 : (t.response_pressure === 'high' ? 70 : 40)
  }));

  return {
    totalDemand: res.total_demand || 0,
    availableCapacity: res.total_available_capacity || 0,
    fulfilledDemand: res.total_fulfilled || 0,
    unfulfilledDemand: res.total_unfulfilled || 0,
    fulfillmentRate: typeof res.fulfillment_percentage === 'number' ? res.fulfillment_percentage : 0,
    responsePressureScore: score,
    responsePressureTier: tier,
    executedAt: res.executed_at || new Date().toISOString(),
    skillGaps,
    timeline
  };
};

/**
 * Normalize backend scenario to frontend scenario model
 */
const normalizeBackendScenario = (s) => {
  if (!s) return null;
  const statusMap = {
    draft: SIMULATION_STATUSES.DRAFT,
    configured: SIMULATION_STATUSES.CONFIGURED,
    running: SIMULATION_STATUSES.RUNNING,
    completed: SIMULATION_STATUSES.COMPLETED,
    failed: SIMULATION_STATUSES.FAILED
  };

  const status = statusMap[(s.status || '').toLowerCase()] || SIMULATION_STATUSES.DRAFT;
  const disasterType = s.disaster_type ? s.disaster_type.charAt(0).toUpperCase() + s.disaster_type.slice(1) : 'Disaster';

  const requirements = (s.requirements || []).map((r) => ({
    id: r.id,
    skill: r.skill_title || r.skill_category,
    category: r.skill_category || 'General',
    minProficiency: r.min_proficiency ? r.min_proficiency.charAt(0).toUpperCase() + r.min_proficiency.slice(1) : 'Intermediate',
    minVolunteers: r.required_volunteers || 1,
    urgency: r.urgency ? r.urgency.charAt(0).toUpperCase() + r.urgency.slice(1) : 'Medium'
  }));

  let results = null;
  let timeline = [];
  if (s.results) {
    results = normalizeBackendResults(s.results);
    timeline = results?.timeline || [];
  }

  return {
    id: s.id,
    name: s.name,
    disasterType: disasterType,
    affectedArea: s.description || `Sector (${s.center_latitude}, ${s.center_longitude})`,
    coordinates: [s.center_latitude || 18.5204, s.center_longitude || 73.8567],
    radius: s.affected_radius_km || 20,
    duration: s.duration_hours || 24,
    demandMultiplier: s.demand_multiplier || 1.0,
    status: status,
    createdAt: s.created_at || new Date().toISOString(),
    lastRun: s.updated_at || null,
    notes: s.description || '',
    requirements: requirements,
    results: results,
    timeline: timeline,
    isLive: true
  };
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
    if (typeof api !== 'undefined' && api?.getToken?.()) {
      try {
        const liveList = await api.get('/api/simulations');
        if (Array.isArray(liveList) && liveList.length > 0) {
          const normalized = liveList.map(normalizeBackendScenario);
          return normalized;
        }
      } catch (err) {
        console.warn('[simulationService] Live /api/simulations failed, using fallback:', err?.message || err);
      }
    }

    const list = getStoredSimulations();
    return JSON.parse(JSON.stringify(list));
  },

  /**
   * Retrieve specific disaster simulation scenario by ID
   */
  async getSimulation(id) {
    if (typeof api !== 'undefined' && api?.getToken?.() && !isNaN(Number(id))) {
      try {
        const s = await api.get(`/api/simulations/${id}`);
        if (s) {
          if (s.has_result) {
            try {
              const res = await api.get(`/api/simulations/${id}/results`);
              s.results = res;
            } catch {
              // ignore results error
            }
          }
          return normalizeBackendScenario(s);
        }
      } catch (err) {
        console.warn(`[simulationService] Live getSimulation(${id}) failed, falling back:`, err?.message || err);
      }
    }

    const list = getStoredSimulations();
    const match = list.find((s) => String(s.id) === String(id));
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

    if (typeof api !== 'undefined' && api?.getToken?.()) {
      try {
        const payload = {
          name: data.name.trim(),
          description: data.affectedArea.trim(),
          disaster_type: data.disasterType.toLowerCase(),
          severity: (data.severity || 'medium').toLowerCase(),
          center_latitude: Number(data.coordinates?.[0] || 18.5204),
          center_longitude: Number(data.coordinates?.[1] || 73.8567),
          affected_radius_km: Number(data.radius || 20),
          affected_population: Number(data.affectedPopulation || 5000),
          duration_hours: Number(data.duration || 24),
          demand_multiplier: Number(data.demandMultiplier || 1.0)
        };
        const created = await api.post('/api/simulations', payload);
        if (created) {
          const norm = normalizeBackendScenario(created);
          // Also record in local store
          const list = getStoredSimulations();
          list.unshift(norm);
          saveStoredSimulations(list);
          return norm;
        }
      } catch (err) {
        console.warn('[simulationService] Live createSimulation failed, fallback to local store:', err?.message || err);
      }
    }

    const list = getStoredSimulations();
    const id = `sim-${Date.now().toString(36)}`;

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
    if (typeof api !== 'undefined' && api?.getToken?.() && !isNaN(Number(id))) {
      try {
        const payload = {};
        if (updates.name) payload.name = updates.name.trim();
        if (updates.radius) payload.affected_radius_km = Number(updates.radius);
        if (updates.duration) payload.duration_hours = Number(updates.duration);
        if (updates.demandMultiplier) payload.demand_multiplier = Number(updates.demandMultiplier);
        if (updates.disasterType) payload.disaster_type = updates.disasterType.toLowerCase();

        const updated = await api.patch(`/api/simulations/${id}`, payload);
        if (updated) {
          return normalizeBackendScenario(updated);
        }
      } catch (err) {
        console.warn(`[simulationService] Live updateSimulation(${id}) failed, falling back:`, err?.message || err);
      }
    }

    const list = getStoredSimulations();
    const index = list.findIndex((s) => String(s.id) === String(id));
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
    const filtered = list.filter((s) => String(s.id) !== String(id));
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

    if (typeof api !== 'undefined' && api?.getToken?.() && !isNaN(Number(id))) {
      try {
        const payload = {
          skill_category: requirement.category || requirement.skill || 'General',
          skill_title: requirement.skill.trim(),
          min_proficiency: (requirement.minProficiency || 'intermediate').toLowerCase(),
          urgency: (requirement.urgency || 'medium').toLowerCase(),
          required_volunteers: Number(requirement.minVolunteers)
        };
        const res = await api.post(`/api/simulations/${id}/requirements`, payload);
        if (res) {
          return {
            id: res.id,
            skill: res.skill_title || res.skill_category,
            category: res.skill_category,
            minProficiency: res.min_proficiency ? res.min_proficiency.charAt(0).toUpperCase() + res.min_proficiency.slice(1) : 'Intermediate',
            minVolunteers: res.required_volunteers,
            urgency: res.urgency ? res.urgency.charAt(0).toUpperCase() + res.urgency.slice(1) : 'Medium'
          };
        }
      } catch (err) {
        console.warn(`[simulationService] Live addRequirement(${id}) failed, falling back:`, err?.message || err);
      }
    }

    const list = getStoredSimulations();
    const index = list.findIndex((s) => String(s.id) === String(id));
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
    const simIndex = list.findIndex((s) => String(s.id) === String(id));
    if (simIndex === -1) {
      throw new Error(`Simulation scenario not found: ${id}`);
    }

    const current = list[simIndex];
    const reqIndex = (current.requirements || []).findIndex((r) => String(r.id) === String(reqId));
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
    if (typeof api !== 'undefined' && api?.getToken?.() && !isNaN(Number(id)) && !isNaN(Number(reqId))) {
      try {
        await api.delete(`/api/simulations/${id}/requirements/${reqId}`);
      } catch (err) {
        console.warn(`[simulationService] Live deleteRequirement failed:`, err?.message || err);
      }
    }

    const list = getStoredSimulations();
    const index = list.findIndex((s) => String(s.id) === String(id));
    if (index === -1) {
      throw new Error(`Simulation scenario not found: ${id}`);
    }

    const current = list[index];
    current.requirements = (current.requirements || []).filter((r) => String(r.id) !== String(reqId));

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
    if (typeof api !== 'undefined' && api?.getToken?.() && !isNaN(Number(id))) {
      try {
        await api.post(`/api/simulations/${id}/run`, {});
        const res = await api.get(`/api/simulations/${id}/results`);
        const scenario = await this.getSimulation(id);
        scenario.status = SIMULATION_STATUSES.COMPLETED;
        scenario.results = normalizeBackendResults(res);
        scenario.timeline = scenario.results?.timeline || [];
        return scenario;
      } catch (err) {
        console.warn(`[simulationService] Live runSimulation(${id}) failed, falling back:`, err?.message || err);
      }
    }

    const list = getStoredSimulations();
    const index = list.findIndex((s) => String(s.id) === String(id));
    if (index === -1) {
      throw new Error(`Simulation scenario not found: ${id}`);
    }

    const current = list[index];

    if (!current.requirements || current.requirements.length === 0) {
      current.status = SIMULATION_STATUSES.FAILED;
      saveStoredSimulations(list);
      throw new Error('Simulation failed: Cannot execute scenario without at least one requirement.');
    }

    current.status = SIMULATION_STATUSES.RUNNING;
    list[index] = current;
    saveStoredSimulations(list);

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
    if (typeof api !== 'undefined' && api?.getToken?.() && !isNaN(Number(id))) {
      try {
        const res = await api.get(`/api/simulations/${id}/results`);
        if (res) {
          return normalizeBackendResults(res);
        }
      } catch (err) {
        console.warn(`[simulationService] Live getSimulationResults(${id}) failed:`, err?.message || err);
      }
    }

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
    if (typeof api !== 'undefined' && api?.getToken?.() && !isNaN(Number(id))) {
      try {
        const tl = await api.get(`/api/simulations/${id}/timeline`);
        if (tl && Array.isArray(tl.timeline)) {
          return tl.timeline.map((t) => ({
            step: `T+${t.elapsed_hours}h`,
            label: `T+${t.elapsed_hours}h`,
            demand: t.active_demand,
            capacity: t.mobilized_capacity,
            fulfilled: t.fulfilled,
            pressure: t.response_pressure === 'critical' ? 90 : 40
          }));
        }
      } catch (err) {
        console.warn(`[simulationService] Live getSimulationTimeline(${id}) failed:`, err?.message || err);
      }
    }

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
