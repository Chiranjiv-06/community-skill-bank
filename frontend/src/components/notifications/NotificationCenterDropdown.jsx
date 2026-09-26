import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Badge from '../common/Badge';
import Button from '../common/Button';
import NotificationItem from './NotificationItem';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  CheckCheck,
  Radio,
  ExternalLink,
  Flame,
  ClipboardList,
  Sparkles,
  X
} from 'lucide-react';

/**
 * Topbar Notification Center Dropdown Popover
 */
export const NotificationCenterDropdown = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    connectionState,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    simulateEvent
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'EMERGENCY' | 'ASSIGNMENT'
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.read;
    if (filter === 'EMERGENCY') return n.type === 'emergency';
    if (filter === 'ASSIGNMENT') return n.type === 'assignment';
    return true;
  });

  const fullConsoleLink = role === 'admin' ? '/admin/notifications' : '/volunteer/notifications';

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Alerts & Real-Time Notifications"
        style={{
          background: 'none',
          border: 'none',
          color: isOpen ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <Bell size={20} />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              minWidth: '18px',
              height: '18px',
              borderRadius: '9px',
              background: 'var(--color-critical)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid var(--color-surface)',
              animation: 'pulse 2s infinite'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '380px',
            maxWidth: '90vw',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--color-border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--color-surface-hover)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                  Notifications & Alerts
                </span>
                {unreadCount > 0 && (
                  <Badge variant="critical" style={{ fontSize: '10px' }}>
                    {unreadCount} new
                  </Badge>
                )}
              </div>

              {/* Simulated Real-Time Connection Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px', fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: connectionState.status === 'dev_connected' ? 'var(--color-success)' : 'var(--color-warning)'
                  }}
                />
                <span>{connectionState.label}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <CheckCheck size={14} />
                  <span>Mark Read</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              padding: '8px 12px',
              borderBottom: '1px solid var(--color-border-subtle)',
              background: 'var(--color-surface)',
              overflowX: 'auto'
            }}
          >
            {['ALL', 'UNREAD', 'EMERGENCY', 'ASSIGNMENT'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                style={{
                  background: filter === tab ? 'var(--color-primary)' : 'var(--color-surface-hover)',
                  color: filter === tab ? '#fff' : 'var(--color-text-secondary)',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab === 'ALL'
                  ? `All (${notifications.length})`
                  : tab === 'UNREAD'
                  ? `Unread (${unreadCount})`
                  : tab === 'EMERGENCY'
                  ? 'Emergencies'
                  : 'Assignments'}
              </button>
            ))}
          </div>

          {/* Notifications Scroll List */}
          <div
            style={{
              maxHeight: '340px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {filteredNotifications.length === 0 ? (
              <div
                style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.85rem'
                }}
              >
                No notifications in this view.
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onMarkRead={markAsRead}
                  onMarkUnread={markAsUnread}
                  onDelete={deleteNotification}
                  onCloseDropdown={() => setIsOpen(false)}
                />
              ))
            )}
          </div>

          {/* Footer & Live Simulation Trigger */}
          <div
            style={{
              padding: '10px 14px',
              borderTop: '1px solid var(--color-border-subtle)',
              background: 'var(--color-surface-hover)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.82rem'
            }}
          >
            {/* Simulation Shortcut for Dev Testing */}
            <button
              type="button"
              onClick={() => {
                simulateEvent('emergency');
              }}
              title="Trigger simulated real-time event"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600
              }}
            >
              <Sparkles size={12} />
              <span>Simulate Alert</span>
            </button>

            <Link
              to={fullConsoleLink}
              onClick={() => setIsOpen(false)}
              style={{
                color: 'var(--color-text-primary)',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>View All Alerts</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenterDropdown;
