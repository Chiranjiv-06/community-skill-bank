/**
 * Notification Service (Stage 10 & Stage 17 FastAPI Integration)
 * 
 * Provides notification state management for disaster alerts,
 * assignment notices, volunteer responses, and verification updates.
 * 
 * Integrated with FastAPI backend endpoints:
 * - GET    /api/notifications
 * - GET    /api/notifications/unread-count
 * - GET    /api/notifications/{id}
 * - PATCH  /api/notifications/{id}/read
 * - PATCH  /api/notifications/read-all
 * - POST   /api/admin/notifications/broadcast (Admin only)
 * 
 * Preserves local fallback for offline resilience and tests.
 */

import { api } from './api.js';
import {
  INITIAL_DEV_NOTIFICATIONS,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES
} from '../data/devNotifications.js';

const STORAGE_KEY = 'csb_dev_notifications';

// In-memory subscribers for immediate UI updates without page refresh
const subscribers = new Set();

const notifySubscribers = (eventData) => {
  subscribers.forEach((callback) => {
    try {
      callback(eventData);
    } catch (err) {
      console.error('[notificationService] Subscriber error:', err);
    }
  });
};

const getStoredNotifications = () => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_NOTIFICATIONS));
      }
      return JSON.parse(JSON.stringify(INITIAL_DEV_NOTIFICATIONS));
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[notificationService] Error parsing localStorage notifications, resetting:', err);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_NOTIFICATIONS));
    }
    return JSON.parse(JSON.stringify(INITIAL_DEV_NOTIFICATIONS));
  }
};

const setStoredNotifications = (items) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  } catch (err) {
    console.error('[notificationService] Error persisting notifications:', err);
  }
};

export const normalizeNotification = (n) => {
  if (!n) return null;
  const isRead = n.is_read !== undefined ? Boolean(n.is_read) : Boolean(n.read);
  const severity = n.severity || (n.priority === 'critical' ? 'critical' : 'info');
  const priority = severity === 'critical' ? 'critical' : severity === 'warning' ? 'high' : (n.priority || 'normal');

  return {
    id: n.id,
    type: n.type || 'system',
    priority,
    severity,
    title: n.title || 'Notification Alert',
    message: n.message || '',
    timestamp: n.created_at || n.timestamp || new Date().toISOString(),
    createdAt: n.created_at || n.timestamp || new Date().toISOString(),
    read: isRead,
    is_read: isRead,
    readAt: n.read_at || n.readAt || null,
    targetRole: n.targetRole || 'all',
    volunteerId: n.volunteerId || (n.user_id ? String(n.user_id) : null),
    entityType: n.related_entity_type || n.entityType || null,
    entityId: n.related_entity_id || n.entityId || null,
    link: n.link || (n.related_entity_type === 'emergency' && n.related_entity_id ? `/volunteer/emergencies/${n.related_entity_id}` : n.related_entity_type === 'assignment' ? '/volunteer/assignments' : null)
  };
};

export const notificationService = {
  /**
   * Subscribe to notification updates (enables live UI updates without page refresh)
   * @param {Function} callback
   * @returns {Function} unsubscribe function
   */
  subscribe(callback) {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  },

  /**
   * Retrieve notifications with role, volunteerId, and criteria filters
   * Queries real backend when authenticated, falls back to local cache.
   */
  async getNotifications(options = {}) {
    const { role = 'all', volunteerId = null, type = 'ALL', unreadOnly = false, search = '' } = options;

    let serverList = null;

    // Try backend REST API first if token present
    if (api.getToken()) {
      try {
        const queryParams = new URLSearchParams();
        if (unreadOnly) queryParams.append('is_read', 'false');
        if (type && type !== 'ALL') queryParams.append('type', type.toLowerCase());
        queryParams.append('limit', '50');

        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const data = await api.get(`/api/notifications${queryString}`);
        if (Array.isArray(data)) {
          serverList = data.map(normalizeNotification);
          // Update local cache with server notifications
          setStoredNotifications(serverList);
        }
      } catch (err) {
        console.warn('[notificationService] REST fetch failed, using cached store:', err.message);
      }
    }

    let list = serverList || getStoredNotifications().map(normalizeNotification);

    // Local / fallback filtering
    if (role === 'admin') {
      list = list.filter((n) => n.targetRole === 'admin' || n.targetRole === 'all');
    } else if (role !== 'all') {
      // Volunteer filtering
      list = list.filter((n) => {
        if (n.targetRole === 'admin') return false;
        if (n.targetRole === 'all') return true;
        if (volunteerId) {
          const target = (volunteerId === 'alex.rivera@skillbank.org' || volunteerId === 'dev-skl-002')
            ? 'dev-skl-002'
            : volunteerId;
          return !n.volunteerId || String(n.volunteerId) === String(target);
        }
        return true;
      });
    }

    // Type filter
    if (type && type !== 'ALL') {
      const typeLower = type.toLowerCase();
      list = list.filter((n) => n.type && n.type.toLowerCase() === typeLower);
    }

    // Unread only filter
    if (unreadOnly) {
      list = list.filter((n) => !n.read);
    }

    // Search query
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (n) =>
          n.title?.toLowerCase().includes(q) ||
          n.message?.toLowerCase().includes(q) ||
          n.type?.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return JSON.parse(JSON.stringify(list));
  },

  /**
   * Retrieve unread notification count
   */
  async getUnreadCount(options = {}) {
    if (api.getToken()) {
      try {
        const res = await api.get('/api/notifications/unread-count');
        if (res && typeof res.unread_count === 'number') {
          return res.unread_count;
        }
      } catch (err) {
        console.warn('[notificationService] Failed to get unread count from API, using fallback:', err.message);
      }
    }

    const list = await this.getNotifications({ ...options, unreadOnly: true });
    return list.length;
  },

  /**
   * Mark a specific notification as read
   */
  async markAsRead(id) {
    const numericId = typeof id === 'number' ? id : (!isNaN(Number(id)) ? Number(id) : null);

    if (numericId !== null && api.getToken()) {
      try {
        const updated = await api.patch(`/api/notifications/${numericId}/read`);
        const norm = normalizeNotification(updated);
        notifySubscribers({ type: 'READ_UPDATED', notificationId: id, read: true });
        return norm;
      } catch (err) {
        console.warn(`[notificationService] Backend markAsRead failed for ${id}:`, err.message);
      }
    }

    // Local / fallback update
    const list = getStoredNotifications();
    const index = list.findIndex((n) => String(n.id) === String(id));
    if (index !== -1) {
      list[index].read = true;
      list[index].is_read = true;
      list[index].readAt = new Date().toISOString();
      setStoredNotifications(list);
      notifySubscribers({ type: 'READ_UPDATED', notificationId: id, read: true });
      return JSON.parse(JSON.stringify(list[index]));
    }
    return null;
  },

  /**
   * Mark a specific notification as unread (local / offline toggle)
   */
  async markAsUnread(id) {
    const list = getStoredNotifications();
    const index = list.findIndex((n) => String(n.id) === String(id));
    if (index !== -1) {
      list[index].read = false;
      list[index].is_read = false;
      delete list[index].readAt;
      setStoredNotifications(list);
      notifySubscribers({ type: 'READ_UPDATED', notificationId: id, read: false });
      return JSON.parse(JSON.stringify(list[index]));
    }
    return null;
  },

  /**
   * Mark all relevant notifications as read for current role/volunteer
   */
  async markAllAsRead(options = {}) {
    if (api.getToken()) {
      try {
        await api.patch('/api/notifications/read-all');
      } catch (err) {
        console.warn('[notificationService] Backend markAllAsRead failed:', err.message);
      }
    }

    const list = getStoredNotifications();
    const now = new Date().toISOString();
    const { role = 'all', volunteerId = null } = options;

    list.forEach((n) => {
      let isTarget = false;
      if (role === 'admin') {
        isTarget = n.targetRole === 'admin' || n.targetRole === 'all';
      } else if (role !== 'all') {
        const target = (volunteerId === 'alex.rivera@skillbank.org' || volunteerId === 'dev-skl-002')
          ? 'dev-skl-002'
          : volunteerId;
        isTarget = n.targetRole === 'all' || (n.targetRole === 'volunteer' && (!n.volunteerId || String(n.volunteerId) === String(target)));
      } else {
        isTarget = true;
      }

      if (isTarget && !n.read) {
        n.read = true;
        n.is_read = true;
        n.readAt = now;
      }
    });

    setStoredNotifications(list);
    notifySubscribers({ type: 'ALL_READ', role, volunteerId });
    return { success: true };
  },

  /**
   * Broadcast an administrative notification to users (Admin only)
   */
  async broadcastNotification(data) {
    if (!data.title || !data.title.trim()) throw new Error('Broadcast title is required.');
    if (!data.message || !data.message.trim()) throw new Error('Broadcast message is required.');

    const payload = {
      title: data.title.trim(),
      message: data.message.trim(),
      type: data.type || 'system',
      severity: data.severity || 'info',
      role_filter: data.role_filter || data.targetRole || 'all'
    };

    if (api.getToken()) {
      try {
        const result = await api.post('/api/admin/notifications/broadcast', payload);
        notifySubscribers({ type: 'BROADCAST_SENT', payload: result });
        return result;
      } catch (err) {
        console.warn('[notificationService] Backend broadcast failed, falling back:', err.message);
      }
    }

    // Local fallback broadcast
    return this.addNotification({
      ...payload,
      targetRole: payload.role_filter
    });
  },

  /**
   * Add a new notification and broadcast to live subscribers
   */
  async addNotification(data) {
    if (!data.title || !data.title.trim()) throw new Error('Notification title is required.');
    if (!data.message || !data.message.trim()) throw new Error('Notification message is required.');

    const list = getStoredNotifications();
    const now = new Date().toISOString();

    const newNotification = {
      id: data.id || `ntf-${Date.now().toString().slice(-6)}`,
      type: data.type || 'system',
      priority: data.priority || 'normal',
      severity: data.severity || 'info',
      title: data.title.trim(),
      message: data.message.trim(),
      timestamp: data.timestamp || now,
      createdAt: data.timestamp || now,
      read: false,
      is_read: false,
      targetRole: data.targetRole || 'all',
      volunteerId: data.volunteerId || null,
      entityType: data.entityType || null,
      entityId: data.entityId || null,
      link: data.link || null
    };

    list.unshift(newNotification);
    setStoredNotifications(list);

    // Notify all active React UI subscribers immediately
    notifySubscribers({ type: 'NOTIFICATION_ADDED', notification: newNotification });

    return JSON.parse(JSON.stringify(newNotification));
  },

  /**
   * Delete a notification
   */
  async deleteNotification(id) {
    const list = getStoredNotifications();
    const filtered = list.filter((n) => String(n.id) !== String(id));
    if (filtered.length === list.length) return false;

    setStoredNotifications(filtered);
    notifySubscribers({ type: 'NOTIFICATION_DELETED', notificationId: id });
    return true;
  },

  /**
   * Reset store to initial fixtures
   */
  resetDevelopmentNotifications() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_NOTIFICATIONS));
    }
    notifySubscribers({ type: 'RESET' });
    return JSON.parse(JSON.stringify(INITIAL_DEV_NOTIFICATIONS));
  }
};

export default notificationService;
