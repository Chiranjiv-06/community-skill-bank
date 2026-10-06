/**
 * Real-Time WebSocket Service & Event Adapter (Stage 10 & Stage 17 Integration)
 * 
 * Manages live WebSocket connection to FastAPI backend:
 * ws://localhost:8000/api/ws?token=<jwt>
 * 
 * Features:
 * - Native browser WebSocket with auto-reconnect
 * - JWT authentication parameter
 * - Keepalive ping/pong heartbeat (25s interval)
 * - Safe JSON message ingestion & event broadcasting
 * - Integration with notificationService for real-time inbox updates
 * - Development event simulation preserved for testing
 */

import { api } from './api.js';
import { notificationService } from './notificationService.js';

// Event subscribers map: eventType -> Set of callbacks
const eventSubscribers = new Map();

// Active WebSocket instance & keepalive timer
let socket = null;
let pingInterval = null;
let reconnectTimeout = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30000;

// Connection state
let connectionState = {
  status: 'dev_connected',
  label: 'Development Event Source (Simulated)',
  isDevelopment: true,
  lastHeartbeat: new Date().toISOString()
};

const getWebSocketUrl = (token) => {
  const apiBaseUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
    'http://localhost:8000';

  const wsBaseUrl = apiBaseUrl
    .replace(/^http:/, 'ws:')
    .replace(/^https:/, 'wss:');

  return `${wsBaseUrl.replace(/\/$/, '')}/api/ws?token=${encodeURIComponent(token)}`;
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
   * @param {string} status - 'connected' | 'connecting' | 'disconnected' | 'unavailable' | 'dev_connected'
   */
  setConnectionState(status) {
    let label = 'Real-Time Stream Disconnected';
    if (status === 'connected') label = 'Live WebSocket Stream Connected';
    if (status === 'dev_connected') label = 'Development Event Source (Simulated)';
    if (status === 'connecting') label = 'Connecting to Real-time Stream...';
    if (status === 'unavailable') label = 'Real-Time WebSocket Server Unavailable';

    connectionState = {
      status,
      label,
      isDevelopment: status === 'dev_connected',
      lastHeartbeat: new Date().toISOString()
    };

    this.emit('CONNECTION_STATE_CHANGED', connectionState);
    return connectionState;
  },

  /**
   * Connect to real FastAPI WebSocket server
   * @param {string} customToken - Optional JWT token override
   */
  connect(customToken = null) {
    const token = customToken || api.getToken();
    if (!token) {
      this.setConnectionState('disconnected');
      return;
    }

    if (typeof WebSocket === 'undefined') {
      // Node/Test environment: fallback to simulated state
      this.setConnectionState('dev_connected');
      return;
    }

    // Avoid duplicate connections
    if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
      return;
    }

    this.setConnectionState('connecting');

    try {
      const url = getWebSocketUrl(token);
      socket = new WebSocket(url);

      socket.onopen = () => {
        reconnectAttempts = 0;
        this.setConnectionState('connected');

        // Start ping/pong heartbeat
        clearInterval(pingInterval);
        pingInterval = setInterval(() => {
          if (socket && socket.readyState === WebSocket.OPEN) {
            try {
              socket.send(JSON.stringify({ type: 'ping' }));
            } catch (err) {
              console.warn('[realtimeService] Ping failed:', err);
            }
          }
        }, 25000);
      };

      socket.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle keepalive pong
          if (data.type === 'pong' || data.action === 'pong') {
            connectionState.lastHeartbeat = new Date().toISOString();
            return;
          }

          // Handle initial handshake
          if (data.event === 'connection.established') {
            this.emit('REALTIME_CONNECTED', data);
            return;
          }

          // Handle incoming live notification event
          if (data.event === 'notification.created') {
            const notif = {
              id: data.notification_id || `ws-${Date.now()}`,
              title: data.title || 'Incident Update',
              message: data.message || '',
              type: data.notification_type || 'emergency',
              priority: data.severity === 'critical' ? 'critical' : data.severity === 'warning' ? 'high' : 'normal',
              severity: data.severity || 'info',
              entityType: data.related_entity_type,
              entityId: data.related_entity_id,
              timestamp: data.created_at || new Date().toISOString(),
              targetRole: 'all'
            };

            await notificationService.addNotification(notif);
            this.emit('NOTIFICATION_RECEIVED', notif);
            this.emit((notif.type || 'system').toUpperCase(), notif);
            return;
          }

          // Generic event dispatch
          if (data.event) {
            this.emit(data.event, data);
            this.emit('*', data);
          }
        } catch (err) {
          console.warn('[realtimeService] Error processing WebSocket message:', err);
        }
      };

      socket.onerror = (err) => {
        console.warn('[realtimeService] WebSocket error:', err);
      };

      socket.onclose = () => {
        clearInterval(pingInterval);
        socket = null;
        this.setConnectionState('disconnected');

        // Safe auto-reconnect with exponential backoff if token still present
        if (api.getToken()) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
          reconnectAttempts++;
          clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(() => {
            if (api.getToken()) {
              this.connect();
            }
          }, delay);
        }
      };
    } catch (err) {
      console.warn('[realtimeService] Failed to establish WebSocket connection:', err);
      this.setConnectionState('unavailable');
    }
  },

  /**
   * Disconnect active WebSocket connection
   */
  disconnect() {
    clearTimeout(reconnectTimeout);
    clearInterval(pingInterval);
    if (socket) {
      socket.close();
      socket = null;
    }
    this.setConnectionState('disconnected');
  },

  /**
   * Fetch real-time status from backend (Admin only)
   */
  async getRealtimeStatus() {
    if (api.getToken()) {
      try {
        return await api.get('/api/ws/status');
      } catch (err) {
        console.warn('[realtimeService] Failed to get real-time status:', err.message);
      }
    }
    return {
      connected_users_count: 0,
      active_sockets_count: 0,
      connected_admins_count: 0
    };
  },

  /**
   * Subscribe to specific real-time event types
   * @param {string} eventType - e.g. 'EMERGENCY_ALERT', 'NOTIFICATION_RECEIVED', or '*' for all
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
  // SIMULATION HELPERS (Development Event Source & Testing)
  // =========================================================================

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
