/**
 * Notification Service (Stage 10)
 * 
 * Provides isolated frontend state management for disaster alerts,
 * assignment notices, volunteer responses, and verification updates.
 * 
 * Maps to future FastAPI endpoints in Stage 17:
 * - GET    /api/v1/notifications
 * - GET    /api/v1/notifications/unread-count
 * - PATCH  /api/v1/notifications/:id/read
 * - PATCH  /api/v1/notifications/:id/unread
 * - POST   /api/v1/notifications/mark-all-read
 * - DELETE /api/v1/notifications/:id
 * 
 * DO NOT make real API calls or connect to backend in Stage 10.
 */

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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_NOTIFICATIONS));
      return JSON.parse(JSON.stringify(INITIAL_DEV_NOTIFICATIONS));
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[notificationService] Error parsing localStorage notifications, resetting:', err);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_NOTIFICATIONS));
    return JSON.parse(JSON.stringify(INITIAL_DEV_NOTIFICATIONS));
  }
};

const setStoredNotifications = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('[notificationService] Error persisting notifications:', err);
  }
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
   */
  async getNotifications(options = {}) {
    const { role = 'all', volunteerId = null, type = 'ALL', unreadOnly = false, search = '' } = options;

    let list = getStoredNotifications();

    // Role filtering
    if (role === 'admin') {
      list = list.filter((n) => n.targetRole === 'admin' || n.targetRole === 'all');
    } else if (role !== 'all') {
      // Volunteer filtering
      list = list.filter((n) => {
        if (n.targetRole === 'admin') return false;
        if (n.targetRole === 'all') return true;
        // Scoped to volunteer
        if (volunteerId) {
          const target = (volunteerId === 'alex.rivera@skillbank.org' || volunteerId === 'dev-skl-002')
            ? 'dev-skl-002'
            : volunteerId;
          return !n.volunteerId || n.volunteerId === target;
        }
        return true;
      });
    }

    // Type filter
    if (type && type !== 'ALL') {
      list = list.filter((n) => n.type === type);
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
   * Retrieve unread notification count for a specific role/volunteer
   */
  async getUnreadCount(options = {}) {
    const list = await this.getNotifications({ ...options, unreadOnly: true });
    return list.length;
  },

  /**
   * Mark a specific notification as read
   */
  async markAsRead(id) {
    const list = getStoredNotifications();
    const index = list.findIndex((n) => n.id === id);
    if (index !== -1) {
      list[index].read = true;
      list[index].readAt = new Date().toISOString();
      setStoredNotifications(list);
      notifySubscribers({ type: 'READ_UPDATED', notificationId: id, read: true });
      return JSON.parse(JSON.stringify(list[index]));
    }
    return null;
  },

  /**
   * Mark a specific notification as unread
   */
  async markAsUnread(id) {
    const list = getStoredNotifications();
    const index = list.findIndex((n) => n.id === id);
    if (index !== -1) {
      list[index].read = false;
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
        isTarget = n.targetRole === 'all' || (n.targetRole === 'volunteer' && (!n.volunteerId || n.volunteerId === target));
      } else {
        isTarget = true;
      }

      if (isTarget && !n.read) {
        n.read = true;
        n.readAt = now;
      }
    });

    setStoredNotifications(list);
    notifySubscribers({ type: 'ALL_READ', role, volunteerId });
    return { success: true };
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
      id: `ntf-${Date.now().toString().slice(-6)}`,
      type: data.type || 'system',
      priority: data.priority || 'normal',
      title: data.title.trim(),
      message: data.message.trim(),
      timestamp: data.timestamp || now,
      read: false,
      targetRole: data.targetRole || 'all',
      volunteerId: data.volunteerId || null,
      entityType: data.entityType || null,
      entityId: data.entityId || null,
      link: data.link || null
    };

    list.unshift(newNotification);
    setStoredNotifications(list);

    // Notify all active React UI subscribers immediately without requiring a page refresh
    notifySubscribers({ type: 'NOTIFICATION_ADDED', notification: newNotification });

    return JSON.parse(JSON.stringify(newNotification));
  },

  /**
   * Delete a notification
   */
  async deleteNotification(id) {
    const list = getStoredNotifications();
    const filtered = list.filter((n) => n.id !== id);
    if (filtered.length === list.length) return false;

    setStoredNotifications(filtered);
    notifySubscribers({ type: 'NOTIFICATION_DELETED', notificationId: id });
    return true;
  },

  /**
   * Reset store to initial fixtures
   */
  resetDevelopmentNotifications() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_NOTIFICATIONS));
    notifySubscribers({ type: 'RESET' });
    return JSON.parse(JSON.stringify(INITIAL_DEV_NOTIFICATIONS));
  }
};

export default notificationService;
