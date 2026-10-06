import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/states/EmptyState';
import LoadingState from '../../components/states/LoadingState';
import ErrorState from '../../components/states/ErrorState';
import ActivityCard from '../../components/community/ActivityCard';
import ActivityDetailModal from '../../components/community/ActivityDetailModal';
import ActivityFormModal from '../../components/community/ActivityFormModal';
import { communityService } from '../../services/communityService';
import { ACTIVITY_CATEGORIES, ACTIVITY_STATUSES } from '../../data/devActivities';
import { CalendarDays, Plus, Calendar, Clock, CheckCircle2, Users, RefreshCw } from 'lucide-react';

export const AdminActivitiesPage = () => {
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [list, st] = await Promise.all([
        communityService.getActivities(),
        communityService.getActivityStats()
      ]);
      setActivities(list);
      setStats(st);
    } catch (err) {
      console.error('[AdminActivitiesPage] Error loading activities:', err);
      setError('Failed to load community activities administration data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNew = () => {
    setEditingActivity(null);
    setIsFormOpen(true);
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    if (editingActivity) {
      await communityService.updateActivity(editingActivity.id, formData);
    } else {
      await communityService.createActivity(formData);
    }
    await loadData();
  };

  const handleStatusChange = async (activityId, newStatus) => {
    try {
      await communityService.updateActivityStatus(activityId, newStatus);
      await loadData();
      if (selectedActivity && selectedActivity.id === activityId) {
        const refreshed = await communityService.getActivityById(activityId);
        setSelectedActivity(refreshed);
      }
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const handleAttendanceChange = async (activityId, participantId, status, hours) => {
    try {
      await communityService.updateParticipantAttendance(activityId, participantId, { status, hours });
      const refreshed = await communityService.getActivityById(activityId);
      setSelectedActivity(refreshed);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to update attendance.');
    }
  };

  const handleDelete = async (activity) => {
    if (window.confirm(`Are you sure you want to permanently delete "${activity.title}"?`)) {
      try {
        await communityService.deleteActivity(activity.id);
        await loadData();
      } catch (err) {
        alert(err.message || 'Failed to delete activity.');
      }
    }
  };

  const handleViewDetails = async (activity) => {
    const full = await communityService.getActivityById(activity.id);
    setSelectedActivity(full || activity);
    setIsDetailOpen(true);
  };

  // Filtered
  const filteredActivities = activities.filter((act) => {
    if (statusFilter !== 'ALL' && act.status !== statusFilter) {
      return false;
    }
    if (categoryFilter !== 'ALL' && act.category !== categoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = act.title?.toLowerCase().includes(q);
      const matchDesc = act.description?.toLowerCase().includes(q);
      const matchLoc = act.location?.toLowerCase().includes(q);
      const matchOrg = act.organizer?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc && !matchOrg) return false;
    }
    return true;
  });

  return (
    <div className="admin-activities-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Header */}
      <PageHeader
        title="Community Activities Administration"
        description="Schedule disaster preparedness workshops, city-wide drill events, and track volunteer participation rosters."
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="outline" onClick={loadData}>
              <RefreshCw size={15} style={{ marginRight: '6px' }} />
              Refresh
            </Button>
            <Button variant="primary" onClick={handleCreateNew}>
              <Plus size={16} style={{ marginRight: '6px' }} />
              Schedule New Activity
            </Button>
          </div>
        }
      />

      {/* KPI Counters */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--spacing-md)'
          }}
        >
          <div
            onClick={() => setStatusFilter('ALL')}
            style={{
              background: 'var(--color-surface)',
              border: statusFilter === 'ALL' ? '1px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Total Activities</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {stats.totalActivities}
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('scheduled')}
            style={{
              background: 'var(--color-surface)',
              border: statusFilter === 'scheduled' ? '1px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-primary)' }}>
              <Calendar size={15} />
              <span>Scheduled Drives</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px' }}>
              {stats.scheduled}
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('in_progress')}
            style={{
              background: 'var(--color-surface)',
              border: statusFilter === 'in_progress' ? '1px solid var(--color-warning)' : '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-warning)' }}>
              <Clock size={15} />
              <span>Active In Progress</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-warning)', marginTop: '4px' }}>
              {stats.inProgress}
            </div>
          </div>

          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-success)' }}>
              <Users size={15} />
              <span>Total Volunteer RSVPs</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>
              {stats.totalRegistrations}
            </div>
          </div>
        </div>
      )}

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
            placeholder="Search activities by title, location, or coordinator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ width: '220px' }}>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Categories' },
              ...ACTIVITY_CATEGORIES.map((c) => ({ value: c, label: c }))
            ]}
          />
        </div>

        <div style={{ width: '180px' }}>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              ...ACTIVITY_STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ').toUpperCase() }))
            ]}
          />
        </div>
      </div>

      {/* Content Area */}
      {loading && <LoadingState message="Loading community activity schedules & rosters..." />}

      {error && (
        <ErrorState
          title="Could Not Load Activities"
          message={error}
          onRetry={loadData}
        />
      )}

      {!loading && !error && filteredActivities.length === 0 && (
        <EmptyState
          title="No Activities Scheduled"
          message="No community activities matched your filter criteria."
          action={
            <Button variant="primary" onClick={handleCreateNew}>
              <Plus size={16} style={{ marginRight: '6px' }} />
              Schedule First Activity
            </Button>
          }
        />
      )}

      {!loading && !error && filteredActivities.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
            gap: 'var(--spacing-md)'
          }}
        >
          {filteredActivities.map((act) => (
            <ActivityCard
              key={act.id}
              activity={act}
              isRegistered={false}
              isAdmin={true}
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Admin Form Modal */}
      <ActivityFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        activity={editingActivity}
      />

      {/* Detail Modal */}
      <ActivityDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        activity={selectedActivity}
        isAdmin={true}
        onStatusChange={handleStatusChange}
        onAttendanceChange={handleAttendanceChange}
      />
    </div>
  );
};

export default AdminActivitiesPage;
