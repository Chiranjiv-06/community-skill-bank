/**
 * Emergency Management Service (Stage 5 & Stage 17 Integration)
 * 
 * Provides incident operations, emergency declarations, status transitions,
 * and personnel requirement quotas using central FastAPI endpoints with
 * local state fallback for offline support.
 */

import { api } from './api.js';
import {
  INITIAL_DEV_EMERGENCIES,
  EMERGENCY_STATUSES,
  EMERGENCY_SEVERITIES,
  REQUIREMENT_URGENCIES
} from '../data/devEmergencies.js';
import { SKILL_CATEGORIES, PROFICIENCY_LEVELS } from '../data/skillCategories.js';
import { realtimeService } from './realtimeService.js';
import { connectivityService } from './connectivityService.js';
import { offlineSyncService } from './offlineSyncService.js';

const STORAGE_KEY = 'csb_dev_emergencies';

/**
 * Helper to normalize backend requirement model to frontend shape
 */
const capProficiency = (prof) => {
  if (!prof) return 'Intermediate';
  const str = String(prof).trim();
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const normalizeRequirement = (req) => {
  if (!req) return null;
  const minVols = req.min_volunteers_needed !== undefined
    ? Number(req.min_volunteers_needed)
    : (req.minVolunteers !== undefined ? Number(req.minVolunteers) : 1);
  return {
    id: String(req.id),
    numericId: Number(req.id) || null,
    emergencyId: String(req.emergency_id || req.emergencyId || ''),
    skill: req.skill_title || req.skill || req.skill_category || 'Disaster First Responder',
    category: req.skill_category || req.category || 'General',
    minProficiency: capProficiency(req.min_proficiency || req.minProficiency),
    minVolunteers: minVols,
    urgency: (req.urgency || 'medium').toLowerCase(),
    fulfillmentStatus: req.fulfillmentStatus || `0 / ${minVols} Allocated`,
    createdTime: req.created_at || req.createdTime || new Date().toISOString(),
    updatedTime: req.updated_at || req.updatedTime || req.created_at || new Date().toISOString()
  };
};

/**
 * Helper to normalize backend emergency model to frontend shape
 */
export const normalizeEmergency = (item, requirements = []) => {
  if (!item) return null;
  const numId = Number(item.id);
  const strId = String(item.id);
  const reqs = Array.isArray(requirements) && requirements.length > 0
    ? requirements.map(normalizeRequirement)
    : (Array.isArray(item.requirements) ? item.requirements.map(normalizeRequirement) : []);

  let requiredVolunteers = Number(item.requiredVolunteers || item.required_volunteers);
  if (!requiredVolunteers || isNaN(requiredVolunteers)) {
    requiredVolunteers = reqs.length > 0
      ? reqs.reduce((sum, r) => sum + (Number(r.minVolunteers) || 1), 0)
      : 5;
  }

  return {
    id: strId,
    numericId: !isNaN(numId) ? numId : null,
    title: item.title || '',
    description: item.description || '',
    category: item.category || 'General Emergency',
    severity: (item.severity || 'medium').toLowerCase(),
    status: (item.status || 'open').toLowerCase(),
    location: item.location || '',
    latitude: item.latitude !== null && item.latitude !== undefined && item.latitude !== '' ? Number(item.latitude) : null,
    longitude: item.longitude !== null && item.longitude !== undefined && item.longitude !== '' ? Number(item.longitude) : null,
    requiredVolunteers,
    reporterId: item.reporter_id || item.reporterId || null,
    createdTime: item.created_at || item.createdTime || new Date().toISOString(),
    updatedTime: item.updated_at || item.updatedTime || item.created_at || new Date().toISOString(),
    requirements: reqs
  };
};

/**
 * Safely parse emergency ID into integer if possible
 */
export const parseEmergencyId = (id) => {
  if (typeof id === 'number') return id;
  if (!id) return null;
  const str = String(id).trim();
  if (str.startsWith('emg-')) {
    const candidate = parseInt(str.replace('emg-', ''), 10);
    if (!isNaN(candidate)) return candidate;
  }
  const direct = parseInt(str, 10);
  return !isNaN(direct) ? direct : null;
};

export const emergencyService = {
  /**
   * Helper to load emergencies from localStorage or default seed
   * @private
   */
  _loadAll() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item) => normalizeEmergency(item));
        }
      }
    } catch (err) {
      console.warn('[emergencyService] Failed to read from storage:', err);
    }
    // Save initial seed to storage for persistence
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_EMERGENCIES));
    } catch (err) {
      console.warn('[emergencyService] Failed to seed storage:', err);
    }
    return JSON.parse(JSON.stringify(INITIAL_DEV_EMERGENCIES)).map((item) => normalizeEmergency(item));
  },

  /**
   * Helper to persist emergencies to storage
   * @private
   */
  _saveAll(emergencies) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(emergencies));
    } catch (err) {
      console.warn('[emergencyService] Failed to save to storage:', err);
    }
  },

  /**
   * Get all emergencies with optional filters
   * @param {Object} filters - { search, status, severity, category }
   * @returns {Promise<Array>}
   */
  async getEmergencies(filters = {}) {
    const { search = '', status = 'ALL', severity = 'ALL' } = filters;

    // 1. Try real backend API
    try {
      const params = {};
      if (status && status !== 'ALL') {
        params.status = status.toLowerCase();
      }
      if (severity && severity !== 'ALL') {
        params.severity = severity.toLowerCase();
      }
      const queryParams = new URLSearchParams(params).toString();
      const endpoint = `/api/emergencies/${queryParams ? `?${queryParams}` : ''}`;
      const data = await api.get(endpoint);

      if (Array.isArray(data)) {
        const list = data.map((item) => normalizeEmergency(item));

        // Client-side search keyword filter if requested
        let filtered = list;
        if (search && search.trim() !== '') {
          const query = search.toLowerCase().trim();
          filtered = filtered.filter((item) => {
            const matchesTitle = item.title?.toLowerCase().includes(query);
            const matchesLocation = item.location?.toLowerCase().includes(query);
            const matchesDescription = item.description?.toLowerCase().includes(query);
            const matchesCategory = item.category?.toLowerCase().includes(query);
            const matchesSkill = item.requirements?.some((r) =>
              r.skill?.toLowerCase().includes(query) || r.category?.toLowerCase().includes(query)
            );
            return matchesTitle || matchesLocation || matchesDescription || matchesCategory || matchesSkill;
          });
        }

        // Cache live emergencies to storage
        this._saveAll(list);
        return filtered;
      }
    } catch (err) {
      console.warn('[emergencyService] Backend /api/emergencies/ unavailable, using fallback:', err.message);
    }

    // 2. Offline / local fallback
    const list = this._loadAll();
    return list.filter((item) => {
      if (status && status !== 'ALL' && item.status?.toLowerCase() !== status.toLowerCase()) {
        return false;
      }
      if (severity && severity !== 'ALL' && item.severity?.toLowerCase() !== severity.toLowerCase()) {
        return false;
      }
      if (search && search.trim() !== '') {
        const query = search.toLowerCase().trim();
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesLocation = item.location?.toLowerCase().includes(query);
        const matchesDescription = item.description?.toLowerCase().includes(query);
        const matchesCategory = item.category?.toLowerCase().includes(query);
        const matchesSkill = item.requirements?.some((r) =>
          r.skill?.toLowerCase().includes(query) || r.category?.toLowerCase().includes(query)
        );
        if (!matchesTitle && !matchesLocation && !matchesDescription && !matchesCategory && !matchesSkill) {
          return false;
        }
      }
      return true;
    });
  },

  /**
   * Get a single emergency by ID
   * @param {string|number} id
   * @returns {Promise<Object|null>}
   */
  async getEmergencyById(id) {
    const numericId = parseEmergencyId(id);
    if (numericId !== null) {
      try {
        const [emgData, reqsData] = await Promise.all([
          api.get(`/api/emergencies/${numericId}`),
          api.get(`/api/emergencies/${numericId}/requirements`).catch(() => [])
        ]);
        if (emgData) {
          const normalized = normalizeEmergency(emgData, reqsData);
          return normalized;
        }
      } catch (err) {
        console.warn(`[emergencyService] Backend /api/emergencies/${numericId} failed:`, err.message);
      }
    }

    const list = this._loadAll();
    const found = list.find((e) => String(e.id) === String(id) || (numericId !== null && e.numericId === numericId));
    return found ? JSON.parse(JSON.stringify(found)) : null;
  },

  /**
   * Create a new emergency declaration
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async createEmergency(data) {
    const title = data.title?.trim();
    const description = data.description?.trim();
    const location = data.location?.trim();
    const severity = (data.severity || 'medium').toLowerCase();
    const status = (data.status || 'open').toLowerCase();
    const requiredVolunteers = Number(data.requiredVolunteers) || 5;

    if (!title) {
      throw new Error('Emergency title is required.');
    }
    if (!description) {
      throw new Error('Emergency description is required.');
    }
    if (!location) {
      throw new Error('Incident location is required.');
    }
    if (!EMERGENCY_SEVERITIES.includes(severity)) {
      throw new Error(`Severity must be one of: ${EMERGENCY_SEVERITIES.join(', ')}`);
    }
    if (!EMERGENCY_STATUSES.includes(status)) {
      throw new Error(`Status must be one of: ${EMERGENCY_STATUSES.join(', ')}`);
    }
    if (isNaN(requiredVolunteers) || requiredVolunteers <= 0) {
      throw new Error('Required volunteers must be a positive number.');
    }

    let lat = null;
    let lng = null;
    if (data.latitude !== '' && data.latitude !== undefined && data.latitude !== null) {
      lat = Number(data.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        throw new Error('Latitude must be a valid number between -90 and 90.');
      }
    }
    if (data.longitude !== '' && data.longitude !== undefined && data.longitude !== null) {
      lng = Number(data.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        throw new Error('Longitude must be a valid number between -180 and 180.');
      }
    }

    // Try live API POST /api/emergencies/
    try {
      const payload = {
        title,
        description,
        category: data.category || 'General Emergency',
        severity,
        location,
        latitude: lat,
        longitude: lng
      };
      const created = await api.post('/api/emergencies/', payload);
      if (created && created.id) {
        let createdReqs = [];
        if (Array.isArray(data.requirements) && data.requirements.length > 0) {
          for (const req of data.requirements) {
            try {
              const reqCreated = await this.createRequirement(created.id, req);
              createdReqs.push(reqCreated);
            } catch (rErr) {
              console.warn('[emergencyService] Requirement creation skipped:', rErr.message);
            }
          }
        }
        const normalized = normalizeEmergency(created, createdReqs);
        const list = this._loadAll();
        this._saveAll([normalized, ...list]);
        return normalized;
      }
    } catch (err) {
      console.warn('[emergencyService] Live createEmergency failed, falling back:', err.message);
    }

    // Offline / fallback storage
    const now = new Date().toISOString();
    const newEmergency = {
      id: `emg-${Date.now()}`,
      title,
      description,
      location,
      latitude: lat,
      longitude: lng,
      severity,
      status,
      requiredVolunteers,
      createdTime: now,
      updatedTime: now,
      requirements: Array.isArray(data.requirements) ? data.requirements : []
    };

    const list = this._loadAll();
    const updatedList = [newEmergency, ...list];
    this._saveAll(updatedList);
    return newEmergency;
  },

  /**
   * Update editable emergency fields
   * @param {string|number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async updateEmergency(id, data) {
    const numericId = parseEmergencyId(id);
    const title = data.title !== undefined ? data.title.trim() : undefined;
    const description = data.description !== undefined ? data.description.trim() : undefined;
    const location = data.location !== undefined ? data.location.trim() : undefined;
    const severity = data.severity !== undefined ? data.severity.toLowerCase() : undefined;
    const category = data.category !== undefined ? data.category : undefined;

    let lat = undefined;
    let lng = undefined;
    if (data.latitude !== undefined && data.latitude !== '' && data.latitude !== null) {
      lat = Number(data.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        throw new Error('Latitude must be a valid number between -90 and 90.');
      }
    }
    if (data.longitude !== undefined && data.longitude !== '' && data.longitude !== null) {
      lng = Number(data.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        throw new Error('Longitude must be a valid number between -180 and 180.');
      }
    }

    if (numericId !== null) {
      try {
        const payload = {};
        if (title !== undefined) payload.title = title;
        if (description !== undefined) payload.description = description;
        if (location !== undefined) payload.location = location;
        if (severity !== undefined) payload.severity = severity;
        if (category !== undefined) payload.category = category;
        if (lat !== undefined) payload.latitude = lat;
        if (lng !== undefined) payload.longitude = lng;

        const updated = await api.patch(`/api/emergencies/${numericId}`, payload);
        if (updated) {
          const reqs = await api.get(`/api/emergencies/${numericId}/requirements`).catch(() => []);
          const normalized = normalizeEmergency(updated, reqs);
          const list = this._loadAll();
          const idx = list.findIndex((e) => String(e.id) === String(id) || e.numericId === numericId);
          if (idx !== -1) {
            list[idx] = normalized;
            this._saveAll(list);
          }
          return normalized;
        }
      } catch (err) {
        console.warn(`[emergencyService] PATCH /api/emergencies/${numericId} failed:`, err.message);
      }
    }

    // Local storage fallback
    const list = this._loadAll();
    const index = list.findIndex((e) => String(e.id) === String(id) || (numericId !== null && e.numericId === numericId));
    if (index === -1) {
      throw new Error(`Emergency with ID "${id}" was not found.`);
    }

    const current = list[index];
    const updated = {
      ...current,
      title: title !== undefined ? title : current.title,
      description: description !== undefined ? description : current.description,
      location: location !== undefined ? location : current.location,
      latitude: lat !== undefined ? lat : current.latitude,
      longitude: lng !== undefined ? lng : current.longitude,
      severity: severity !== undefined ? severity : current.severity,
      status: data.status !== undefined ? data.status.toLowerCase() : current.status,
      requiredVolunteers: data.requiredVolunteers !== undefined ? Number(data.requiredVolunteers) : current.requiredVolunteers,
      id: current.id,
      createdTime: current.createdTime,
      updatedTime: new Date().toISOString()
    };

    list[index] = updated;
    this._saveAll(list);
    return updated;
  },

  /**
   * Fast status change transition
   * @param {string|number} id
   * @param {string} newStatus
   * @returns {Promise<Object>}
   */
  async updateEmergencyStatus(id, newStatus) {
    const normStatus = (newStatus || 'open').toLowerCase();
    if (!EMERGENCY_STATUSES.includes(normStatus)) {
      throw new Error(`Status must be one of: ${EMERGENCY_STATUSES.join(', ')}`);
    }

    const numericId = parseEmergencyId(id);
    if (numericId !== null) {
      try {
        const updated = await api.patch(`/api/emergencies/${numericId}/status`, { status: normStatus });
        if (updated) {
          const reqs = await api.get(`/api/emergencies/${numericId}/requirements`).catch(() => []);
          const normalized = normalizeEmergency(updated, reqs);
          const list = this._loadAll();
          const idx = list.findIndex((e) => String(e.id) === String(id) || e.numericId === numericId);
          if (idx !== -1) {
            list[idx] = normalized;
            this._saveAll(list);
          }
          return normalized;
        }
      } catch (err) {
        console.warn(`[emergencyService] PATCH /api/emergencies/${numericId}/status failed:`, err.message);
      }
    }

    const list = this._loadAll();
    const index = list.findIndex((e) => String(e.id) === String(id) || (numericId !== null && e.numericId === numericId));
    if (index === -1) {
      throw new Error(`Emergency with ID "${id}" was not found.`);
    }

    list[index] = {
      ...list[index],
      status: normStatus,
      updatedTime: new Date().toISOString()
    };
    this._saveAll(list);

    // Real-time event integration
    try {
      realtimeService.dispatchRealtimeEvent({
        type: 'emergency',
        priority: normStatus === 'in_progress' ? 'high' : 'normal',
        title: `Emergency Status: ${normStatus.toUpperCase()}`,
        message: `Incident "${list[index].title}" transitioned to ${normStatus}.`,
        targetRole: 'all',
        entityType: 'emergency',
        entityId: String(id),
        link: `/volunteer/emergencies/${id}`
      }).catch(() => {});
    } catch (_) {}

    return list[index];
  },

  /**
   * Delete an emergency declaration
   * @param {string|number} id
   * @returns {Promise<{ success: boolean, id: string }>}
   */
  async deleteEmergency(id) {
    const numericId = parseEmergencyId(id);
    if (numericId !== null) {
      try {
        await this.updateEmergencyStatus(numericId, 'cancelled');
      } catch (_) {}
    }

    const list = this._loadAll();
    const filtered = list.filter((e) => String(e.id) !== String(id) && (numericId === null || e.numericId !== numericId));
    this._saveAll(filtered);
    return { success: true, id: String(id) };
  },

  // =========================================================================
  // EMERGENCY REQUIREMENTS
  // =========================================================================

  /**
   * Get all requirements for an emergency
   * @param {string|number} emergencyId
   * @returns {Promise<Array>}
   */
  async getEmergencyRequirements(emergencyId) {
    const numericId = parseEmergencyId(emergencyId);
    if (numericId !== null) {
      try {
        const data = await api.get(`/api/emergencies/${numericId}/requirements`);
        if (Array.isArray(data)) {
          return data.map(normalizeRequirement);
        }
      } catch (err) {
        console.warn(`[emergencyService] GET /api/emergencies/${numericId}/requirements failed:`, err.message);
      }
    }

    const emergency = await this.getEmergencyById(emergencyId);
    if (!emergency) {
      throw new Error(`Emergency with ID "${emergencyId}" was not found.`);
    }
    return emergency.requirements || [];
  },

  /**
   * Add a requirement to an emergency
   * @param {string|number} emergencyId
   * @param {Object} data - { skill, category, minProficiency, minVolunteers, urgency }
   * @returns {Promise<Object>}
   */
  async createRequirement(emergencyId, data) {
    const skill = data.skill?.trim();
    const category = data.category;
    const minProficiency = capProficiency(data.minProficiency);
    const minVolunteers = Number(data.minVolunteers);
    const urgency = (data.urgency || 'medium').toLowerCase();

    if (!skill) {
      throw new Error('Required skill is required.');
    }
    if (!category || !SKILL_CATEGORIES.includes(category)) {
      throw new Error('Please select a valid disaster skill category.');
    }
    if (!PROFICIENCY_LEVELS.includes(minProficiency)) {
      throw new Error(`Minimum proficiency must be one of: ${PROFICIENCY_LEVELS.join(', ')}`);
    }
    if (isNaN(minVolunteers) || minVolunteers <= 0) {
      throw new Error('Minimum volunteers must be a positive integer.');
    }
    if (!REQUIREMENT_URGENCIES.includes(urgency)) {
      throw new Error(`Urgency must be one of: ${REQUIREMENT_URGENCIES.join(', ')}`);
    }

    const numericId = parseEmergencyId(emergencyId);
    if (numericId !== null) {
      try {
        const payload = {
          skill_category: category,
          skill_title: skill,
          min_volunteers_needed: minVolunteers,
          min_proficiency: minProficiency,
          urgency: urgency
        };
        const created = await api.post(`/api/emergencies/${numericId}/requirements`, payload);
        if (created) {
          const normalizedReq = normalizeRequirement(created);
          // Sync with local emergency representation
          const list = this._loadAll();
          const emgIdx = list.findIndex((e) => String(e.id) === String(emergencyId) || e.numericId === numericId);
          if (emgIdx !== -1) {
            const currentReqs = list[emgIdx].requirements || [];
            list[emgIdx] = {
              ...list[emgIdx],
              requirements: [...currentReqs, normalizedReq],
              updatedTime: new Date().toISOString()
            };
            this._saveAll(list);
          }
          return normalizedReq;
        }
      } catch (err) {
        console.warn(`[emergencyService] POST /api/emergencies/${numericId}/requirements failed:`, err.message);
      }
    }

    // Storage fallback
    const list = this._loadAll();
    const index = list.findIndex((e) => String(e.id) === String(emergencyId) || (numericId !== null && e.numericId === numericId));
    if (index === -1) {
      throw new Error(`Emergency with ID "${emergencyId}" was not found.`);
    }

    const newRequirement = {
      id: `req-${Date.now()}`,
      emergencyId: String(emergencyId),
      skill,
      category,
      minProficiency,
      minVolunteers,
      urgency,
      fulfillmentStatus: `0 / ${minVolunteers} Allocated (Dev Placeholder)`
    };

    const currentReqs = list[index].requirements || [];
    list[index] = {
      ...list[index],
      requirements: [...currentReqs, newRequirement],
      updatedTime: new Date().toISOString()
    };
    this._saveAll(list);
    return newRequirement;
  },

  /**
   * Update an existing requirement
   * @param {string|number} emergencyId
   * @param {string|number} requirementId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async updateRequirement(emergencyId, requirementId, data) {
    const numEmgId = parseEmergencyId(emergencyId);
    const numReqId = parseInt(String(requirementId).replace('req-', ''), 10);

    const skill = data.skill !== undefined ? data.skill.trim() : undefined;
    const category = data.category;
    const minProficiency = data.minProficiency ? capProficiency(data.minProficiency) : undefined;
    if (minProficiency && !PROFICIENCY_LEVELS.includes(minProficiency)) {
      throw new Error(`Minimum proficiency must be one of: ${PROFICIENCY_LEVELS.join(', ')}`);
    }
    const minVolunteers = data.minVolunteers !== undefined ? Number(data.minVolunteers) : undefined;
    const urgency = data.urgency ? data.urgency.toLowerCase() : undefined;

    if (numEmgId !== null && !isNaN(numReqId)) {
      try {
        const payload = {};
        if (skill !== undefined) payload.skill_title = skill;
        if (category !== undefined) payload.skill_category = category;
        if (minProficiency !== undefined) payload.min_proficiency = minProficiency;
        if (minVolunteers !== undefined) payload.min_volunteers_needed = minVolunteers;
        if (urgency !== undefined) payload.urgency = urgency;

        const updated = await api.patch(`/api/emergencies/${numEmgId}/requirements/${numReqId}`, payload);
        if (updated) {
          return normalizeRequirement(updated);
        }
      } catch (err) {
        console.warn(`[emergencyService] PATCH requirement failed:`, err.message);
      }
    }

    // Storage fallback
    const list = this._loadAll();
    const emergencyIndex = list.findIndex((e) => String(e.id) === String(emergencyId) || (numEmgId !== null && e.numericId === numEmgId));
    if (emergencyIndex === -1) {
      throw new Error(`Emergency with ID "${emergencyId}" was not found.`);
    }

    const currentReqs = list[emergencyIndex].requirements || [];
    const reqIndex = currentReqs.findIndex((r) => String(r.id) === String(requirementId));
    if (reqIndex === -1) {
      throw new Error(`Requirement with ID "${requirementId}" was not found.`);
    }

    const currentReq = currentReqs[reqIndex];
    const updatedRequirement = {
      ...currentReq,
      skill: skill !== undefined ? skill : currentReq.skill,
      category: category || currentReq.category,
      minProficiency: minProficiency || currentReq.minProficiency,
      minVolunteers: minVolunteers !== undefined ? minVolunteers : currentReq.minVolunteers,
      urgency: urgency || currentReq.urgency,
      fulfillmentStatus: `0 / ${minVolunteers !== undefined ? minVolunteers : currentReq.minVolunteers} Allocated (Dev Placeholder)`
    };

    currentReqs[reqIndex] = updatedRequirement;
    list[emergencyIndex] = {
      ...list[emergencyIndex],
      requirements: currentReqs,
      updatedTime: new Date().toISOString()
    };
    this._saveAll(list);
    return updatedRequirement;
  },

  /**
   * Delete a requirement from an emergency
   * @param {string|number} emergencyId
   * @param {string|number} requirementId
   * @returns {Promise<{ success: boolean, id: string }>}
   */
  async deleteRequirement(emergencyId, requirementId) {
    const numEmgId = parseEmergencyId(emergencyId);
    const numReqId = parseInt(String(requirementId).replace('req-', ''), 10);

    if (numEmgId !== null && !isNaN(numReqId)) {
      try {
        await api.delete(`/api/emergencies/${numEmgId}/requirements/${numReqId}`);
      } catch (err) {
        console.warn(`[emergencyService] DELETE requirement failed:`, err.message);
      }
    }

    const list = this._loadAll();
    const emergencyIndex = list.findIndex((e) => String(e.id) === String(emergencyId) || (numEmgId !== null && e.numericId === numEmgId));
    if (emergencyIndex !== -1) {
      const currentReqs = list[emergencyIndex].requirements || [];
      const filtered = currentReqs.filter((r) => String(r.id) !== String(requirementId));
      list[emergencyIndex] = {
        ...list[emergencyIndex],
        requirements: filtered,
        updatedTime: new Date().toISOString()
      };
      this._saveAll(list);
    }

    return { success: true, id: String(requirementId) };
  },

  // =========================================================================
  // METADATA HELPERS
  // =========================================================================

  getStatuses() {
    return [...EMERGENCY_STATUSES];
  },

  getSeverities() {
    return [...EMERGENCY_SEVERITIES];
  },

  getUrgencies() {
    return [...REQUIREMENT_URGENCIES];
  }
};

export default emergencyService;
