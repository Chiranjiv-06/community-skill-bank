import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import EmptyState from '../../components/states/EmptyState';
import LoadingState from '../../components/states/LoadingState';
import NotificationItem from '../../components/notifications/NotificationItem';
import { useNotifications } from '../../context/NotificationContext';
import { NOTIFICATION_TYPES } from '../../data/devNotifications';
import {
  Bell,
  CheckCheck,
  Radio,
  Sparkles,
  Flame,
  ClipboardList,
  Award,
  Calendar,
  Search,
  RefreshCw
} from 'lucide-react';

export const NotificationsPage = () => {
  const {
    notifications,
    unreadCount,
    connectionState,
    loading,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    simulateEvent,
    refreshNotifications
  } = useNotifications();

  const [typeFilter, setTypeFilter] = useState('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotifications = notifications.filter((n) => {
    if (unreadOnly && n.read) return false;
    if (typeFilter !== 'ALL' && n.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = n.title?.toLowerCase().includes(q);
      const matchMsg = n.message?.toLowerCase().includes(q);
      const matchType = n.type?.toLowerCase().includes(q);
      if (!matchTitle && !matchMsg && !matchType) return false;
    }
    return true;
  });

  return (
    <div className="notifications-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Header */}
      <PageHeader
        title="Alerts & Real-Time Notifications"
        description="Live incident dispatch notifications, tactical mobilization alerts, certification clearances, and community drill notices."
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="outline" onClick={refreshNotifications}>
              <RefreshCw size={15} style={{ marginRight: '6px' }} />
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button variant="primary" onClick={markAllAsRead}>
                <CheckCheck size={16} style={{ marginRight: '6px' }} />
                Mark All as Read ({unreadCount})
              </Button>
            )}
          </div>
        }
      />

      {/* Real-Time WebSocket Architecture Status Banner */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: connectionState.status === 'dev_connected' ? 'var(--color-success)' : 'var(--color-warning)',
              animation: 'pulse 2s infinite'
            }}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
              Real-Time Event Stream: {connectionState.label}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              WebSocket-Ready Architecture: Events broadcast reactively across components without page refresh.
            </div>
          </div>
        </div>

        <Badge variant={connectionState.status === 'dev_connected' ? 'success' : 'warning'}>
          {connectionState.status === 'dev_connected' ? 'Simulated Socket Active' : 'Connecting'}
        </Badge>
      </div>

      {/* Interactive Simulation Testing Controls */}
      <Card style={{ background: 'rgba(255, 107, 0, 0.04)', border: '1px dashed rgba(255, 107, 0, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.92rem', color: 'var(--color-text-primary)' }}>
              <Sparkles size={16} color="var(--color-primary)" />
              <span>Simulate Real-Time Incident Broadcasts & Dispatch Alerts</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Click any trigger below to simulate incoming real-time alerts. Observe immediate notification arrival and topbar badge increment.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => simulateEvent('emergency')}
            >
              <Flame size={13} style={{ marginRight: '4px', color: 'var(--color-critical)' }} />
              + Emergency Alert
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => simulateEvent('assignment')}
            >
              <ClipboardList size={13} style={{ marginRight: '4px', color: 'var(--color-primary)' }} />
              + Mission Dispatch
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => simulateEvent('certification')}
            >
              <Award size={13} style={{ marginRight: '4px', color: 'var(--color-success)' }} />
              + Credential Clear
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => simulateEvent('community')}
            >
              <Calendar size={13} style={{ marginRight: '4px', color: '#3b82f6' }} />
              + Community Drill
            </Button>
          </div>
        </div>
      </Card>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-md)',
          alignItems: 'center',
          flexWrap: 'wrap',
          background: 'var(--color-surface)',
          padding: '14px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-subtle)'
        }}
      >
        <div style={{ flex: 1, minWidth: '220px' }}>
          <Input
            placeholder="Search alerts by title or content keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ width: '180px' }}>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Alert Types' },
              { value: 'emergency', label: 'Emergencies' },
              { value: 'assignment', label: 'Assignments' },
              { value: 'certification', label: 'Certifications' },
              { value: 'community', label: 'Community' },
              { value: 'system', label: 'System' }
            ]}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            size="md"
            variant={unreadOnly ? 'primary' : 'outline'}
            onClick={() => setUnreadOnly(!unreadOnly)}
          >
            {unreadOnly ? 'Showing Unread Only' : `Unread (${unreadCount})`}
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading && <LoadingState message="Connecting to simulated notification event stream..." />}

      {!loading && filteredNotifications.length === 0 && (
        <EmptyState
          title="No Notifications Found"
          message={
            unreadOnly
              ? 'You have zero unread notifications. All alerts have been reviewed.'
              : 'No notifications matched your current filter criteria.'
          }
          action={
            <Button
              variant="outline"
              onClick={() => {
                setTypeFilter('ALL');
                setUnreadOnly(false);
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          }
        />
      )}

      {!loading && filteredNotifications.length > 0 && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredNotifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onMarkRead={markAsRead}
                onMarkUnread={markAsUnread}
                onDelete={deleteNotification}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default NotificationsPage;
