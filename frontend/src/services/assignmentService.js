/**
 * Assignment & Response Service (Stage 7 & Stage 17 Integration)
 * 
 * Provides centralized lifecycle state management for emergency assignments,
 * responses, field check-ins, and completion reporting using FastAPI backend
 * endpoints with local state fallback for offline support.
 */

import { api } from './api.js';
import {
  INITIAL_DEV_ASSIGNMENTS,
  ASSIGNMENT_STATUSES
} from '../data/devAssignments.js';
import { realtimeService } from './realtimeService.js';
import { connectivityService } from './connectivityService.js';
import { offlineSyncService } from './offlineSyncService.js';

const STORAGE_KEY = 'csb_dev_assignments';

/**
 * Safely parse numeric identifier
 */
export const parseId = (id) => {
  if (typeof id === 'number') return id;
  if (!id) return null;
  const str = String(id).trim();
  if (str.startsWith('asg-') || str.startsWith('emg-') || str.startsWith('vol-')) {
    const candidate = parseInt(str.replace(/^[a-z]+-/, ''), 10);
    if (!isNaN(candidate)) return candidate;
  }
  const direct = parseInt(str, 10);
  return !isNaN(direct) ? direct : null;
};

/**
 * Helper to safely read assignments from localStorage with initial fallback
 */
const getStoredAssignments = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_ASSIGNMENTS));
      return JSON.parse(JSON.stringify(INITIAL_DEV_ASSIGNMENTS));
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[assignmentService] Error parsing localStorage assignments, resetting to default:', err);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_ASSIGNMENTS));
    return JSON.parse(JSON.stringify(INITIAL_DEV_ASSIGNMENTS));
  }
};

const setStoredAssignments = (assignments) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  } catch (err) {
    console.error('[assignmentService] Error persisting to localStorage:', err);
  }
};

/**
 * Normalize backend AssignmentOut to frontend presentation format
 */
export const normalizeAssignment = (a) => {
  if (!a) return null;
  const numId = Number(a.id);
  const numEmgId = Number(a.emergency_id || a.emergencyId);
  const numVolId = Number(a.volunteer_id || a.volunteerId);

  return {
    id: String(a.id),
    numericId: !isNaN(numId) ? numId : null,
    emergencyId: String(a.emergency_id || a.emergencyId || ''),
    numericEmergencyId: !isNaN(numEmgId) ? numEmgId : null,
    emergencyTitle: a.emergency_title || a.emergencyTitle || 'Emergency Incident Dispatch',
    emergencyLocation: a.emergencyLocation || 'Incident Staging Area',
    emergencySeverity: a.emergencySeverity || 'high',
    volunteerId: String(a.volunteer_id || a.volunteerId || ''),
    numericVolunteerId: !isNaN(numVolId) ? numVolId : null,
    volunteerName: a.volunteer_name || a.volunteerName || 'Volunteer Responder',
    volunteerEmail: a.volunteer_email || a.volunteerEmail || '',
    volunteerPhone: a.volunteer_phone || a.volunteerPhone || '',
    volunteerRole: a.volunteer_role || a.volunteerRole || 'volunteer',
    requirementId: a.requirement_id || a.requirementId || null,
    skill: a.requirement_title || a.skill || a.requirement_category || 'Emergency Specialist',
    category: a.requirement_category || a.category || 'Disaster Response',
    proficiency: a.proficiency || 'Intermediate',
    status: (a.status || 'assigned').toLowerCase(),
    priority: a.priority || 'High Priority',
    stagingArea: a.admin_notes || a.stagingArea || 'Incident Command Staging Post',
    instructions: a.admin_notes || a.instructions || 'Report to incident command staging area.',
    assignedBy: a.assigned_by_id ? `Authority (#${a.assigned_by_id})` : (a.assignedBy || 'Incident Command'),
    matchScore: a.match_score_at_assignment ? `${Math.round(a.match_score_at_assignment)}%` : (a.matchScore || '85%'),
    createdTime: a.created_at || a.createdTime || new Date().toISOString(),
    updatedTime: a.updated_at || a.updatedTime || a.created_at || new Date().toISOString(),
    respondedAt: a.responded_at || a.responseInfo?.respondedAt || null,
    deployedAt: a.deployed_at || a.inProgressInfo?.startedAt || null,
    completedAt: a.completed_at || a.completionInfo?.completedAt || null,
    cancelledAt: a.cancelled_at || null,
    responseInfo: a.responseInfo || (a.responded_at ? {
      respondedAt: a.responded_at,
      response: a.status === 'accepted' ? 'accepted' : 'declined',
      notes: a.volunteer_notes || ''
    } : null),
    inProgressInfo: a.inProgressInfo || (a.deployed_at ? {
      startedAt: a.deployed_at,
      notes: a.volunteer_notes || ''
    } : null),
    completionInfo: a.completionInfo || (a.completed_at ? {
      completedAt: a.completed_at,
      completionNotes: a.volunteer_notes || ''
    } : null),
    rawBackend: a
  };
};

export const assignmentService = {
  /**
   * Retrieve all assignments with optional query/filters
   * @param {Object} filters - { status, emergencyId, volunteerId, search }
   * @returns {Promise<Array>}
   */
  async getAssignments(filters = {}) {
    // 1. If emergencyId is specified, fetch live emergency assignments
    const numEmgId = parseId(filters.emergencyId);
    if (numEmgId !== null) {
      try {
        const overview = await api.get(`/api/emergencies/${numEmgId}/assignments`);
        if (overview && Array.isArray(overview.assignments)) {
          let list = overview.assignments.map(normalizeAssignment);
          if (filters.status && filters.status !== 'ALL') {
            list = list.filter((a) => a.status === filters.status.toLowerCase());
          }
          return list;
        }
      } catch (err) {
        console.warn(`[assignmentService] GET /api/emergencies/${numEmgId}/assignments failed:`, err.message);
      }
    } else {
      // 1b. Attempt to gather live assignments across active emergencies
      try {
        const emergencies = await api.get('/api/emergencies');
        if (Array.isArray(emergencies) && emergencies.length > 0) {
          const promises = emergencies.map((emg) =>
            api.get(`/api/emergencies/${emg.id}/assignments`).catch(() => null)
          );
          const results = await Promise.all(promises);
          const liveAssignments = [];
          for (const res of results) {
            if (res && Array.isArray(res.assignments)) {
              liveAssignments.push(...res.assignments.map(normalizeAssignment));
            }
          }
          if (liveAssignments.length > 0) {
            let list = liveAssignments;
            if (filters.status && filters.status !== 'ALL') {
              list = list.filter((a) => a.status === filters.status.toLowerCase());
            }
            if (filters.volunteerId && filters.volunteerId !== 'ALL') {
              list = list.filter(
                (a) => a.volunteerId === String(filters.volunteerId) || a.volunteerEmail === filters.volunteerId
              );
            }
            if (filters.search && filters.search.trim() !== '') {
              const q = filters.search.toLowerCase().trim();
              list = list.filter(
                (a) =>
                  a.emergencyTitle?.toLowerCase().includes(q) ||
                  a.volunteerName?.toLowerCase().includes(q) ||
                  a.skill?.toLowerCase().includes(q) ||
                  a.stagingArea?.toLowerCase().includes(q) ||
                  a.instructions?.toLowerCase().includes(q)
              );
            }
            list.sort((a, b) => new Date(b.updatedTime || b.createdTime) - new Date(a.updatedTime || a.createdTime));
            return list;
          }
        }
      } catch (err) {
        // Fallback to local storage when unauthenticated or offline
      }
    }

    // 2. Fallback to local storage
    let list = getStoredAssignments().map(normalizeAssignment);

    if (filters.status && filters.status !== 'ALL') {
      list = list.filter((a) => a.status === filters.status.toLowerCase());
    }

    if (filters.emergencyId && filters.emergencyId !== 'ALL') {
      list = list.filter((a) => a.emergencyId === String(filters.emergencyId));
    }

    if (filters.volunteerId && filters.volunteerId !== 'ALL') {
      list = list.filter(
        (a) => a.volunteerId === String(filters.volunteerId) || a.volunteerEmail === filters.volunteerId
      );
    }

    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.emergencyTitle?.toLowerCase().includes(q) ||
          a.volunteerName?.toLowerCase().includes(q) ||
          a.skill?.toLowerCase().includes(q) ||
          a.stagingArea?.toLowerCase().includes(q) ||
          a.instructions?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => new Date(b.updatedTime || b.createdTime) - new Date(a.updatedTime || a.createdTime));
    return list;
  },

  /**
   * Retrieve single assignment by ID
   * @param {string|number} id
   * @returns {Promise<Object|null>}
   */
  async getAssignmentById(id) {
    const list = getStoredAssignments();
    const found = list.find((a) => String(a.id) === String(id) || String(a.numericId) === String(id));
    return found ? normalizeAssignment(found) : null;
  },

  /**
   * Retrieve assignments assigned to a specific volunteer
   * Reads live from /api/assignments/mine when online
   * @param {string|number} volunteerIdOrEmail
   * @returns {Promise<Array>}
   */
  async getAssignmentsForVolunteer(volunteerIdOrEmail) {
    try {
      const data = await api.get('/api/assignments/mine');
      if (Array.isArray(data)) {
        const normalized = data.map(normalizeAssignment);
        // Sync local storage with live assignments
        const list = getStoredAssignments();
        const nonMine = list.filter((a) => !normalized.some((n) => n.id === String(a.id)));
        setStoredAssignments([...normalized, ...nonMine]);
        return normalized;
      }
    } catch (err) {
      console.warn('[assignmentService] GET /api/assignments/mine failed, using fallback:', err.message);
    }

    // Local storage fallback
    const list = getStoredAssignments().map(normalizeAssignment);
    const filtered = list.filter(
      (a) =>
        a.volunteerId === String(volunteerIdOrEmail) ||
        a.volunteerEmail === volunteerIdOrEmail ||
        (volunteerIdOrEmail === 'dev-skl-002' && (a.volunteerName === 'Alex Rivera' || a.volunteerId === 'dev-skl-002'))
    );
    return filtered;
  },

  /**
   * Alias for getAssignmentsForVolunteer()
   */
  async getMyAssignments() {
    return this.getAssignmentsForVolunteer();
  },

  /**
   * Retrieve assignments associated with an emergency incident
   * @param {string|number} emergencyId
   * @returns {Promise<Array>}
   */
  async getEmergencyAssignments(emergencyId) {
    return this.getAssignmentsForEmergency(emergencyId);
  },

  async getAssignmentsForEmergency(emergencyId) {
    const numEmgId = parseId(emergencyId);
    if (numEmgId !== null) {
      try {
        const overview = await api.get(`/api/emergencies/${numEmgId}/assignments`);
        if (overview && Array.isArray(overview.assignments)) {
          return overview.assignments.map(normalizeAssignment);
        }
      } catch (err) {
        console.warn(`[assignmentService] GET /api/emergencies/${numEmgId}/assignments failed:`, err.message);
      }
    }

    const list = getStoredAssignments().map(normalizeAssignment);
    return list.filter((a) => String(a.emergencyId) === String(emergencyId));
  },

  /**
   * Admin creates a new volunteer assignment (Direct Dispatch)
   * Initial status is strictly 'assigned'
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async createAssignment(data) {
    if (!data.emergencyId) throw new Error('Emergency Incident ID is required for assignment.');
    if (!data.volunteerId && !data.volunteerName) throw new Error('Volunteer recipient is required for assignment.');
    if (!data.skill) throw new Error('Designated skill/role is required for assignment.');

    const numEmgId = parseId(data.emergencyId);
    const numVolId = parseId(data.volunteerId) || 1;
    const numReqId = parseId(data.requirementId);

    if (numEmgId !== null) {
      try {
        const payload = {
          volunteer_id: numVolId,
          requirement_id: numReqId,
          initial_status: data.initialStatus || 'assigned',
          admin_notes: data.instructions || data.stagingArea || data.adminNotes || 'Incident deployment',
          match_score_at_assignment: data.matchScore ? parseFloat(String(data.matchScore).replace('%', '')) : null
        };
        const created = await api.post(`/api/emergencies/${numEmgId}/assignments`, payload);
        if (created) {
          const normalized = normalizeAssignment(created);
          // Persist to local storage
          const list = getStoredAssignments();
          setStoredAssignments([normalized, ...list]);
          return normalized;
        }
      } catch (err) {
        console.warn(`[assignmentService] POST /api/emergencies/${numEmgId}/assignments failed:`, err.message);
      }
    }

    // Local storage fallback
    const list = getStoredAssignments();
    const now = new Date().toISOString();

    const newAssignment = {
      id: `asg-${Date.now().toString().slice(-6)}`,
      emergencyId: String(data.emergencyId),
      emergencyTitle: data.emergencyTitle || 'Emergency Incident Dispatch',
      emergencyLocation: data.emergencyLocation || 'Incident Staging Sector',
      emergencySeverity: data.emergencySeverity || 'high',
      volunteerId: String(data.volunteerId || `vol-${Date.now().toString().slice(-4)}`),
      volunteerName: data.volunteerName || 'Designated Volunteer Responder',
      volunteerEmail: data.volunteerEmail || 'volunteer@skillbank.org',
      volunteerPhone: data.volunteerPhone || '+1 (555) 000-0000',
      skill: data.skill,
      proficiency: data.proficiency || 'Intermediate',
      category: data.category || 'Disaster Response',
      status: 'assigned',
      priority: data.priority || 'High Priority',
      stagingArea: data.stagingArea || 'Designated Sector Command Post',
      instructions: data.instructions || 'Report to incident staging area. Check in with operations coordinator upon arrival.',
      assignedBy: data.assignedBy || 'Incident Command Administration',
      createdTime: now,
      updatedTime: now,
      responseInfo: null,
      inProgressInfo: null,
      completionInfo: null
    };

    list.unshift(newAssignment);
    setStoredAssignments(list);
    return newAssignment;
  },

  /**
   * Direct assignment alias
   */
  async createDirectAssignment(emergencyId, payload) {
    return this.createAssignment({ ...payload, emergencyId });
  },

  /**
   * Volunteer responds to an assignment ('accepted' or 'declined')
   * Validates progression from 'assigned' -> 'accepted' / 'declined'
   * @param {string|number} id
   * @param {Object} responseData - { response: 'accepted' | 'declined', notes }
   * @returns {Promise<Object>}
   */
  async respondToAssignment(id, { response, notes = '' }) {
    if (!['accepted', 'declined'].includes(response)) {
      throw new Error(`Invalid response "${response}". Must be 'accepted' or 'declined'.`);
    }

    const list = getStoredAssignments();
    const index = list.findIndex((a) => String(a.id) === String(id) || String(a.numericId) === String(id));
    if (index === -1) throw new Error(`Assignment with ID "${id}" not found.`);

    const assignment = list[index];
    const backendStatus = response === 'accepted' ? 'accepted' : 'rejected';
    const numEmgId = parseId(assignment.emergencyId);

    if (numEmgId !== null) {
      try {
        const updated = await api.post(`/api/emergencies/${numEmgId}/respond`, {
          status: backendStatus,
          volunteer_notes: notes.trim()
        });
        if (updated) {
          const normalized = normalizeAssignment(updated);
          list[index] = normalized;
          setStoredAssignments(list);
          return normalized;
        }
      } catch (err) {
        console.warn(`[assignmentService] POST /api/emergencies/${numEmgId}/respond failed:`, err.message);
      }
    }

    // Local storage fallback
    if (assignment.status !== 'assigned') {
      throw new Error(`Cannot respond to assignment in status "${assignment.status}". Must be 'assigned'.`);
    }

    const now = new Date().toISOString();
    assignment.status = response;
    assignment.updatedTime = now;
    assignment.responseInfo = {
      respondedAt: now,
      response,
      notes: notes.trim()
    };

    list[index] = assignment;
    setStoredAssignments(list);
    return normalizeAssignment(assignment);
  },

  /**
   * Volunteer self-application or response by emergency ID
   */
  async respondToEmergency(emergencyId, { status = 'pending', notes = '' } = {}) {
    const numEmgId = parseId(emergencyId);
    if (numEmgId !== null) {
      const resp = await api.post(`/api/emergencies/${numEmgId}/respond`, {
        status,
        volunteer_notes: notes.trim()
      });
      return normalizeAssignment(resp);
    }
    throw new Error('Invalid emergency ID');
  },

  /**
   * Volunteer marks deployment as 'in_progress'
   * Validates progression from 'accepted' / 'assigned' -> 'in_progress'
   * @param {string|number} id
   * @param {Object} progressData - { notes }
   * @returns {Promise<Object>}
   */
  async startAssignment(id, { notes = '' } = {}) {
    const numAssignmentId = parseId(id);
    if (numAssignmentId !== null) {
      try {
        const updated = await api.patch(`/api/assignments/${numAssignmentId}/progress`, {
          target_status: 'in_progress',
          volunteer_notes: notes.trim()
        });
        if (updated) {
          const normalized = normalizeAssignment(updated);
          const list = getStoredAssignments();
          const idx = list.findIndex((a) => String(a.id) === String(id) || a.numericId === numAssignmentId);
          if (idx !== -1) {
            list[idx] = normalized;
            setStoredAssignments(list);
          }
          return normalized;
        }
      } catch (err) {
        console.warn(`[assignmentService] PATCH /api/assignments/${numAssignmentId}/progress failed:`, err.message);
      }
    }

    // Local storage fallback
    const list = getStoredAssignments();
    const index = list.findIndex((a) => String(a.id) === String(id) || String(a.numericId) === String(id));
    if (index === -1) throw new Error(`Assignment with ID "${id}" not found.`);

    const assignment = list[index];
    if (assignment.status !== 'accepted' && assignment.status !== 'assigned') {
      throw new Error(`Cannot start assignment in status "${assignment.status}". Must be 'accepted' first.`);
    }

    const now = new Date().toISOString();
    assignment.status = 'in_progress';
    assignment.updatedTime = now;
    assignment.inProgressInfo = {
      startedAt: now,
      notes: notes.trim()
    };

    list[index] = assignment;
    setStoredAssignments(list);
    return normalizeAssignment(assignment);
  },

  /**
   * Volunteer marks deployment as 'completed'
   * Validates progression from 'in_progress' -> 'completed'
   * @param {string|number} id
   * @param {Object} completionData - { completionNotes }
   * @returns {Promise<Object>}
   */
  async completeAssignment(id, { completionNotes = '' } = {}) {
    const numAssignmentId = parseId(id);
    if (numAssignmentId !== null) {
      try {
        const updated = await api.patch(`/api/assignments/${numAssignmentId}/progress`, {
          target_status: 'completed',
          volunteer_notes: completionNotes.trim()
        });
        if (updated) {
          const normalized = normalizeAssignment(updated);
          const list = getStoredAssignments();
          const idx = list.findIndex((a) => String(a.id) === String(id) || a.numericId === numAssignmentId);
          if (idx !== -1) {
            list[idx] = normalized;
            setStoredAssignments(list);
          }
          return normalized;
        }
      } catch (err) {
        console.warn(`[assignmentService] PATCH /api/assignments/${numAssignmentId}/progress (completed) failed:`, err.message);
      }
    }

    // Local storage fallback
    const list = getStoredAssignments();
    const index = list.findIndex((a) => String(a.id) === String(id) || String(a.numericId) === String(id));
    if (index === -1) throw new Error(`Assignment with ID "${id}" not found.`);

    const assignment = list[index];
    if (assignment.status !== 'in_progress') {
      throw new Error(`Cannot complete assignment in status "${assignment.status}". Must be 'in_progress'.`);
    }

    const now = new Date().toISOString();
    assignment.status = 'completed';
    assignment.updatedTime = now;
    assignment.completionInfo = {
      completedAt: now,
      completionNotes: completionNotes.trim()
    };

    list[index] = assignment;
    setStoredAssignments(list);
    return normalizeAssignment(assignment);
  },

  /**
   * Update assignment progress
   */
  async updateAssignmentProgress(assignmentId, payload) {
    const target = typeof payload === 'string' ? payload : (payload?.target_status || payload?.targetStatus || payload?.status);
    const notes = typeof payload === 'object' ? (payload?.volunteer_notes || payload?.notes || payload?.completionNotes || '') : '';
    if (target === 'in_progress') {
      return this.startAssignment(assignmentId, { notes });
    }
    if (target === 'completed') {
      return this.completeAssignment(assignmentId, { completionNotes: notes });
    }
    throw new Error(`Unsupported targetStatus "${target}". Use 'in_progress' or 'completed'.`);
  },

  /**
   * Admin status update with status validation
   * @param {string|number} id
   * @param {string} newStatus
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  async updateAssignmentStatus(id, newStatus, updateData = {}) {
    if (!ASSIGNMENT_STATUSES.includes(newStatus)) {
      throw new Error(`Invalid status "${newStatus}". Must be one of: ${ASSIGNMENT_STATUSES.join(', ')}`);
    }

    const list = getStoredAssignments();
    const index = list.findIndex((a) => String(a.id) === String(id) || String(a.numericId) === String(id));
    if (index === -1) throw new Error(`Assignment with ID "${id}" not found.`);

    const now = new Date().toISOString();
    list[index] = {
      ...list[index],
      ...updateData,
      status: newStatus,
      updatedTime: now
    };

    setStoredAssignments(list);
    return normalizeAssignment(list[index]);
  },

  /**
   * Admin cancels or stands down assignment
   * @param {string|number} id
   * @param {string|number} [emergencyId]
   * @returns {Promise<boolean>}
   */
  async deleteAssignment(id, emergencyId = null) {
    const list = getStoredAssignments();
    const found = list.find((a) => String(a.id) === String(id) || String(a.numericId) === String(id));
    const emgId = emergencyId || found?.emergencyId;
    const numEmgId = parseId(emgId);
    const numAsgId = parseId(id);

    if (numEmgId !== null && numAsgId !== null) {
      try {
        await api.post(`/api/emergencies/${numEmgId}/assignments/${numAsgId}/cancel`);
      } catch (err) {
        console.warn(`[assignmentService] POST cancel assignment failed:`, err.message);
      }
    }

    const filtered = list.filter((a) => String(a.id) !== String(id) && (numAsgId === null || a.numericId !== numAsgId));
    if (filtered.length === list.length) {
      throw new Error(`Assignment with ID "${id}" not found.`);
    }

    setStoredAssignments(filtered);
    return true;
  },

  /**
   * Alias for cancel assignment
   */
  async cancelAssignment(emergencyId, assignmentId) {
    return this.deleteAssignment(assignmentId, emergencyId);
  },

  /**
   * Reset store to initial seed values
   */
  resetDevelopmentAssignments() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_ASSIGNMENTS));
    return JSON.parse(JSON.stringify(INITIAL_DEV_ASSIGNMENTS)).map(normalizeAssignment);
  }
};

export default assignmentService;
