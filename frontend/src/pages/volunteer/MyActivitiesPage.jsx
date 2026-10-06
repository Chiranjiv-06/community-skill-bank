import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/states/EmptyState';
import LoadingState from '../../components/states/LoadingState';
import ErrorState from '../../components/states/ErrorState';
import ActivityCard from '../../components/community/ActivityCard';
import ActivityDetailModal from '../../components/community/ActivityDetailModal';
import { communityService } from '../../services/communityService';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Compass, CheckCircle2, Clock } from 'lucide-react';

export const MyActivitiesPage = () => {
  const { user } = useAuth();
  const [myActivities, setMyActivities] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Detail Modal
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadMyActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const volunteerId = user?.id || 'dev-skl-002';
      const [data, sum] = await Promise.all([
        communityService.getVolunteerActivities(volunteerId),
        communityService.getCommunitySummary()
      ]);
      setMyActivities(data);
      setSummary(sum);
    } catch (err) {
      console.error('[MyActivitiesPage] Error loading volunteer activities:', err);
      setError('Failed to load your activity registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyActivities();
  }, [user]);

  const handleLeave = async (activity) => {
    if (window.confirm(`Are you sure you want to cancel your RSVP for "${activity.title}"?`)) {
      try {
        const volunteerId = user?.id || 'dev-skl-002';
        await communityService.leaveActivity(activity.id, volunteerId);
        await loadMyActivities();
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

  const filtered = myActivities.filter((act) => {
    if (statusFilter !== 'ALL' && act.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const scheduledCount = myActivities.filter((a) => a.status === 'scheduled').length;
  const inProgressCount = myActivities.filter((a) => a.status === 'in_progress').length;
  const completedCount = myActivities.filter((a) => a.status === 'completed').length;

  return (
    <div className="my-activities-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Header */}
      <PageHeader
        title="My Activities & Deployments"
        description="View your confirmed RSVPs, enrolled disaster workshops, and scheduled community preparation drills."
        actions={
          <Link to="/volunteer/activities">
            <Button variant="primary">
              <Compass size={15} style={{ marginRight: '6px' }} />
              Browse All Activities
            </Button>
          </Link>
        }
      />

      {/* Status Counters */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--spacing-md)'
        }}
      >
        {summary && (
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px'
            }}
          >
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Verified Community Hours</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>
              {summary.totalCommunityHours || 0} hrs
            </div>
          </div>
        )}

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
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Total Confirmed RSVPs</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>
            {myActivities.length}
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
            <span>Upcoming Scheduled</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px' }}>
            {scheduledCount}
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
            <span>Active Today</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-warning)', marginTop: '4px' }}>
            {inProgressCount}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('completed')}
          style={{
            background: 'var(--color-surface)',
            border: statusFilter === 'completed' ? '1px solid var(--color-success)' : '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-success)' }}>
            <CheckCircle2 size={15} />
            <span>Attended / Concluded</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>
            {completedCount}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading && <LoadingState message="Loading your activity RSVPs..." />}

      {error && (
        <ErrorState
          title="Could Not Load My Activities"
          message={error}
          onRetry={loadMyActivities}
        />
      )}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          title="No Confirmed Activities Found"
          message={
            myActivities.length === 0
              ? 'You have not joined any community resilience events or disaster drills yet. Check out upcoming activities to participate.'
              : 'No activities matched the selected filter.'
          }
          action={
            myActivities.length === 0 ? (
              <Link to="/volunteer/activities">
                <Button variant="primary">
                  <Compass size={15} style={{ marginRight: '6px' }} />
                  Explore Community Activities
                </Button>
              </Link>
            ) : (
              <Button variant="outline" onClick={() => setStatusFilter('ALL')}>
                Reset Filter
              </Button>
            )
          }
        />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
            gap: 'var(--spacing-md)'
          }}
        >
          {filtered.map((act) => (
            <ActivityCard
              key={act.id}
              activity={act}
              isRegistered={true}
              isAdmin={false}
              onViewDetails={handleViewDetails}
              onLeave={handleLeave}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <ActivityDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        activity={selectedActivity}
        isRegistered={true}
        isAdmin={false}
        onLeave={handleLeave}
      />
    </div>
  );
};

export default MyActivitiesPage;
