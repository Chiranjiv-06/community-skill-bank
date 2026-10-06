import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import { communityService } from '../../services/communityService';
import { useAuth } from '../../context/AuthContext';
import { ACTIVITY_CATEGORIES } from '../../data/devActivities';
import { Users, Calendar, CheckCircle2, Clock, Search, Filter } from 'lucide-react';

export const ActivitiesPage = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [registeredIds, setRegisteredIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyMyActivities, setOnlyMyActivities] = useState(false);

  // Detail Modal
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const volunteerId = user?.id || 'dev-skl-002';

      const [allActivities, myJoined] = await Promise.all([
        communityService.getActivities(),
        communityService.getVolunteerActivities(volunteerId)
      ]);

      setActivities(allActivities);
      setRegisteredIds(new Set(myJoined.map((a) => a.id)));
    } catch (err) {
      console.error('[ActivitiesPage] Error loading community activities:', err);
      setError('Failed to load community activities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleJoin = async (activity) => {
    try {
      const volData = {
        id: user?.id || 'dev-skl-002',
        name: user?.name || 'Alex Rivera',
        email: user?.email || 'alex.rivera@skillbank.org'
      };
      await communityService.joinActivity(activity.id, volData);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to RSVP for activity.');
    }
  };

  const handleLeave = async (activity) => {
    if (window.confirm(`Are you sure you want to cancel your RSVP for "${activity.title}"?`)) {
      try {
        const volunteerId = user?.id || 'dev-skl-002';
        await communityService.leaveActivity(activity.id, volunteerId);
        await loadData();
      } catch (err) {
        alert(err.message || 'Failed to cancel RSVP.');
      }
    }
  };

  const handleViewDetails = async (activity) => {
    const fullActivity = await communityService.getActivityById(activity.id);
    setSelectedActivity(fullActivity || activity);
    setIsDetailOpen(true);
  };

  // Filtered activities
  const filteredActivities = activities.filter((act) => {
    if (onlyMyActivities && !registeredIds.has(act.id)) {
      return false;
    }
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

  const attendingCount = registeredIds.size;
  const scheduledCount = activities.filter((a) => a.status === 'scheduled').length;
  const inProgressCount = activities.filter((a) => a.status === 'in_progress').length;

  return (
    <div className="activities-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Header */}
      <PageHeader
        title="Community Activities & Resilience Drills"
        description="Participate in neighborhood sandbagging operations, tactical mesh radio field exercises, mass casualty triage workshops, and emergency shelter staging drives."
        actions={
          <Link to="/volunteer/my-activities">
            <Button variant="outline">
              <Calendar size={15} style={{ marginRight: '6px' }} />
              My Registered Activities ({attendingCount})
            </Button>
          </Link>
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
        <div
          onClick={() => {
            setOnlyMyActivities(false);
            setStatusFilter('ALL');
          }}
          style={{
            background: 'var(--color-surface)',
            border: !onlyMyActivities && statusFilter === 'ALL' ? '1px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Total Activities</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>
            {activities.length}
          </div>
        </div>

        <div
          onClick={() => setOnlyMyActivities(!onlyMyActivities)}
          style={{
            background: 'var(--color-surface)',
            border: onlyMyActivities ? '1px solid var(--color-success)' : '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-success)' }}>
            <CheckCircle2 size={15} />
            <span>My RSVPs (Attending)</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>
            {attendingCount}
          </div>
        </div>

        <div
          onClick={() => {
            setOnlyMyActivities(false);
            setStatusFilter('scheduled');
          }}
          style={{
            background: 'var(--color-surface)',
            border: !onlyMyActivities && statusFilter === 'scheduled' ? '1px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-primary)' }}>
            <Calendar size={15} />
            <span>Upcoming Scheduled</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px' }}>
            {scheduledCount}
          </div>
        </div>

        <div
          onClick={() => {
            setOnlyMyActivities(false);
            setStatusFilter('in_progress');
          }}
          style={{
            background: 'var(--color-surface)',
            border: !onlyMyActivities && statusFilter === 'in_progress' ? '1px solid var(--color-warning)' : '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-warning)' }}>
            <Clock size={15} />
            <span>Happening Now</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-warning)', marginTop: '4px' }}>
            {inProgressCount}
          </div>
        </div>
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
            placeholder="Search activities by keyword, location, or organizer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ width: '220px' }}>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Activity Categories' },
              ...ACTIVITY_CATEGORIES.map((c) => ({ value: c, label: c }))
            ]}
          />
        </div>

        <div style={{ width: '180px' }}>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setOnlyMyActivities(false);
            }}
            options={[
              { value: 'ALL', label: 'All Lifecycle Statuses' },
              { value: 'scheduled', label: 'Scheduled Only' },
              { value: 'in_progress', label: 'In Progress Only' },
              { value: 'completed', label: 'Completed Only' }
            ]}
          />
        </div>
      </div>

      {/* Content Area */}
      {loading && <LoadingState message="Loading community resilience activities..." />}

      {error && (
        <ErrorState
          title="Could Not Load Activities"
          message={error}
          onRetry={loadData}
        />
      )}

      {!loading && !error && filteredActivities.length === 0 && (
        <EmptyState
          title="No Community Activities Found"
          message={
            onlyMyActivities
              ? 'You have not RSVPed to any community activities yet. Browse the activities catalog and click "Join Activity" to register.'
              : 'No activities matched your search and filter criteria.'
          }
          action={
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('ALL');
                setCategoryFilter('ALL');
                setSearchQuery('');
                setOnlyMyActivities(false);
              }}
            >
              Reset All Filters
            </Button>
          }
        />
      )}

      {!loading && !error && filteredActivities.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
            gap: 'var(--spacing-md)'
          }}
        >
          {filteredActivities.map((act) => (
            <ActivityCard
              key={act.id}
              activity={act}
              isRegistered={registeredIds.has(act.id)}
              isAdmin={false}
              onViewDetails={handleViewDetails}
              onJoin={handleJoin}
              onLeave={handleLeave}
            />
          ))}
        </div>
      )}

      {/* Activity Detail Modal */}
      <ActivityDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        activity={selectedActivity}
        isRegistered={selectedActivity ? registeredIds.has(selectedActivity.id) : false}
        isAdmin={false}
        onJoin={handleJoin}
        onLeave={handleLeave}
      />
    </div>
  );
};

export default ActivitiesPage;
