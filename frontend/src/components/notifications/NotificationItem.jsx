import React from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../common/Badge';
import {
  Flame,
  AlertTriangle,
  ClipboardList,
  Calendar,
  Award,
  Info,
  CheckCircle2,
  Circle,
  Trash2,
  ExternalLink
} from 'lucide-react';

const getNotificationIcon = (type, priority) => {
  if (priority === 'critical') {
    return <Flame size={16} color="var(--color-critical)" />;
  }
  switch (type) {
    case 'emergency':
      return <AlertTriangle size={16} color="var(--color-critical)" />;
    case 'assignment':
      return <ClipboardList size={16} color="var(--color-primary)" />;
    case 'community':
      return <Calendar size={16} color="#3b82f6" />;
    case 'certification':
      return <Award size={16} color="var(--color-success)" />;
    case 'system':
    default:
      return <Info size={16} color="var(--color-text-muted)" />;
  }
};

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

/**
 * Reusable Notification Row Item
 */
export const NotificationItem = ({
  notification,
  onMarkRead,
  onMarkUnread,
  onDelete,
  onCloseDropdown = null
}) => {
  const navigate = useNavigate();

  if (!notification) return null;

  const handleClick = (e) => {
    // If clicking action buttons, don't trigger navigation
    if (e.target.closest('button')) return;

    if (!notification.read && onMarkRead) {
      onMarkRead(notification.id);
    }

    if (notification.link) {
      if (onCloseDropdown) onCloseDropdown();
      navigate(notification.link);
    }
  };

  const isCritical = notification.priority === 'critical';

  return (
    <div
      onClick={handleClick}
      className={`notification-item ${!notification.read ? 'is-unread' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 14px',
        borderRadius: 'var(--radius-sm)',
        background: !notification.read ? 'rgba(255, 107, 0, 0.05)' : 'transparent',
        borderLeft: !notification.read
          ? isCritical
            ? '3px solid var(--color-critical)'
            : '3px solid var(--color-primary)'
          : '3px solid transparent',
        borderBottom: '1px solid var(--color-border-subtle)',
        cursor: notification.link ? 'pointer' : 'default',
        transition: 'background 0.2s ease'
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'var(--color-surface-hover)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '2px'
        }}
      >
        {getNotificationIcon(notification.type, notification.priority)}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.88rem',
              fontWeight: !notification.read ? 700 : 600,
              color: 'var(--color-text-primary)',
              lineHeight: 1.3
            }}
          >
            {notification.title}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
            {formatRelativeTime(notification.timestamp)}
          </span>
        </div>

        <p
          style={{
            margin: '4px 0 0 0',
            fontSize: '0.82rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.4
          }}
        >
          {notification.message}
        </p>

        {/* Footer meta & actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Badge variant="neutral" style={{ fontSize: '10px', textTransform: 'capitalize' }}>
              {notification.type}
            </Badge>
            {notification.link && (
              <span style={{ fontSize: '0.74rem', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                <ExternalLink size={10} />
                <span>Open View</span>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {!notification.read ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead && onMarkRead(notification.id);
                }}
                title="Mark as read"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  fontSize: '0.74rem',
                  fontWeight: 600
                }}
              >
                Mark Read
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkUnread && onMarkUnread(notification.id);
                }}
                title="Mark as unread"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  fontSize: '0.74rem'
                }}
              >
                Mark Unread
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                title="Dismiss notification"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: '2px 4px'
                }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
