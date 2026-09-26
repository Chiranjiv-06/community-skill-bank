import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/states/EmptyState';
import LoadingState from '../../components/states/LoadingState';
import NotificationItem from '../../components/notifications/NotificationItem';
import { useNotifications } from '../../context/NotificationContext';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../../data/devNotifications';
import {
  Bell,
  CheckCheck,
  Radio,
  Send,
  Flame,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export const AdminNotificationsPage = () => {
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

  // Filters
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Broadcast Modal State
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    type: 'emergency',
    priority: 'critical',
    targetRole: 'all'
  });
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const filteredNotifications = notifications.filter((n) => {
    if (unreadOnly && n.read) return false;
    if (typeFilter !== 'ALL' && n.type !== typeFilter) return false;
    if (priorityFilter !== 'ALL' && n.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = n.title?.toLowerCase().includes(q);
      const matchMsg = n.message?.toLowerCase().includes(q);
      const matchType = n.type?.toLowerCase().includes(q);
      if (!matchTitle && !matchMsg && !matchType) return false;
    }
    return true;
  });

  const criticalCount = notifications.filter((n) => n.priority === 'critical').length;
  const emergencyCount = notifications.filter((n) => n.type === 'emergency').length;

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      alert('Please fill out all required broadcast fields.');
      return;
    }

    setIsBroadcasting(true);
    try {
      await simulateEvent(broadcastForm.type, {
        title: broadcastForm.title,
        message: broadcastForm.message,
        priority: broadcastForm.priority,
        targetRole: broadcastForm.targetRole,
        link: broadcastForm.type === 'emergency' ? '/admin/emergencies' : '/admin/assignments'
      });
      setIsBroadcasting(false);
      setIsBroadcastModalOpen(false);
      setBroadcastForm({
        title: '',
        message: '',
        type: 'emergency',
        priority: 'critical',
        targetRole: 'all'
      });
    } catch (err) {
      setIsBroadcasting(false);
      alert('Failed to dispatch broadcast.');
    }
  };

  return (
    <div className="admin-notifications-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Header */}
      <PageHeader
        title="Alert Broadcast & Incident Notification Console"
        description="Monitor command-level event streams, coordinate volunteer alerts, and dispatch operational notifications."
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="outline" onClick={refreshNotifications}>
              <RefreshCw size={15} style={{ marginRight: '6px' }} />
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                <CheckCheck size={16} style={{ marginRight: '6px' }} />
                Mark All Read
              </Button>
            )}
            <Button variant="primary" onClick={() => setIsBroadcastModalOpen(true)}>
              <Send size={15} style={{ marginRight: '6px' }} />
              Broadcast Emergency Alert
            </Button>
          </div>
        }
      />

      {/* KPI Counters */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--spacing-md)'
        }}
      >
        <div style={{ background: 'var(--color-surface)', padding: '16px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Total Logged Alerts</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>
            {notifications.length}
          </div>
        </div>

        <div style={{ background: 'var(--color-surface)', padding: '16px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-critical)' }}>Critical Priority</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-critical)', marginTop: '4px' }}>
            {criticalCount}
          </div>
        </div>

        <div style={{ background: 'var(--color-surface)', padding: '16px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)' }}>Emergency Incident Updates</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px' }}>
            {emergencyCount}
          </div>
        </div>

        <div style={{ background: 'var(--color-surface)', padding: '16px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-success)' }}>Unread Actions</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>
            {unreadCount}
          </div>
        </div>
      </div>

      {/* Connection State Info Banner */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={18} color="var(--color-primary)" />
          <span style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)' }}>
            Real-Time Transport: <strong style={{ color: 'var(--color-text-primary)' }}>{connectionState.label}</strong>
          </span>
        </div>
        <Badge variant={connectionState.status === 'dev_connected' ? 'success' : 'warning'}>
          {connectionState.status === 'dev_connected' ? 'Event Source Active' : 'Connecting'}
        </Badge>
      </div>

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
            placeholder="Search command alerts and notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ width: '180px' }}>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Categories' },
              { value: 'emergency', label: 'Emergencies' },
              { value: 'assignment', label: 'Assignments' },
              { value: 'certification', label: 'Certifications' },
              { value: 'community', label: 'Community' },
              { value: 'system', label: 'System' }
            ]}
          />
        </div>

        <div style={{ width: '180px' }}>
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Priorities' },
              { value: 'critical', label: 'Critical' },
              { value: 'high', label: 'High' },
              { value: 'normal', label: 'Normal' },
              { value: 'info', label: 'Info' }
            ]}
          />
        </div>

        <Button
          size="md"
          variant={unreadOnly ? 'primary' : 'outline'}
          onClick={() => setUnreadOnly(!unreadOnly)}
        >
          {unreadOnly ? 'Showing Unread' : `Unread (${unreadCount})`}
        </Button>
      </div>

      {/* Content */}
      {loading && <LoadingState message="Loading command notification console..." />}

      {!loading && filteredNotifications.length === 0 && (
        <EmptyState
          title="No Alerts Found"
          message="No command alerts matched the selected filters."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setTypeFilter('ALL');
                setPriorityFilter('ALL');
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

      {/* Broadcast Alert Modal */}
      <Modal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        title="Broadcast Emergency Notification"
        size="md"
      >
        <form onSubmit={handleBroadcastSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
            Compose and broadcast an operational dispatch alert to volunteer consoles via the real-time event adapter.
          </p>

          <Input
            label="Alert Title *"
            placeholder="e.g. URGENT: Sector 4 Flood Evacuation Advisory"
            value={broadcastForm.title}
            onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <Select
              label="Notification Category"
              value={broadcastForm.type}
              onChange={(e) => setBroadcastForm({ ...broadcastForm, type: e.target.value })}
              options={[
                { value: 'emergency', label: 'Emergency Incident' },
                { value: 'assignment', label: 'Assignment Dispatch' },
                { value: 'community', label: 'Community Drill' },
                { value: 'certification', label: 'Credential Notice' }
              ]}
            />

            <Select
              label="Priority Level"
              value={broadcastForm.priority}
              onChange={(e) => setBroadcastForm({ ...broadcastForm, priority: e.target.value })}
              options={[
                { value: 'critical', label: 'Critical Priority' },
                { value: 'high', label: 'High Priority' },
                { value: 'normal', label: 'Normal Priority' },
                { value: 'info', label: 'Informational' }
              ]}
            />
          </div>

          <Textarea
            label="Alert Message Body *"
            placeholder="Provide specific operational instructions, designated staging sectors, or mobilization directives..."
            rows={3}
            value={broadcastForm.message}
            onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: 'var(--spacing-sm)' }}>
            <Button variant="outline" type="button" onClick={() => setIsBroadcastModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isBroadcasting}>
              <Send size={15} style={{ marginRight: '6px' }} />
              {isBroadcasting ? 'Broadcasting...' : 'Broadcast to Consoles'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminNotificationsPage;
