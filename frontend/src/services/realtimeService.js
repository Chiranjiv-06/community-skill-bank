/**
 * WebSocket-Ready Real-Time Service & Event Adapter (Stage 10)
 * 
 * Provides an event-driven adapter layer that simulates incoming real-time events
 * during frontend development, while maintaining a clean contract ready for 
 * real FastAPI WebSocket server integration in Stage 17.
 * 
 * Architecture:
 * UI / NotificationCenter 
 *   → notificationService
 *     → realtimeService (Real-Time Event Adapter)
 *       → Development Event Source (Simulated)
 * 
 * CRITICAL REQUIREMENTS:
 * - DO NOT connect to a real WebSocket server.
 * - DO NOT create backend WebSocket endpoints.
 * - Distinguish development simulation from production WebSocket connectivity.
 */

import { notificationService } from './notificationService.js';

// Event subscribers map: eventType -> Set of callbacks
const eventSubscribers = new Map();

// Connection state
let connectionState = {
  status: 'dev_connected',
  label: 'Development Event Source (Simulated)',
  isDevelopment: true,
  lastHeartbeat: new Date().toISOString()
};

export const realtimeService = {
  /**
   * Get current connection status info
   */
  getConnectionState() {
    return { ...connectionState };
  },

  /**
   * Set connection state (used for testing connection/error states)
   * @param {string} status - 'dev_connected' | 'connecting' | 'disconnected' | 'unavailable'
   */
  setConnectionState(status) {
    let label = 'Development Event Source (Simulated)';
    if (status === 'connecting') label = 'Initializing Simulated Event Stream...';
    if (status === 'disconnected') label = 'Simulated Stream Disconnected';
    if (status === 'unavailable') label = 'Production WebSocket Server Unavailable (Integration in Stage 17)';

    connectionState = {
      status,
      label,
      isDevelopment: true,
      lastHeartbeat: new Date().toISOString()
    };

    this.emit('CONNECTION_STATE_CHANGED', connectionState);
    return connectionState;
  },

  /**
   * Subscribe to specific real-time event types
   * @param {string} eventType - e.g. 'EMERGENCY_ALERT', 'ASSIGNMENT_UPDATE', or '*' for all
   * @param {Function} callback
   * @returns {Function} unsubscribe function
   */
  subscribe(eventType, callback) {
    if (!eventSubscribers.has(eventType)) {
      eventSubscribers.set(eventType, new Set());
    }
    eventSubscribers.get(eventType).add(callback);

    return () => {
      const set = eventSubscribers.get(eventType);
      if (set) {
        set.delete(callback);
        if (set.size === 0) eventSubscribers.delete(eventType);
      }
    };
  },

  /**
   * Internal emitter to broadcast events to active subscribers
   */
  emit(eventType, payload) {
    const specific = eventSubscribers.get(eventType);
    if (specific) {
      specific.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[realtimeService] Error in subscriber for "${eventType}":`, err);
        }
      });
    }

    const wildcard = eventSubscribers.get('*');
    if (wildcard) {
      wildcard.forEach((cb) => {
        try {
          cb({ type: eventType, payload });
        } catch (err) {
          console.error('[realtimeService] Error in wildcard subscriber:', err);
        }
      });
    }
  },

  /**
   * Ingest and convert a real-time event into a persistent notification
   * Immediately updates notification center without page reload
   */
  async dispatchRealtimeEvent(event) {
    const {
      type = 'system',
      priority = 'normal',
      title,
      message,
      targetRole = 'all',
      volunteerId = null,
      entityType = null,
      entityId = null,
      link = null
    } = event;

    // Persist into notification store
    const notification = await notificationService.addNotification({
      type,
      priority,
      title,
      message,
      targetRole,
      volunteerId,
      entityType,
      entityId,
      link,
      timestamp: new Date().toISOString()
    });

    // Broadcast through real-time adapter
    this.emit('NOTIFICATION_RECEIVED', notification);
    this.emit(type.toUpperCase(), notification);

    return notification;
  },

  // =========================================================================
  // SIMULATION HELPERS (Development Event Source)
  // =========================================================================

  /**
   * Simulate an incoming critical emergency broadcast
   */
  async simulateEmergencyAlert(data = {}) {
    return this.dispatchRealtimeEvent({
      type: 'emergency',
      priority: 'critical',
      title: data.title || 'CRITICAL DISASTER ALERT: Flash Flood Surge',
      message: data.message || 'Water levels exceeding critical thresholds in Sector 4 basin. Immediate evacuation initiated.',
      targetRole: 'all',
      entityType: 'emergency',
      entityId: data.emergencyId || 'emg-501',
      link: `/volunteer/emergencies/${data.emergencyId || 'emg-501'}`
    });
  },

  /**
   * Simulate a volunteer assignment dispatch
   */
  async simulateAssignmentDispatch(data = {}) {
    return this.dispatchRealtimeEvent({
      type: 'assignment',
      priority: 'high',
      title: data.title || 'Tactical Mission Dispatch Assigned',
      message: data.message || 'You have been dispatched to Emergency Triage & Sandbagging Staging at Sector 2.',
      targetRole: 'volunteer',
      volunteerId: data.volunteerId || 'dev-skl-002',
      entityType: 'assignment',
      entityId: data.assignmentId || `asg-${Date.now().toString().slice(-4)}`,
      link: '/volunteer/assignments'
    });
  },

  /**
   * Simulate volunteer acceptance response (notifying Admin Command)
   */
  async simulateVolunteerResponse(data = {}) {
    return this.dispatchRealtimeEvent({
      type: 'assignment',
      priority: 'normal',
      title: data.title || 'Responder Accepted Assignment',
      message: data.message || `Responder ${data.volunteerName || 'Alex Rivera'} confirmed deployment. Mobilization ETA: 15 mins.`,
      targetRole: 'admin',
      volunteerId: data.volunteerId || 'dev-skl-002',
      entityType: 'assignment',
      entityId: data.assignmentId || 'asg-701',
      link: '/admin/response-monitoring'
    });
  },

  /**
   * Simulate community activity schedule or update
   */
  async simulateCommunityActivity(data = {}) {
    return this.dispatchRealtimeEvent({
      type: 'community',
      priority: 'normal',
      title: data.title || 'New Community Drill Scheduled',
      message: data.message || 'Quarterly Emergency Radio Mesh Relay drill scheduled for next Saturday at Summit Hill.',
      targetRole: 'all',
      entityType: 'activity',
      entityId: data.activityId || 'act-902',
      link: '/volunteer/activities'
    });
  },

  /**
   * Simulate certification verification status change
   */
  async simulateCertificationVerification(data = {}) {
    return this.dispatchRealtimeEvent({
      type: 'certification',
      priority: 'normal',
      title: data.title || 'Credential Clearance Verified',
      message: data.message || 'Your Swift Water Rescue Technician credential has been cleared by Incident Command.',
      targetRole: 'volunteer',
      volunteerId: data.volunteerId || 'dev-skl-002',
      entityType: 'certification',
      entityId: data.certId || 'cert-802',
      link: '/volunteer/certifications'
    });
  }
};

export default realtimeService;
