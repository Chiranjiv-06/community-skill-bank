/**
 * Community Activity Service (Stage 9)
 * 
 * Provides isolated frontend state management for disaster preparedness workshops,
 * community drills, volunteer mobilization drives, and participant registries.
 * 
 * Maps to future FastAPI endpoints in Stage 17:
 * - GET    /api/v1/activities
 * - GET    /api/v1/activities/:id
 * - POST   /api/v1/activities
 * - PUT    /api/v1/activities/:id
 * - PATCH  /api/v1/activities/:id/status
 * - POST   /api/v1/activities/:id/join
 * - POST   /api/v1/activities/:id/leave
 * - DELETE /api/v1/activities/:id
 * 
 * DO NOT make real API calls or connect to backend in Stage 9.
 */

import {
  INITIAL_DEV_ACTIVITIES,
  INITIAL_DEV_PARTICIPATIONS,
  ACTIVITY_STATUSES,
  ACTIVITY_CATEGORIES
} from '../data/devActivities.js';
import { realtimeService } from './realtimeService.js';
import { connectivityService } from './connectivityService.js';
import { offlineSyncService } from './offlineSyncService.js';

const ACTIVITIES_KEY = 'csb_dev_activities';
const PARTICIPATIONS_KEY = 'csb_dev_activity_participations';

const getStoredActivities = () => {
  try {
    const raw = localStorage.getItem(ACTIVITIES_KEY);
    if (!raw) {
      localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(INITIAL_DEV_ACTIVITIES));
      return JSON.parse(JSON.stringify(INITIAL_DEV_ACTIVITIES));
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[communityService] Error parsing localStorage activities, resetting:', err);
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(INITIAL_DEV_ACTIVITIES));
    return JSON.parse(JSON.stringify(INITIAL_DEV_ACTIVITIES));
  }
};

const setStoredActivities = (items) => {
  try {
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('[communityService] Error persisting activities:', err);
  }
};

const getStoredParticipations = () => {
  try {
    const raw = localStorage.getItem(PARTICIPATIONS_KEY);
    if (!raw) {
      localStorage.setItem(PARTICIPATIONS_KEY, JSON.stringify(INITIAL_DEV_PARTICIPATIONS));
      return JSON.parse(JSON.stringify(INITIAL_DEV_PARTICIPATIONS));
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[communityService] Error parsing localStorage participations, resetting:', err);
    localStorage.setItem(PARTICIPATIONS_KEY, JSON.stringify(INITIAL_DEV_PARTICIPATIONS));
    return JSON.parse(JSON.stringify(INITIAL_DEV_PARTICIPATIONS));
  }
};

const setStoredParticipations = (items) => {
  try {
    localStorage.setItem(PARTICIPATIONS_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('[communityService] Error persisting participations:', err);
  }
};

export const communityService = {
  /**
   * Retrieve community activities with optional filters
   * @param {Object} filters - { status, category, search }
   */
  async getActivities(filters = {}) {
    let list = getStoredActivities();

    if (filters.status && filters.status !== 'ALL') {
      list = list.filter((a) => a.status === filters.status);
    }

    if (filters.category && filters.category !== 'ALL') {
      list = list.filter((a) => a.category === filters.category);
    }

    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.location?.toLowerCase().includes(q) ||
          a.organizer?.toLowerCase().includes(q) ||
          a.category?.toLowerCase().includes(q)
      );
    }

    // Sort by date / updated time
    list.sort((a, b) => new Date(b.date || b.createdTime) - new Date(a.date || a.createdTime));
    return JSON.parse(JSON.stringify(list));
  },

  /**
   * Retrieve single activity by ID with enrolled participants
   */
  async getActivityById(id) {
    const list = getStoredActivities();
    const found = list.find((a) => a.id === id);
    if (!found) return null;

    const participations = getStoredParticipations();
    const enrolled = participations.filter((p) => p.activityId === id);

    return JSON.parse(
      JSON.stringify({
        ...found,
        participants: enrolled
      })
    );
  },

  /**
   * Retrieve activities joined by a specific volunteer
   */
  async getVolunteerActivities(volunteerIdOrEmail) {
    const activities = getStoredActivities();
    const participations = getStoredParticipations();

    const targetId =
      volunteerIdOrEmail === 'alex.rivera@skillbank.org' || volunteerIdOrEmail === 'dev-skl-002'
        ? 'dev-skl-002'
        : volunteerIdOrEmail;

    const myParticipations = participations.filter(
      (p) =>
        p.volunteerId === targetId ||
        p.volunteerEmail === targetId ||
        (targetId === 'dev-skl-002' && (p.volunteerName === 'Alex Rivera' || p.volunteerId === 'dev-skl-002'))
    );

    const enrolledActivityIds = myParticipations.map((p) => p.activityId);

    const joinedActivities = activities
      .filter((a) => enrolledActivityIds.includes(a.id))
      .map((a) => {
        const p = myParticipations.find((item) => item.activityId === a.id);
        return {
          ...a,
          participation: p
        };
      });

    return JSON.parse(JSON.stringify(joinedActivities));
  },

  /**
   * Check if volunteer is registered for an activity
   */
  async isVolunteerRegistered(activityId, volunteerIdOrEmail) {
    const participations = getStoredParticipations();
    const targetId =
      volunteerIdOrEmail === 'alex.rivera@skillbank.org' || volunteerIdOrEmail === 'dev-skl-002'
        ? 'dev-skl-002'
        : volunteerIdOrEmail;

    return participations.some(
      (p) =>
        p.activityId === activityId &&
        (p.volunteerId === targetId ||
          p.volunteerEmail === targetId ||
          (targetId === 'dev-skl-002' && (p.volunteerName === 'Alex Rivera' || p.volunteerId === 'dev-skl-002')))
    );
  },

  /**
   * Volunteer joins/RSVPs to a community activity
   */
  async joinActivity(activityId, volunteerData = {}) {
    const activities = getStoredActivities();
    const activityIndex = activities.findIndex((a) => a.id === activityId);
    if (activityIndex === -1) throw new Error(`Activity "${activityId}" not found.`);

    const activity = activities[activityIndex];
    if (activity.status === 'completed' || activity.status === 'cancelled') {
      throw new Error(`Cannot join an activity that is ${activity.status}.`);
    }

    const volId = volunteerData.id || volunteerData.volunteerId || 'dev-skl-002';
    const volName = volunteerData.name || volunteerData.volunteerName || 'Alex Rivera';
    const volEmail = volunteerData.email || volunteerData.volunteerEmail || 'alex.rivera@skillbank.org';

    const participations = getStoredParticipations();
    const existingIndex = participations.findIndex(
      (p) => p.activityId === activityId && (p.volunteerId === volId || p.volunteerEmail === volEmail)
    );

    if (existingIndex !== -1) {
      return { success: true, alreadyRegistered: true, participation: participations[existingIndex] };
    }

    const now = new Date().toISOString();
    const newParticipation = {
      id: `prt-${Date.now().toString().slice(-6)}`,
      activityId,
      volunteerId: volId,
      volunteerName: volName,
      volunteerEmail: volEmail,
      status: 'registered',
      registeredAt: now,
      notes: volunteerData.notes || 'Confirmed RSVP via Community Skill Bank portal.'
    };

    participations.unshift(newParticipation);
    setStoredParticipations(participations);

    // Update participant count
    activity.currentParticipantsCount = (activity.currentParticipantsCount || 0) + 1;
    activity.updatedTime = now;
    activities[activityIndex] = activity;
    setStoredActivities(activities);

    // Stage 10 Real-time event integration
    try {
      realtimeService.dispatchRealtimeEvent({
        type: 'community',
        priority: 'normal',
        title: 'Volunteer RSVP Confirmed',
        message: `${volName} registered for "${activity.title}".`,
        targetRole: 'admin',
        entityType: 'activity',
        entityId: activityId,
        link: '/admin/activities'
      }).catch(() => {});
    } catch (_) {}

    // Stage 11 Offline Sync queueing
    if (!connectivityService.isOnline()) {
      offlineSyncService.enqueueMutation({
        entityType: 'community',
        entityId: activityId,
        operation: 'RSVP',
        description: `Volunteer RSVP for "${activity.title}"`,
        payload: { participation: newParticipation },
        userId: targetId,
        role: 'volunteer'
      }).catch(() => {});
    }

    return JSON.parse(JSON.stringify({ success: true, participation: newParticipation }));
  },

  /**
   * Volunteer cancels RSVP / leaves community activity
   */
  async leaveActivity(activityId, volunteerIdOrEmail) {
    const targetId =
      volunteerIdOrEmail === 'alex.rivera@skillbank.org' || volunteerIdOrEmail === 'dev-skl-002'
        ? 'dev-skl-002'
        : volunteerIdOrEmail;

    const participations = getStoredParticipations();
    const initialLen = participations.length;
    const filtered = participations.filter(
      (p) =>
        !(
          p.activityId === activityId &&
          (p.volunteerId === targetId ||
            p.volunteerEmail === targetId ||
            (targetId === 'dev-skl-002' && (p.volunteerName === 'Alex Rivera' || p.volunteerId === 'dev-skl-002')))
        )
    );

    if (filtered.length === initialLen) {
      throw new Error(`Volunteer was not registered for activity "${activityId}".`);
    }

    setStoredParticipations(filtered);

    // Decrement participant count
    const activities = getStoredActivities();
    const index = activities.findIndex((a) => a.id === activityId);
    if (index !== -1) {
      activities[index].currentParticipantsCount = Math.max(0, (activities[index].currentParticipantsCount || 1) - 1);
      activities[index].updatedTime = new Date().toISOString();
      setStoredActivities(activities);
    }

    return true;
  },

  /**
   * Admin creates a new community activity
   */
  async createActivity(data) {
    if (!data.title || !data.title.trim()) throw new Error('Activity title is required.');
    if (!data.location || !data.location.trim()) throw new Error('Location is required.');
    if (!data.date) throw new Error('Date is required.');

    const activities = getStoredActivities();
    const now = new Date().toISOString();

    const newActivity = {
      id: `act-${Date.now().toString().slice(-6)}`,
      title: data.title.trim(),
      category: data.category || ACTIVITY_CATEGORIES[0],
      description: data.description ? data.description.trim() : 'Community disaster resilience activity.',
      location: data.location.trim(),
      address: data.address ? data.address.trim() : data.location.trim(),
      date: data.date,
      startTime: data.startTime || '09:00 AM',
      endTime: data.endTime || '01:00 PM',
      duration: data.duration || '4 Hours',
      status: 'scheduled',
      organizer: data.organizer ? data.organizer.trim() : 'Community Skill Bank Coordination',
      organizerContact: data.organizerContact ? data.organizerContact.trim() : 'community@skillbank.org',
      capacity: Number(data.capacity) || 30,
      currentParticipantsCount: 0,
      requiredSkills: Array.isArray(data.requiredSkills)
        ? data.requiredSkills
        : data.requiredSkills
        ? [data.requiredSkills]
        : ['General Assistance'],
      recommendedGear: data.recommendedGear ? data.recommendedGear.trim() : 'Comfortable attire and work gloves.',
      createdTime: now,
      updatedTime: now
    };

    activities.unshift(newActivity);
    setStoredActivities(activities);

    // Stage 10 Real-time event integration
    try {
      realtimeService.dispatchRealtimeEvent({
        type: 'community',
        priority: 'normal',
        title: `New Community Activity: ${newActivity.title}`,
        message: `Scheduled for ${newActivity.date} at ${newActivity.location}.`,
        targetRole: 'all',
        entityType: 'activity',
        entityId: newActivity.id,
        link: '/volunteer/activities'
      }).catch(() => {});
    } catch (_) {}

    return JSON.parse(JSON.stringify(newActivity));
  },

  /**
   * Admin edits activity details
   */
  async updateActivity(id, updateData = {}) {
    const activities = getStoredActivities();
    const index = activities.findIndex((a) => a.id === id);
    if (index === -1) throw new Error(`Activity with ID "${id}" not found.`);

    const now = new Date().toISOString();
    activities[index] = {
      ...activities[index],
      ...updateData,
      updatedTime: now
    };

    setStoredActivities(activities);
    return JSON.parse(JSON.stringify(activities[index]));
  },

  /**
   * Admin updates activity lifecycle status
   */
  async updateActivityStatus(id, newStatus) {
    if (!ACTIVITY_STATUSES.includes(newStatus)) {
      throw new Error(`Invalid status "${newStatus}". Must be one of: ${ACTIVITY_STATUSES.join(', ')}`);
    }

    const activities = getStoredActivities();
    const index = activities.findIndex((a) => a.id === id);
    if (index === -1) throw new Error(`Activity with ID "${id}" not found.`);

    const now = new Date().toISOString();
    activities[index].status = newStatus;
    activities[index].updatedTime = now;

    setStoredActivities(activities);
    return JSON.parse(JSON.stringify(activities[index]));
  },

  /**
   * Admin deletes an activity and associated participant records
   */
  async deleteActivity(id) {
    const activities = getStoredActivities();
    const filteredActivities = activities.filter((a) => a.id !== id);
    if (filteredActivities.length === activities.length) {
      throw new Error(`Activity with ID "${id}" not found.`);
    }
    setStoredActivities(filteredActivities);

    // Clean up participations
    const participations = getStoredParticipations();
    const remainingParticipations = participations.filter((p) => p.activityId !== id);
    setStoredParticipations(remainingParticipations);

    return true;
  },

  /**
   * Overview statistics for Admin activities management
   */
  async getActivityStats() {
    const activities = getStoredActivities();
    const participations = getStoredParticipations();

    const scheduled = activities.filter((a) => a.status === 'scheduled').length;
    const inProgress = activities.filter((a) => a.status === 'in_progress').length;
    const completed = activities.filter((a) => a.status === 'completed').length;
    const totalRegistrations = participations.length;

    return {
      totalActivities: activities.length,
      scheduled,
      inProgress,
      completed,
      totalRegistrations
    };
  },

  /**
   * Reset store to initial seed fixtures
   */
  resetDevelopmentActivities() {
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(INITIAL_DEV_ACTIVITIES));
    localStorage.setItem(PARTICIPATIONS_KEY, JSON.stringify(INITIAL_DEV_PARTICIPATIONS));
    return {
      activities: JSON.parse(JSON.stringify(INITIAL_DEV_ACTIVITIES)),
      participations: JSON.parse(JSON.stringify(INITIAL_DEV_PARTICIPATIONS))
    };
  }
};

export default communityService;
