/**
 * Community Activity & Engagement Service (Stage 9 & Stage 17 Integration)
 * 
 * Provides centralized lifecycle state management for disaster preparedness workshops,
 * community drills, volunteer mobilization drives, and participant registries using FastAPI backend
 * endpoints with local state fallback for offline support.
 */

import { api } from './api.js';
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

/**
 * Safely parse numeric identifier
 */
export const parseId = (id) => {
  if (typeof id === 'number') return id;
  if (!id) return null;
  const str = String(id).trim();
  if (str.startsWith('act-') || str.startsWith('part-') || str.startsWith('vol-')) {
    const candidate = parseInt(str.replace(/^[a-z]+-/, ''), 10);
    if (!isNaN(candidate)) return candidate;
  }
  const direct = parseInt(str, 10);
  return !isNaN(direct) ? direct : null;
};

/**
 * LocalStorage helpers for offline and initial fallback
 */
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
    console.error('[communityService] Error saving activities:', err);
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
    console.error('[communityService] Error saving participations:', err);
  }
};

/**
 * Normalize backend CommunityActivityOut to frontend presentation format
 */
export const normalizeActivity = (a) => {
  if (!a) return null;
  const numId = Number(a.id);
  const startDate = a.start_datetime ? new Date(a.start_datetime) : null;
  const endDate = a.end_datetime ? new Date(a.end_datetime) : null;

  const dateStr = startDate ? startDate.toISOString().split('T')[0] : (a.date || '');
  const startTimeStr = startDate ? startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (a.startTime || '09:00 AM');
  const endTimeStr = endDate ? endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (a.endTime || '01:00 PM');

  // Compute duration
  let durationStr = a.duration || '4 Hours';
  if (startDate && endDate) {
    const diffHours = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60)));
    durationStr = `${diffHours} Hour${diffHours > 1 ? 's' : ''}`;
  }

  // Frontend status mapping for presentation:
  // Backend returns: 'published', 'ongoing', 'completed', 'cancelled', 'draft'
  // Frontend devActivities used: 'scheduled', 'in_progress', 'completed', 'cancelled'
  const rawStatus = (a.status || 'published').toLowerCase();
  const presentationStatus =
    rawStatus === 'published' ? 'scheduled' :
    rawStatus === 'ongoing' ? 'in_progress' :
    rawStatus;

  return {
    id: String(a.id),
    numericId: !isNaN(numId) ? numId : null,
    title: a.title,
    category: a.activity_type || a.category || 'Flood Defense & Sandbagging',
    activityType: a.activity_type || a.category || 'Flood Defense & Sandbagging',
    description: a.description || '',
    location: a.location_name || a.location || 'Community Center',
    locationName: a.location_name || a.location || 'Community Center',
    address: a.location_name || a.address || a.location || '',
    latitude: a.latitude || null,
    longitude: a.longitude || null,
    date: dateStr,
    startTime: startTimeStr,
    endTime: endTimeStr,
    startDatetime: a.start_datetime || null,
    endDatetime: a.end_datetime || null,
    duration: durationStr,
    status: presentationStatus,
    backendStatus: rawStatus,
    organizer: a.organizer_name || a.organizer || 'Community Skill Bank Administration',
    organizerName: a.organizer_name || a.organizer || 'Community Skill Bank Administration',
    organizerContact: a.organizerContact || 'community@skillbank.org | (555) 019-2831',
    capacity: a.capacity || 30,
    currentParticipantsCount: a.registered_count ?? a.currentParticipantsCount ?? 0,
    registeredCount: a.registered_count ?? a.currentParticipantsCount ?? 0,
    remainingCapacity: a.remaining_capacity ?? (a.capacity ? Math.max(0, a.capacity - (a.registered_count || 0)) : null),
    isUserRegistered: Boolean(a.is_user_registered),
    userParticipationStatus: a.user_participation_status || null,
    requiredSkills: a.requiredSkills || ['General Assistance'],
    recommendedGear: a.recommendedGear || 'Standard outdoor work clothing.',
    participants: a.participants || [],
    createdTime: a.created_at || a.createdTime || new Date().toISOString(),
    updatedTime: a.updated_at || a.updatedTime || new Date().toISOString()
  };
};

export const communityService = {
  /**
   * Retrieve list of community activities with optional filtering
   * Uses real backend GET /api/community/activities
   * @param {Object} filters - { status, category, search, onlyMyActivities }
   * @returns {Promise<Array>}
   */
  async getActivities(filters = {}) {
    try {
      let endpoint = '/api/community/activities';
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'ALL') {
        const backendStatus =
          filters.status === 'scheduled' ? 'published' :
          filters.status === 'in_progress' ? 'ongoing' :
          filters.status;
        params.append('status', backendStatus);
      }
      if (filters.category && filters.category !== 'ALL') {
        params.append('activity_type', filters.category);
      }
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
      const data = await api.get(endpoint);
      if (Array.isArray(data) && data.length > 0) {
        let list = data.map(normalizeActivity);
        if (filters.search && filters.search.trim()) {
          const q = filters.search.toLowerCase().trim();
          list = list.filter(
            (a) =>
              a.title?.toLowerCase().includes(q) ||
              a.description?.toLowerCase().includes(q) ||
              a.location?.toLowerCase().includes(q) ||
              a.organizer?.toLowerCase().includes(q)
          );
        }
        return list;
      }
    } catch (err) {
      console.warn('[communityService] GET /api/community/activities failed, using fallback:', err.message);
    }

    // Local storage fallback
    let list = getStoredActivities().map(normalizeActivity);
    if (filters.status && filters.status !== 'ALL') {
      list = list.filter((a) => a.status === filters.status);
    }
    if (filters.category && filters.category !== 'ALL') {
      list = list.filter((a) => a.category === filters.category);
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.location?.toLowerCase().includes(q) ||
          a.organizer?.toLowerCase().includes(q)
      );
    }
    return list;
  },

  /**
   * Retrieve single activity by ID with enrolled participants
   * Uses real backend GET /api/community/activities/{id}
   * @param {string|number} id
   * @returns {Promise<Object|null>}
   */
  async getActivityById(id) {
    const numId = parseId(id);
    let activity = null;
    if (numId !== null) {
      try {
        const live = await api.get(`/api/community/activities/${numId}`);
        if (live) {
          activity = normalizeActivity(live);
        }
      } catch (err) {
        // Fall through to stored activities
      }
    }

    if (!activity) {
      const list = getStoredActivities();
      const found = list.find((a) => String(a.id) === String(id) || a.numericId === numId);
      activity = found ? normalizeActivity(found) : null;
    }

    if (!activity) return null;

    // Fetch participants if online (for admin or detailed roster)
    if (numId !== null) {
      try {
        const parts = await api.get(`/api/community/activities/${numId}/participants`);
        if (Array.isArray(parts)) {
          activity.participants = parts.map((p) => ({
            id: p.id,
            participantId: p.id,
            volunteerId: String(p.volunteer_id),
            volunteerName: p.volunteer_name || `Volunteer #${p.volunteer_id}`,
            volunteerEmail: p.volunteer_email || '',
            status: p.status,
            participationHours: p.participation_hours,
            registeredAt: p.registered_at,
            attendedAt: p.attended_at,
            notes: p.feedback_notes || ''
          }));
          return activity;
        }
      } catch (err) {
        // Fallback to local storage participations
      }
    }

    const participations = getStoredParticipations();
    activity.participants = participations
      .filter((p) => String(p.activityId) === String(id) || p.activityId === numId)
      .map((p) => ({
        id: p.id,
        participantId: p.id,
        volunteerId: String(p.volunteerId),
        volunteerName: p.volunteerName || 'Enrolled Volunteer',
        volunteerEmail: p.volunteerEmail || '',
        status: p.status || 'registered',
        participationHours: p.participationHours || null,
        registeredAt: p.registeredAt || new Date().toISOString(),
        notes: p.notes || ''
      }));

    return activity;
  },

  /**
   * Retrieve activities registered by a specific volunteer
   * Uses real backend GET /api/community/activities/mine
   * @param {string|number} volunteerIdOrEmail
   * @returns {Promise<Array>}
   */
  async getVolunteerActivities(volunteerIdOrEmail) {
    try {
      const data = await api.get('/api/community/activities/mine');
      if (Array.isArray(data) && data.length > 0) {
        return data.map((p) => {
          const actObj = {
            id: String(p.activity_id),
            activityId: String(p.activity_id),
            numericId: p.activity_id,
            participationId: p.id,
            title: p.activity_title || 'Community Activity',
            category: p.activity_type || 'Disaster Preparedness',
            location: p.location_name || 'Community Center',
            date: p.start_datetime ? p.start_datetime.split('T')[0] : '',
            startTime: p.start_datetime
              ? new Date(p.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '09:00 AM',
            endTime: p.end_datetime
              ? new Date(p.end_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '01:00 PM',
            duration: '4 Hours',
            status: p.status === 'registered' ? 'scheduled' : p.status,
            participationStatus: p.status,
            participationHours: p.participation_hours,
            organizer: 'Community Skill Bank',
            capacity: 30,
            currentParticipantsCount: 1,
            description: `Participation in ${p.activity_title || 'community activity'}`,
            participation: {
              id: p.id,
              volunteerId: String(p.volunteer_id),
              volunteerName: p.volunteer_name || '',
              volunteerEmail: p.volunteer_email || '',
              status: p.status,
              registeredAt: p.registered_at,
              notes: p.feedback_notes || ''
            }
          };
          return actObj;
        });
      }
    } catch (err) {
      console.warn('[communityService] GET /api/community/activities/mine failed, using fallback:', err.message);
    }

    // Local storage fallback
    const participations = getStoredParticipations();
    const myParts = participations.filter(
      (p) => String(p.volunteerId) === String(volunteerIdOrEmail) || p.volunteerEmail === volunteerIdOrEmail
    );
    const activities = getStoredActivities().map(normalizeActivity);
    return myParts
      .map((p) => {
        const found = activities.find((a) => String(a.id) === String(p.activityId));
        if (!found) return null;
        return {
          ...found,
          participation: p
        };
      })
      .filter(Boolean);
  },

  /**
   * Alias for getVolunteerActivities()
   */
  async getMyActivities() {
    return this.getVolunteerActivities();
  },

  /**
   * Check if a volunteer is already registered for an activity
   * @param {string|number} activityId
   * @param {string|number} volunteerIdOrEmail
   * @returns {Promise<boolean>}
   */
  async isVolunteerRegistered(activityId, volunteerIdOrEmail) {
    const numId = parseId(activityId);
    if (numId !== null) {
      try {
        const part = await api.get(`/api/community/activities/${numId}/participation`);
        if (part && part.status === 'registered') return true;
      } catch (err) {
        // Fall through to fallback
      }
    }

    const participations = getStoredParticipations();
    return participations.some(
      (p) =>
        String(p.activityId) === String(activityId) &&
        (String(p.volunteerId) === String(volunteerIdOrEmail) || p.volunteerEmail === volunteerIdOrEmail)
    );
  },

  /**
   * Volunteer joins/RSVPs for an activity
   * Uses real backend POST /api/community/activities/{id}/join
   * @param {string|number} activityId
   * @param {Object} volunteerData
   * @returns {Promise<Object>}
   */
  async joinActivity(activityId, volunteerData = {}) {
    const numId = parseId(activityId);
    if (numId !== null) {
      try {
        const res = await api.post(`/api/community/activities/${numId}/join`);
        if (res) {
          const activities = getStoredActivities();
          const idx = activities.findIndex((a) => String(a.id) === String(activityId) || a.numericId === numId);
          if (idx !== -1) {
            activities[idx].currentParticipantsCount = (activities[idx].currentParticipantsCount || 0) + 1;
            setStoredActivities(activities);
          }
          const partObj = {
            id: String(res.id),
            activityId: String(res.activity_id),
            volunteerId: String(res.volunteer_id),
            volunteerName: res.volunteer_name || volunteerData.name || '',
            volunteerEmail: res.volunteer_email || volunteerData.email || '',
            status: res.status,
            registeredAt: res.registered_at,
            notes: res.feedback_notes || volunteerData.notes || ''
          };
          return {
            success: true,
            participation: partObj,
            activity: idx !== -1 ? normalizeActivity(activities[idx]) : null
          };
        }
      } catch (err) {
        console.warn(`[communityService] POST /api/community/activities/${numId}/join failed:`, err.message);
        if (err.message && (err.message.includes('already registered') || err.message.includes('capacity') || err.message.includes('Cannot join'))) {
          throw err;
        }
      }
    }

    // Local storage fallback
    const activities = getStoredActivities();
    const index = activities.findIndex((a) => String(a.id) === String(activityId));
    if (index === -1) throw new Error(`Activity with ID "${activityId}" not found.`);

    const activity = activities[index];
    if (activity.status === 'completed' || activity.status === 'cancelled') {
      throw new Error(`Cannot join an activity that is ${activity.status}.`);
    }

    const participations = getStoredParticipations();
    const volId = volunteerData.id || volunteerData.volunteerId || 'dev-skl-002';
    const volEmail = volunteerData.email || volunteerData.volunteerEmail || 'volunteer@skillbank.org';

    const existing = participations.find(
      (p) => String(p.activityId) === String(activityId) && (String(p.volunteerId) === String(volId) || p.volunteerEmail === volEmail)
    );
    if (existing) {
      return { success: true, participation: existing, alreadyJoined: true };
    }

    const currentCount = activity.currentParticipantsCount || 0;
    if (activity.capacity && currentCount >= activity.capacity) {
      throw new Error('Activity has reached maximum participant capacity.');
    }

    const newParticipation = {
      id: `part-${Date.now().toString().slice(-6)}`,
      activityId: String(activityId),
      volunteerId: String(volId),
      volunteerName: volunteerData.name || volunteerData.volunteerName || 'Alex Rivera',
      volunteerEmail: volEmail,
      status: 'registered',
      registeredAt: new Date().toISOString(),
      notes: volunteerData.notes || 'Self-service registration via Community Skill Bank portal.'
    };

    participations.push(newParticipation);
    setStoredParticipations(participations);

    activity.currentParticipantsCount = currentCount + 1;
    activity.updatedTime = new Date().toISOString();
    activities[index] = activity;
    setStoredActivities(activities);

    return {
      success: true,
      activity: normalizeActivity(activity),
      participation: newParticipation
    };
  },

  /**
   * Volunteer cancels RSVP / withdraws from an activity
   * Uses real backend POST /api/community/activities/{id}/withdraw
   * @param {string|number} activityId
   * @param {string|number} volunteerIdOrEmail
   * @returns {Promise<boolean>}
   */
  async leaveActivity(activityId, volunteerIdOrEmail) {
    const numId = parseId(activityId);
    if (numId !== null) {
      try {
        const res = await api.post(`/api/community/activities/${numId}/withdraw`);
        if (res) {
          const activities = getStoredActivities();
          const idx = activities.findIndex((a) => String(a.id) === String(activityId) || a.numericId === numId);
          if (idx !== -1) {
            activities[idx].currentParticipantsCount = Math.max(0, (activities[idx].currentParticipantsCount || 1) - 1);
            setStoredActivities(activities);
          }
          return true;
        }
      } catch (err) {
        console.warn(`[communityService] POST /api/community/activities/${numId}/withdraw failed:`, err.message);
        if (err.message && (err.message.includes('not actively registered') || err.message.includes('Cannot withdraw'))) {
          throw err;
        }
      }
    }

    // Local storage fallback
    const participations = getStoredParticipations();
    const index = participations.findIndex(
      (p) =>
        String(p.activityId) === String(activityId) &&
        (String(p.volunteerId) === String(volunteerIdOrEmail) || p.volunteerEmail === volunteerIdOrEmail)
    );
    if (index === -1) {
      throw new Error(`Registration for volunteer "${volunteerIdOrEmail}" in activity "${activityId}" not found.`);
    }

    participations.splice(index, 1);
    setStoredParticipations(participations);

    const activities = getStoredActivities();
    const actIdx = activities.findIndex((a) => String(a.id) === String(activityId));
    if (actIdx !== -1) {
      activities[actIdx].currentParticipantsCount = Math.max(0, (activities[actIdx].currentParticipantsCount || 1) - 1);
      activities[actIdx].updatedTime = new Date().toISOString();
      setStoredActivities(activities);
    }

    return true;
  },

  /**
   * Admin creates a new community activity
   * Uses real backend POST /api/community/activities
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async createActivity(data) {
    if (!data.title) throw new Error('Activity title is required.');
    if (!data.category && !data.activity_type) throw new Error('Activity category is required.');

    let startIso = data.start_datetime;
    let endIso = data.end_datetime;
    if (!startIso && data.date) {
      const timeStr = data.startTime || '09:00 AM';
      try {
        startIso = new Date(`${data.date} ${timeStr}`).toISOString();
      } catch (_) {
        startIso = new Date().toISOString();
      }
    }
    if (!endIso && data.date) {
      const endTimeStr = data.endTime || '01:00 PM';
      try {
        endIso = new Date(`${data.date} ${endTimeStr}`).toISOString();
      } catch (_) {
        endIso = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
      }
    }
    if (!startIso) startIso = new Date().toISOString();
    if (!endIso) endIso = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

    const payload = {
      title: data.title,
      description: data.description || 'Community disaster preparedness activity.',
      activity_type: data.category || data.activity_type || 'Flood Defense & Sandbagging',
      location_name: data.location || data.location_name || data.address || 'Designated Community Center',
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
      start_datetime: startIso,
      end_datetime: endIso,
      capacity: data.capacity ? parseInt(data.capacity, 10) : 30,
      status: 'published'
    };

    try {
      const created = await api.post('/api/community/activities', payload);
      if (created) {
        const normalized = normalizeActivity(created);
        const list = getStoredActivities();
        setStoredActivities([normalized, ...list]);
        return normalized;
      }
    } catch (err) {
      console.warn('[communityService] POST /api/community/activities failed, using fallback:', err.message);
    }

    // Local storage fallback
    const activities = getStoredActivities();
    const newActivity = {
      id: `act-${Date.now().toString().slice(-6)}`,
      title: data.title,
      category: data.category || 'Flood Defense & Sandbagging',
      description: data.description || 'Volunteer mobilization and preparedness session.',
      location: data.location || 'Local Community Center',
      address: data.address || data.location || '100 Main St',
      date: data.date || new Date().toISOString().split('T')[0],
      startTime: data.startTime || '09:00 AM',
      endTime: data.endTime || '01:00 PM',
      duration: data.duration || '4 Hours',
      status: 'scheduled',
      organizer: data.organizer || 'Community Skill Bank Administration',
      organizerContact: data.organizerContact || 'community@skillbank.org',
      capacity: parseInt(data.capacity, 10) || 30,
      currentParticipantsCount: 0,
      requiredSkills: typeof data.requiredSkills === 'string'
        ? data.requiredSkills.split(',').map((s) => s.trim())
        : data.requiredSkills || ['General Assistance'],
      recommendedGear: data.recommendedGear || 'Standard outdoor work clothing.',
      createdTime: new Date().toISOString(),
      updatedTime: new Date().toISOString()
    };

    activities.unshift(newActivity);
    setStoredActivities(activities);
    return newActivity;
  },

  /**
   * Admin updates an existing community activity
   * Uses real backend PATCH /api/community/activities/{id}
   * @param {string|number} id
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  async updateActivity(id, updateData = {}) {
    const numId = parseId(id);
    if (numId !== null) {
      const payload = {};
      if (updateData.title) payload.title = updateData.title;
      if (updateData.description) payload.description = updateData.description;
      if (updateData.category || updateData.activity_type) {
        payload.activity_type = updateData.category || updateData.activity_type;
      }
      if (updateData.location || updateData.location_name) {
        payload.location_name = updateData.location || updateData.location_name;
      }
      if (updateData.capacity) payload.capacity = parseInt(updateData.capacity, 10);
      if (updateData.status) {
        payload.status =
          updateData.status === 'scheduled' ? 'published' :
          updateData.status === 'in_progress' ? 'ongoing' :
          updateData.status;
      }

      try {
        const updated = await api.patch(`/api/community/activities/${numId}`, payload);
        if (updated) {
          const normalized = normalizeActivity(updated);
          const list = getStoredActivities();
          const idx = list.findIndex((a) => String(a.id) === String(id) || a.numericId === numId);
          if (idx !== -1) {
            list[idx] = normalized;
            setStoredActivities(list);
          }
          return normalized;
        }
      } catch (err) {
        console.warn(`[communityService] PATCH /api/community/activities/${numId} failed:`, err.message);
      }
    }

    // Local storage fallback
    const activities = getStoredActivities();
    const index = activities.findIndex((a) => String(a.id) === String(id));
    if (index === -1) throw new Error(`Activity with ID "${id}" not found.`);

    const merged = {
      ...activities[index],
      ...updateData,
      updatedTime: new Date().toISOString()
    };

    activities[index] = merged;
    setStoredActivities(activities);
    return normalizeActivity(merged);
  },

  /**
   * Admin updates lifecycle status of an activity
   * Maps 'scheduled' -> 'published', 'in_progress' -> 'ongoing', 'cancelled' -> cancel endpoint
   * @param {string|number} id
   * @param {string} newStatus
   * @returns {Promise<Object>}
   */
  async updateActivityStatus(id, newStatus) {
    if (!ACTIVITY_STATUSES.includes(newStatus)) {
      throw new Error(`Invalid status "${newStatus}". Must be one of: ${ACTIVITY_STATUSES.join(', ')}`);
    }

    const numId = parseId(id);
    if (numId !== null) {
      if (newStatus === 'cancelled') {
        try {
          const res = await api.post(`/api/community/activities/${numId}/cancel`);
          if (res) return normalizeActivity(res);
        } catch (err) {
          console.warn(`[communityService] Cancel failed:`, err.message);
        }
      } else {
        const backendStatus =
          newStatus === 'scheduled' ? 'published' :
          newStatus === 'in_progress' ? 'ongoing' :
          newStatus;
        try {
          const res = await api.patch(`/api/community/activities/${numId}`, { status: backendStatus });
          if (res) return normalizeActivity(res);
        } catch (err) {
          console.warn(`[communityService] Status update failed:`, err.message);
        }
      }
    }

    return this.updateActivity(id, { status: newStatus });
  },

  /**
   * Admin cancels or deletes an activity
   * Uses real backend POST /api/community/activities/{id}/cancel
   * @param {string|number} id
   * @returns {Promise<boolean>}
   */
  async deleteActivity(id) {
    const numId = parseId(id);
    if (numId !== null) {
      try {
        await api.post(`/api/community/activities/${numId}/cancel`);
      } catch (err) {
        console.warn(`[communityService] Cancel before delete failed:`, err.message);
      }
    }

    const activities = getStoredActivities();
    const filtered = activities.filter((a) => String(a.id) !== String(id) && a.numericId !== numId);
    if (filtered.length === activities.length) {
      throw new Error(`Activity with ID "${id}" not found.`);
    }

    setStoredActivities(filtered);
    const participations = getStoredParticipations().filter((p) => String(p.activityId) !== String(id));
    setStoredParticipations(participations);
    return true;
  },

  /**
   * Alias for cancelling activity
   */
  async cancelActivity(id) {
    return this.updateActivityStatus(id, 'cancelled');
  },

  /**
   * Admin lists all participant records and attendance status for an activity
   * Uses real backend GET /api/community/activities/{activity_id}/participants
   * @param {string|number} activityId
   * @returns {Promise<Array>}
   */
  async getActivityParticipants(activityId) {
    const numId = parseId(activityId);
    if (numId !== null) {
      try {
        const parts = await api.get(`/api/community/activities/${numId}/participants`);
        if (Array.isArray(parts)) {
          return parts.map((p) => ({
            id: p.id,
            participantId: p.id,
            volunteerId: String(p.volunteer_id),
            volunteerName: p.volunteer_name || `Volunteer #${p.volunteer_id}`,
            volunteerEmail: p.volunteer_email || '',
            status: p.status,
            participationHours: p.participation_hours,
            registeredAt: p.registered_at,
            attendedAt: p.attended_at,
            notes: p.feedback_notes || ''
          }));
        }
      } catch (err) {
        console.warn(`[communityService] GET participants failed:`, err.message);
      }
    }

    const participations = getStoredParticipations();
    return participations.filter((p) => String(p.activityId) === String(activityId));
  },

  /**
   * Admin updates attendance and awards hours
   * Uses real backend PATCH /api/community/activities/{activity_id}/participants/{participant_id}/attendance
   * @param {string|number} activityId
   * @param {string|number} participantId
   * @param {Object} data - { status, hours, notes }
   * @returns {Promise<Object>}
   */
  async updateParticipantAttendance(activityId, participantId, { status = 'attended', hours = null, notes = '' } = {}) {
    const numActId = parseId(activityId);
    const numPartId = parseId(participantId);
    if (numActId !== null && numPartId !== null) {
      const payload = {
        status,
        participation_hours: hours ? parseFloat(hours) : null,
        feedback_notes: notes ? notes.trim() : null
      };
      return api.patch(`/api/community/activities/${numActId}/participants/${numPartId}/attendance`, payload);
    }
    throw new Error('Valid activity and participant IDs are required.');
  },

  /**
   * Retrieve volunteer community engagement summary
   * Uses real backend GET /api/community/summary
   * @returns {Promise<Object|null>}
   */
  async getCommunitySummary() {
    try {
      const data = await api.get('/api/community/summary');
      if (data) {
        return {
          volunteerId: data.volunteer_id,
          volunteerName: data.volunteer_name,
          role: data.role,
          totalActivitiesJoined: data.total_activities_joined,
          activitiesAttended: data.activities_attended,
          activitiesCompleted: data.activities_completed,
          totalCommunityHours: data.total_community_hours,
          upcomingActivitiesCount: data.upcoming_activities_count
        };
      }
    } catch (err) {
      console.warn('[communityService] GET /api/community/summary failed:', err.message);
    }
    return null;
  },

  /**
   * Overview statistics for Admin activities management
   */
  async getActivityStats() {
    const activities = await this.getActivities();
    const participations = getStoredParticipations();

    const scheduled = activities.filter((a) => a.status === 'scheduled' || a.status === 'published').length;
    const inProgress = activities.filter((a) => a.status === 'in_progress' || a.status === 'ongoing').length;
    const completed = activities.filter((a) => a.status === 'completed').length;
    const totalRegistrations = activities.reduce((sum, a) => sum + (a.currentParticipantsCount || 0), 0) || participations.length;

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
