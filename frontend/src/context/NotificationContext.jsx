import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { realtimeService } from '../services/realtimeService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user, role, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionState, setConnectionState] = useState(realtimeService.getConnectionState());
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const userRole = role === 'admin' ? 'admin' : 'volunteer';
      const volunteerId = user?.id || 'dev-skl-002';

      const [list, count] = await Promise.all([
        notificationService.getNotifications({ role: userRole, volunteerId }),
        notificationService.getUnreadCount({ role: userRole, volunteerId })
      ]);

      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.error('[NotificationContext] Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, role, user]);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to notification storage mutations
    const unsubscribeNotifications = notificationService.subscribe(() => {
      fetchNotifications();
    });

    // Subscribe to real-time events
    const unsubscribeRealtime = realtimeService.subscribe('*', () => {
      fetchNotifications();
    });

    // Subscribe to connection state changes
    const unsubscribeConnection = realtimeService.subscribe('CONNECTION_STATE_CHANGED', (state) => {
      setConnectionState(state);
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeRealtime();
      unsubscribeConnection();
    };
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    await notificationService.markAsRead(id);
    await fetchNotifications();
  };

  const markAsUnread = async (id) => {
    await notificationService.markAsUnread(id);
    await fetchNotifications();
  };

  const markAllAsRead = async () => {
    const userRole = role === 'admin' ? 'admin' : 'volunteer';
    const volunteerId = user?.id || 'dev-skl-002';
    await notificationService.markAllAsRead({ role: userRole, volunteerId });
    await fetchNotifications();
  };

  const deleteNotification = async (id) => {
    await notificationService.deleteNotification(id);
    await fetchNotifications();
  };

  const simulateEvent = async (type, customData = {}) => {
    switch (type) {
      case 'emergency':
        return realtimeService.simulateEmergencyAlert(customData);
      case 'assignment':
        return realtimeService.simulateAssignmentDispatch(customData);
      case 'volunteer_response':
        return realtimeService.simulateVolunteerResponse(customData);
      case 'certification':
        return realtimeService.simulateCertificationVerification(customData);
      case 'community':
        return realtimeService.simulateCommunityActivity(customData);
      default:
        return realtimeService.dispatchRealtimeEvent(customData);
    }
  };

  const changeConnectionState = (newStatus) => {
    const updated = realtimeService.setConnectionState(newStatus);
    setConnectionState(updated);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        connectionState,
        loading,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        deleteNotification,
        simulateEvent,
        changeConnectionState,
        refreshNotifications: fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
