import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Flame,
  MapPin,
  Calendar,
  FileText,
  Navigation,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Activity
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingState from '../../components/states/LoadingState';
import EmptyState from '../../components/states/EmptyState';
import AssignmentStatusBadge from '../../components/assignment/AssignmentStatusBadge';
import AssignmentLifecycleTracker from '../../components/assignment/AssignmentLifecycleTracker';
import { useAuth } from '../../context/AuthContext';
import assignmentService from '../../services/assignmentService';

export const MyResponsesPage = () => {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const volunteerId = currentUser?.id || 'dev-skl-002';

  useEffect(() => {
    const fetchResponses = async () => {
      setIsLoading(true);
      try {
        const list = await assignmentService.getAssignmentsForVolunteer(volunteerId);
        // Responses are assignments that have been responded to (accepted, in_progress, completed)
        const responded = list.filter((a) => ['accepted', 'in_progress', 'completed'].includes(a.status));
        setAssignments(responded);
      } catch (err) {
        console.error('[MyResponsesPage] Error fetching responses:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResponses();
  }, [volunteerId]);

  const summary = useMemo(() => {
    const total = assignments.length;
    const completed = assignments.filter((a) => a.status === 'completed').length;
    const active = assignments.filter((a) => a.status === 'in_progress').length;
    const accepted = assignments.filter((a) => a.status === 'accepted').length;
    return { total, completed, active, accepted };
  }, [assignments]);

  if (isLoading) {
    return <LoadingState message="Loading your deployment history & field response log..." minHeight="380px" />;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Page Header */}
      <PageHeader
        title="My Response Deployments & Field Log"
        subtitle="Track past and ongoing emergency deployments, staging check-in records, field logs, and response participation."
        icon={<CheckCircle2 size={24} color="var(--color-success)" />}
        actions={
          <Link to="/volunteer/assignments">
            <Button variant="primary" size="sm" endIcon={<ArrowRight size={14} />}>
              Active Assignments
            </Button>
          </Link>
        }
      />

      {/* Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)'
        }}
      >
        <Card style={{ padding: 'var(--space-4)', borderLeft: '4px solid var(--color-success)' }}>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
            Completed Missions
          </span>
          <strong style={{ fontSize: 'var(--font-2xl)', color: 'var(--text-primary)' }}>
            {summary.completed}
          </strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
            Verified operational completions
          </span>
        </Card>

        <Card style={{ padding: 'var(--space-4)', borderLeft: '4px solid var(--color-primary)' }}>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
            Currently In Progress
          </span>
          <strong style={{ fontSize: 'var(--font-2xl)', color: 'var(--text-primary)' }}>
            {summary.active}
          </strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
            Active on-scene response
          </span>
        </Card>

        <Card style={{ padding: 'var(--space-4)', borderLeft: '4px solid var(--color-info)' }}>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
            En Route / Accepted
          </span>
          <strong style={{ fontSize: 'var(--font-2xl)', color: 'var(--text-primary)' }}>
            {summary.accepted}
          </strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
            Mobilized to staging post
          </span>
        </Card>
      </div>

      {/* Deployment Timeline Stream */}
      {assignments.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={32} color="var(--text-muted)" />}
          title="No response deployments recorded yet"
          description="When you accept emergency assignments and deploy to field incidents, your mission participation and field reports will be archived here."
          action={
            <Link to="/volunteer/assignments">
              <Button variant="primary" size="sm">
                View Assignments
              </Button>
            </Link>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          {assignments.map((asg) => (
            <Card key={asg.id} style={{ padding: 'var(--space-5)' }}>
              {/* Top Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-3)',
                  flexWrap: 'wrap',
                  gap: 'var(--space-2)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <AssignmentStatusBadge status={asg.status} />
                  <strong style={{ fontSize: 'var(--font-lg)', color: 'var(--text-primary)' }}>
                    {asg.emergencyTitle}
                  </strong>
                </div>

                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} />
                  <span>
                    {new Date(asg.createdTime).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Sector & Skill Badges */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  marginBottom: 'var(--space-3)',
                  flexWrap: 'wrap',
                  fontSize: 'var(--font-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)' }}>
                  <MapPin size={15} />
                  <span>{asg.stagingArea}</span>
                </div>
                <Badge variant="info">
                  Skill Deployed: {asg.skill} ({asg.proficiency})
                </Badge>
              </div>

              {/* Lifecycle Progress */}
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <AssignmentLifecycleTracker assignment={asg} />
              </div>

              {/* Telemetry and Notes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-xs)' }}>
                {asg.responseInfo?.notes && (
                  <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'rgba(59, 130, 246, 0.08)', borderRadius: 'var(--radius-sm)' }}>
                    <strong style={{ color: 'var(--color-info)' }}>Response Dispatch Note:</strong> {asg.responseInfo.notes}
                  </div>
                )}

                {asg.inProgressInfo?.notes && (
                  <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'rgba(249, 115, 22, 0.08)', borderRadius: 'var(--radius-sm)' }}>
                    <strong style={{ color: 'var(--color-primary)' }}>On-Scene Telemetry:</strong> {asg.inProgressInfo.notes}
                  </div>
                )}

                {asg.completionInfo?.completionNotes && (
                  <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-success-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-success-border)' }}>
                    <strong style={{ color: 'var(--color-success)' }}>Mission Field Report:</strong> {asg.completionInfo.completionNotes}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyResponsesPage;
