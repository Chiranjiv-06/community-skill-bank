/**
 * Assignment & Response Service (Stage 7)
 * 
 * Provides isolated frontend state management for volunteer assignments,
 * response tracking, on-scene progress, and completion reporting.
 * 
 * In Stage 17 (Backend Integration):
 * This service boundary will map 1:1 to FastAPI backend endpoints:
 * - GET    /api/v1/assignments
 * - GET    /api/v1/assignments/:id
 * - POST   /api/v1/assignments
 * - POST   /api/v1/assignments/:id/respond
 * - POST   /api/v1/assignments/:id/start
 * - POST   /api/v1/assignments/:id/complete
 * - DELETE /api/v1/assignments/:id
 * 
 * DO NOT make real API calls or connect to backend in Stage 7.
 */

import {
  INITIAL_DEV_ASSIGNMENTS,
  ASSIGNMENT_STATUSES
} from '../data/devAssignments.js';
import { realtimeService } from './realtimeService.js';
import { connectivityService } from './connectivityService.js';
import { offlineSyncService } from './offlineSyncService.js';

const STORAGE_KEY = 'csb_dev_assignments';

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

/**
 * Helper to write assignments to localStorage
 */
const setStoredAssignments = (assignments) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  } catch (err) {
    console.error('[assignmentService] Error persisting to localStorage:', err);
  }
};

export const assignmentService = {
  /**
   * Retrieve all assignments with optional query/filters
   * @param {Object} filters - { status, emergencyId, volunteerId, search }
   * @returns {Promise<Array>}
   */
  async getAssignments(filters = {}) {
    let list = getStoredAssignments();

    if (filters.status && filters.status !== 'ALL') {
      list = list.filter((a) => a.status === filters.status);
    }

    if (filters.emergencyId && filters.emergencyId !== 'ALL') {
      list = list.filter((a) => a.emergencyId === filters.emergencyId);
    }

    if (filters.volunteerId && filters.volunteerId !== 'ALL') {
      list = list.filter(
        (a) => a.volunteerId === filters.volunteerId || a.volunteerEmail === filters.volunteerId
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

    // Sort most recently updated first
    list.sort((a, b) => new Date(b.updatedTime || b.createdTime) - new Date(a.updatedTime || a.createdTime));

    return JSON.parse(JSON.stringify(list));
  },

  /**
   * Retrieve single assignment by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getAssignmentById(id) {
    const list = getStoredAssignments();
    const found = list.find((a) => a.id === id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  },

  /**
   * Retrieve assignments assigned to a specific volunteer
   * @param {string} volunteerIdOrEmail
   * @returns {Promise<Array>}
   */
  async getAssignmentsForVolunteer(volunteerIdOrEmail) {
    const list = getStoredAssignments();
    const filtered = list.filter(
      (a) =>
        a.volunteerId === volunteerIdOrEmail ||
        a.volunteerEmail === volunteerIdOrEmail ||
        // Support logged-in dev volunteer 'Alex Rivera'
        (volunteerIdOrEmail === 'dev-skl-002' && (a.volunteerName === 'Alex Rivera' || a.volunteerId === 'dev-skl-002'))
    );
    return JSON.parse(JSON.stringify(filtered));
  },

  /**
   * Retrieve assignments associated with an emergency incident
   * @param {string} emergencyId
   * @returns {Promise<Array>}
   */
  async getAssignmentsForEmergency(emergencyId) {
    const list = getStoredAssignments();
    const filtered = list.filter((a) => a.emergencyId === emergencyId);
    return JSON.parse(JSON.stringify(filtered));
  },

  /**
   * Admin creates a new volunteer assignment
   * Initial status is strictly 'assigned'
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async createAssignment(data) {
    if (!data.emergencyId) throw new Error('Emergency Incident ID is required for assignment.');
    if (!data.volunteerId && !data.volunteerName) throw new Error('Volunteer recipient is required for assignment.');
    if (!data.skill) throw new Error('Designated skill/role is required for assignment.');

    const list = getStoredAssignments();
    const now = new Date().toISOString();

    const newAssignment = {
      id: `asg-${Date.now().toString().slice(-6)}`,
      emergencyId: data.emergencyId,
      emergencyTitle: data.emergencyTitle || 'Emergency Incident Dispatch',
      emergencyLocation: data.emergencyLocation || 'Incident Staging Sector',
      emergencySeverity: data.emergencySeverity || 'high',
      volunteerId: data.volunteerId || `vol-${Date.now().toString().slice(-4)}`,
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

    // Stage 10 Real-time event integration
    try {
      realtimeService.dispatchRealtimeEvent({
        type: 'assignment',
        priority: 'high',
        title: `Mission Dispatched: ${newAssignment.skill}`,
        message: `Assigned to ${newAssignment.emergencyTitle} at ${newAssignment.stagingArea}.`,
        targetRole: 'volunteer',
        volunteerId: newAssignment.volunteerId,
        entityType: 'assignment',
        entityId: newAssignment.id,
        link: '/volunteer/assignments'
      }).catch(() => {});
    } catch (_) {}

    return JSON.parse(JSON.stringify(newAssignment));
  },

  /**
   * Volunteer responds to an assignment ('accepted' or 'declined')
   * Validates progression from 'assigned' -> 'accepted' / 'declined'
   * @param {string} id
   * @param {Object} responseData - { response: 'accepted' | 'declined', notes }
   * @returns {Promise<Object>}
   */
  async respondToAssignment(id, { response, notes = '' }) {
    if (!['accepted', 'declined'].includes(response)) {
      throw new Error(`Invalid response "${response}". Must be 'accepted' or 'declined'.`);
    }

    const list = getStoredAssignments();
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) throw new Error(`Assignment with ID "${id}" not found.`);

    const assignment = list[index];
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

    // Stage 10 Real-time event integration
    try {
      realtimeService.dispatchRealtimeEvent({
        type: 'assignment',
        priority: response === 'accepted' ? 'normal' : 'high',
        title: `Volunteer Response: ${response.toUpperCase()}`,
        message: `Responder ${assignment.volunteerName} ${response} mission "${assignment.emergencyTitle}".`,
        targetRole: 'admin',
        entityType: 'assignment',
        entityId: id,
        link: '/admin/response-monitoring'
      }).catch(() => {});
    } catch (_) {}

    // Stage 11 Offline Sync queueing
    if (!connectivityService.isOnline()) {
      offlineSyncService.enqueueMutation({
        entityType: 'assignment',
        entityId: id,
        operation: 'RESPOND',
        description: `Volunteer response "${response}" for assignment ${id}`,
        payload: { response, notes },
        userId: assignment.volunteerId,
        role: 'volunteer'
      }).catch(() => {});
    }

    return JSON.parse(JSON.stringify(assignment));
  },

  /**
   * Volunteer marks deployment as 'in_progress'
   * Validates progression from 'accepted' -> 'in_progress'
   * @param {string} id
   * @param {Object} progressData - { notes }
   * @returns {Promise<Object>}
   */
  async startAssignment(id, { notes = '' } = {}) {
    const list = getStoredAssignments();
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) throw new Error(`Assignment with ID "${id}" not found.`);

    const assignment = list[index];
    if (assignment.status !== 'accepted') {
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
    return JSON.parse(JSON.stringify(assignment));
  },

  /**
   * Volunteer marks deployment as 'completed'
   * Validates progression from 'in_progress' -> 'completed'
   * @param {string} id
   * @param {Object} completionData - { completionNotes }
   * @returns {Promise<Object>}
   */
  async completeAssignment(id, { completionNotes = '' } = {}) {
    const list = getStoredAssignments();
    const index = list.findIndex((a) => a.id === id);
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
    return JSON.parse(JSON.stringify(assignment));
  },

  /**
   * Admin status update with status validation
   * @param {string} id
   * @param {string} newStatus
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  async updateAssignmentStatus(id, newStatus, updateData = {}) {
    if (!ASSIGNMENT_STATUSES.includes(newStatus)) {
      throw new Error(`Invalid status "${newStatus}". Must be one of: ${ASSIGNMENT_STATUSES.join(', ')}`);
    }

    const list = getStoredAssignments();
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) throw new Error(`Assignment with ID "${id}" not found.`);

    const now = new Date().toISOString();
    list[index] = {
      ...list[index],
      ...updateData,
      status: newStatus,
      updatedTime: now
    };

    setStoredAssignments(list);
    return JSON.parse(JSON.stringify(list[index]));
  },

  /**
   * Admin cancels or deletes assignment
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async deleteAssignment(id) {
    const list = getStoredAssignments();
    const filtered = list.filter((a) => a.id !== id);
    if (filtered.length === list.length) {
      throw new Error(`Assignment with ID "${id}" not found.`);
    }
    setStoredAssignments(filtered);
    return true;
  },

  /**
   * Reset store to initial seed values (for testing and dev resets)
   */
  resetDevelopmentAssignments() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_ASSIGNMENTS));
    return JSON.parse(JSON.stringify(INITIAL_DEV_ASSIGNMENTS));
  }
};

export default assignmentService;
