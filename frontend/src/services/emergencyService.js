/**
 * Emergency Management Service (Stage 5)
 * 
 * Provides incident operations, emergency declarations, status transitions,
 * and personnel requirement quotas using isolated frontend development state.
 * 
 * In Stage 17: Will call api.get('/emergencies'), api.post('/emergencies'), etc.
 * DO NOT connect backend APIs or PostgreSQL at this stage.
 */

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

export const emergencyService = {
  /**
   * Helper to load emergencies from localStorage or default seed
   * @private
   */
  _loadAll() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        return JSON.parse(stored);
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
    return JSON.parse(JSON.stringify(INITIAL_DEV_EMERGENCIES));
  },

  /**
   * Helper to save emergencies to localStorage
   * @private
   */
  _saveAll(emergencies) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(emergencies));
    } catch (err) {
      console.warn('[emergencyService] Failed to save emergencies to storage:', err);
    }
  },

  /**
   * Get all emergencies with optional filters
   * @param {Object} filters - { search, status, severity }
   * @returns {Promise<Array>}
   */
  async getEmergencies(filters = {}) {
    const list = this._loadAll();
    const { search = '', status = 'ALL', severity = 'ALL' } = filters;

    return list.filter((item) => {
      // Status filter
      if (status && status !== 'ALL' && item.status !== status) {
        return false;
      }

      // Severity filter
      if (severity && severity !== 'ALL' && item.severity !== severity) {
        return false;
      }

      // Search keyword filter
      if (search && search.trim() !== '') {
        const query = search.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesLocation = item.location.toLowerCase().includes(query);
        const matchesDescription = item.description.toLowerCase().includes(query);
        const matchesSkill = item.requirements?.some((r) =>
          r.skill.toLowerCase().includes(query) || r.category.toLowerCase().includes(query)
        );

        if (!matchesTitle && !matchesLocation && !matchesDescription && !matchesSkill) {
          return false;
        }
      }

      return true;
    });
  },

  /**
   * Get a single emergency by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getEmergencyById(id) {
    const list = this._loadAll();
    const found = list.find((e) => e.id === id);
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
    const severity = data.severity;
    const status = data.status || 'open';
    const requiredVolunteers = Number(data.requiredVolunteers);

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
   * Server-generated fields (id, createdTime) are protected.
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async updateEmergency(id, data) {
    const list = this._loadAll();
    const index = list.findIndex((e) => e.id === id);

    if (index === -1) {
      throw new Error(`Emergency with ID "${id}" was not found.`);
    }

    const current = list[index];

    const title = data.title !== undefined ? data.title.trim() : current.title;
    const description = data.description !== undefined ? data.description.trim() : current.description;
    const location = data.location !== undefined ? data.location.trim() : current.location;
    const severity = data.severity !== undefined ? data.severity : current.severity;
    const status = data.status !== undefined ? data.status : current.status;
    const requiredVolunteers = data.requiredVolunteers !== undefined ? Number(data.requiredVolunteers) : current.requiredVolunteers;

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

    let lat = current.latitude;
    let lng = current.longitude;
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

    const updated = {
      ...current,
      title,
      description,
      location,
      latitude: lat,
      longitude: lng,
      severity,
      status,
      requiredVolunteers,
      // Protected server-controlled fields
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
   * @param {string} id
   * @param {string} newStatus
   * @returns {Promise<Object>}
   */
  async updateEmergencyStatus(id, newStatus) {
    if (!EMERGENCY_STATUSES.includes(newStatus)) {
      throw new Error(`Status must be one of: ${EMERGENCY_STATUSES.join(', ')}`);
    }

    const list = this._loadAll();
    const index = list.findIndex((e) => e.id === id);

    if (index === -1) {
      throw new Error(`Emergency with ID "${id}" was not found.`);
    }

    list[index] = {
      ...list[index],
      status: newStatus,
      updatedTime: new Date().toISOString()
    };

    this._saveAll(list);

    // Stage 10 Real-time event integration
    try {
      realtimeService.dispatchRealtimeEvent({
        type: 'emergency',
        priority: newStatus === 'in_progress' ? 'high' : 'normal',
        title: `Emergency Status: ${newStatus.toUpperCase()}`,
        message: `Incident "${list[index].title}" transitioned to ${newStatus}.`,
        targetRole: 'all',
        entityType: 'emergency',
        entityId: id,
        link: `/volunteer/emergencies/${id}`
      }).catch(() => {});
    } catch (_) {}

    // Stage 11 Offline Sync queueing
    if (!connectivityService.isOnline()) {
      offlineSyncService.enqueueMutation({
        entityType: 'emergency',
        entityId: id,
        operation: 'UPDATE',
        description: `Updated status for "${list[index].title}" to ${newStatus}`,
        payload: { status: newStatus },
        role: 'admin'
      }).catch(() => {});
    }

    return list[index];
  },

  /**
   * Delete an emergency declaration
   * @param {string} id
   * @returns {Promise<{ success: boolean, id: string }>}
   */
  async deleteEmergency(id) {
    const list = this._loadAll();
    const filtered = list.filter((e) => e.id !== id);

    if (filtered.length === list.length) {
      throw new Error(`Emergency with ID "${id}" was not found.`);
    }

    this._saveAll(filtered);
    return { success: true, id };
  },

  // =========================================================================
  // EMERGENCY REQUIREMENTS
  // =========================================================================

  /**
   * Get all requirements for an emergency
   * @param {string} emergencyId
   * @returns {Promise<Array>}
   */
  async getEmergencyRequirements(emergencyId) {
    const emergency = await this.getEmergencyById(emergencyId);
    if (!emergency) {
      throw new Error(`Emergency with ID "${emergencyId}" was not found.`);
    }
    return emergency.requirements || [];
  },

  /**
   * Add a requirement to an emergency
   * @param {string} emergencyId
   * @param {Object} data - { skill, category, minProficiency, minVolunteers, urgency }
   * @returns {Promise<Object>}
   */
  async createRequirement(emergencyId, data) {
    const skill = data.skill?.trim();
    const category = data.category;
    const minProficiency = data.minProficiency;
    const minVolunteers = Number(data.minVolunteers);
    const urgency = data.urgency || 'medium';

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

    const list = this._loadAll();
    const index = list.findIndex((e) => e.id === emergencyId);
    if (index === -1) {
      throw new Error(`Emergency with ID "${emergencyId}" was not found.`);
    }

    const newRequirement = {
      id: `req-${Date.now()}`,
      emergencyId,
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
   * @param {string} emergencyId
   * @param {string} requirementId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async updateRequirement(emergencyId, requirementId, data) {
    const list = this._loadAll();
    const emergencyIndex = list.findIndex((e) => e.id === emergencyId);
    if (emergencyIndex === -1) {
      throw new Error(`Emergency with ID "${emergencyId}" was not found.`);
    }

    const currentReqs = list[emergencyIndex].requirements || [];
    const reqIndex = currentReqs.findIndex((r) => r.id === requirementId);
    if (reqIndex === -1) {
      throw new Error(`Requirement with ID "${requirementId}" was not found.`);
    }

    const currentReq = currentReqs[reqIndex];
    const skill = data.skill !== undefined ? data.skill.trim() : currentReq.skill;
    const category = data.category || currentReq.category;
    const minProficiency = data.minProficiency || currentReq.minProficiency;
    const minVolunteers = data.minVolunteers !== undefined ? Number(data.minVolunteers) : currentReq.minVolunteers;
    const urgency = data.urgency || currentReq.urgency;

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

    const updatedRequirement = {
      ...currentReq,
      skill,
      category,
      minProficiency,
      minVolunteers,
      urgency,
      fulfillmentStatus: `0 / ${minVolunteers} Allocated (Dev Placeholder)`
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
   * @param {string} emergencyId
   * @param {string} requirementId
   * @returns {Promise<{ success: boolean, id: string }>}
   */
  async deleteRequirement(emergencyId, requirementId) {
    const list = this._loadAll();
    const emergencyIndex = list.findIndex((e) => e.id === emergencyId);
    if (emergencyIndex === -1) {
      throw new Error(`Emergency with ID "${emergencyId}" was not found.`);
    }

    const currentReqs = list[emergencyIndex].requirements || [];
    const filtered = currentReqs.filter((r) => r.id !== requirementId);

    if (filtered.length === currentReqs.length) {
      throw new Error(`Requirement with ID "${requirementId}" was not found.`);
    }

    list[emergencyIndex] = {
      ...list[emergencyIndex],
      requirements: filtered,
      updatedTime: new Date().toISOString()
    };

    this._saveAll(list);
    return { success: true, id: requirementId };
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
