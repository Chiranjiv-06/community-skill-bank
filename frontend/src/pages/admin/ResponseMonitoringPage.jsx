import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Flame,
  Users2,
  Clock,
  Search,
  CheckCircle2,
  Navigation,
  CheckCircle,
  AlertTriangle,
  Radio,
  MapPin,
  RefreshCw
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import LoadingState from '../../components/states/LoadingState';
import EmptyState from '../../components/states/EmptyState';
import AssignmentStatusBadge from '../../components/assignment/AssignmentStatusBadge';
import assignmentService from '../../services/assignmentService';
import emergencyService from '../../services/emergencyService';
import {
  ASSIGNMENT_STATUSES,
  ASSIGNMENT_STATUS_LABELS
} from '../../data/devAssignments';

export const ResponseMonitoringPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [emergencyFilter, setEmergencyFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMonitoringData = async () => {
    setIsRefreshing(true);
    try {
      const [asgList, emgList] = await Promise.all([
        assignmentService.getAssignments(),
        emergencyService.getEmergencies()
      ]);
      setAssignments(asgList);
      setEmergencies(emgList);
    } catch (err) {
      console.error('[ResponseMonitoringPage] Error loading telemetry:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (emergencyFilter !== 'ALL' && a.emergencyId !== emergencyFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchesEmg = a.emergencyTitle?.toLowerCase().includes(q);
        const matchesVol = a.volunteerName?.toLowerCase().includes(q);
        const matchesSkill = a.skill?.toLowerCase().includes(q);
        const matchesArea = a.stagingArea?.toLowerCase().includes(q);
        if (!matchesEmg && !matchesVol && !matchesSkill && !matchesArea) return false;
      }
      return true;
    });
  }, [assignments, searchQuery, statusFilter, emergencyFilter]);

  // Aggregate telemetry metrics
  const telemetry = useMemo(() => {
    const total = assignments.length;
    const inProgress = assignments.filter((a) => a.status === 'in_progress').length;
    const accepted = assignments.filter((a) => a.status === 'accepted').length;
    const completed = assignments.filter((a) => a.status === 'completed').length;
    const awaiting = assignments.filter((a) => a.status === 'assigned').length;
    return { total, inProgress, accepted, completed, awaiting };
  }, [assignments]);

  if (isLoading) {
    return <LoadingState message="Connecting to incident telemetry & monitoring field responses..." minHeight="380px" />;
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <PageHeader
        title="Field Response Operations Monitoring"
        subtitle="Live tactical operations board tracking field check-ins, responder transit, on-scene progress, and completed missions."
        badge={<Badge variant="primary" pulse><span className="status-dot" /> Live Monitoring Active</Badge>}
        icon={<Activity size={24} color="var(--color-primary)" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMonitoringData}
            isLoading={isRefreshing}
            icon={<RefreshCw size={15} />}
          >
            Refresh Telemetry
          </Button>
        }
      />

      {/* Telemetry Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)'
        }}
      >
        <Card style={{ padding: 'var(--space-4)', borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              On-Scene Active
            </span>
            <Navigation size={18} color="var(--color-primary)" />
          </div>
          <strong style={{ fontSize: 'var(--font-2xl)', color: 'var(--text-primary)' }}>
            {telemetry.inProgress} Responders
          </strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
            Currently executing operational tasks
          </span>
        </Card>

        <Card style={{ padding: 'var(--space-4)', borderLeft: '4px solid var(--color-info)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Accepted & En Route
            </span>
            <CheckCircle2 size={18} color="var(--color-info)" />
          </div>
          <strong style={{ fontSize: 'var(--font-2xl)', color: 'var(--text-primary)' }}>
            {telemetry.accepted} Responders
          </strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
            Mobilized and transit to staging area
          </span>
        </Card>

        <Card style={{ padding: 'var(--space-4)', borderLeft: '4px solid var(--color-warning)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Pending Response
            </span>
            <Clock size={18} color="var(--color-warning)" />
          </div>
          <strong style={{ fontSize: 'var(--font-2xl)', color: 'var(--text-primary)' }}>
            {telemetry.awaiting} Dispatches
          </strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
            Awaiting volunteer acceptance
          </span>
        </Card>

        <Card style={{ padding: 'var(--space-4)', borderLeft: '4px solid var(--color-success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Missions Completed
            </span>
            <CheckCircle size={18} color="var(--color-success)" />
          </div>
          <strong style={{ fontSize: 'var(--font-2xl)', color: 'var(--text-primary)' }}>
            {telemetry.completed} Missions
          </strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
            Concluded with filed field reports
          </span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-4)',
            alignItems: 'center'
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Input
              placeholder="Search responder, incident, or staging post..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginBottom: 0, paddingLeft: '36px' }}
            />
            <Search
              size={16}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ marginBottom: 0 }}
              options={[
                { value: 'ALL', label: 'All Operations Statuses' },
                ...ASSIGNMENT_STATUSES.map((st) => ({
                  value: st,
                  label: `Status: ${ASSIGNMENT_STATUS_LABELS[st] || st}`
                }))
              ]}
            />
          </div>

          {/* Emergency Filter */}
          <div>
            <Select
              value={emergencyFilter}
              onChange={(e) => setEmergencyFilter(e.target.value)}
              style={{ marginBottom: 0 }}
              options={[
                { value: 'ALL', label: 'All Active Sectors' },
                ...emergencies.map((emg) => ({
                  value: emg.id,
                  label: emg.title
                }))
              ]}
            />
          </div>

          {/* Counter */}
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Monitoring <strong>{filteredAssignments.length}</strong> active telemetry feeds</span>
            {(searchQuery || statusFilter !== 'ALL' || emergencyFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setEmergencyFilter('ALL');
                }}
                style={{ fontSize: 'var(--font-xs)' }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Responder Telemetry Board */}
      {filteredAssignments.length === 0 ? (
        <EmptyState
          icon={<Radio size={32} color="var(--text-muted)" />}
          title="No field response telemetry matching filters"
          description="There are currently no active field deployments matching the specified query or sector filters."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setEmergencyFilter('ALL');
              }}
            >
              Clear Telemetry Filters
            </Button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          {filteredAssignments.map((asg) => (
            <Card key={asg.id} style={{ padding: 'var(--space-5)' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                  <AssignmentStatusBadge status={asg.status} />
                  <strong style={{ fontSize: 'var(--font-base)', color: 'var(--text-primary)' }}>
                    {asg.volunteerName}
                  </strong>
                  <Badge variant="info">
                    {asg.skill} ({asg.proficiency})
                  </Badge>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                    Phone: {asg.volunteerPhone}
                  </span>
                </div>

                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                  Incident ID: <strong>{asg.emergencyId}</strong>
                </span>
              </div>

              {/* Emergency and Staging Details */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: 'var(--space-3)',
                  marginBottom: 'var(--space-3)',
                  fontSize: 'var(--font-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-critical)' }}>
                  <Flame size={15} />
                  <strong style={{ color: 'var(--text-primary)' }}>{asg.emergencyTitle}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)' }}>
                  <MapPin size={15} />
                  <span>Staging: {asg.stagingArea}</span>
                </div>
              </div>

              {/* Instructions */}
              <div
                style={{
                  padding: 'var(--space-3)',
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-xs)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-3)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <strong>Operational Briefing:</strong> {asg.instructions}
              </div>

              {/* Live Status Telemetry Feeds */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {asg.responseInfo && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: 'var(--font-xs)',
                      padding: 'var(--space-2) var(--space-3)',
                      background: 'rgba(59, 130, 246, 0.08)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <CheckCircle2 size={14} color="var(--color-info)" />
                    <div>
                      <strong style={{ color: 'var(--color-info)' }}>Response Telemetry:</strong>{' '}
                      Accepted at {new Date(asg.responseInfo.respondedAt).toLocaleTimeString()}
                      {asg.responseInfo.notes ? ` • Note: "${asg.responseInfo.notes}"` : ''}
                    </div>
                  </div>
                )}

                {asg.inProgressInfo && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: 'var(--font-xs)',
                      padding: 'var(--space-2) var(--space-3)',
                      background: 'rgba(249, 115, 22, 0.08)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <Navigation size={14} color="var(--color-primary)" />
                    <div>
                      <strong style={{ color: 'var(--color-primary)' }}>On-Scene Progress:</strong>{' '}
                      Commenced at {new Date(asg.inProgressInfo.startedAt).toLocaleTimeString()}
                      {asg.inProgressInfo.notes ? ` • Update: "${asg.inProgressInfo.notes}"` : ''}
                    </div>
                  </div>
                )}

                {asg.completionInfo && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: 'var(--font-xs)',
                      padding: 'var(--space-2) var(--space-3)',
                      background: 'var(--color-success-bg)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <CheckCircle size={14} color="var(--color-success)" />
                    <div>
                      <strong style={{ color: 'var(--color-success)' }}>Mission Concluded:</strong>{' '}
                      Completed at {new Date(asg.completionInfo.completedAt).toLocaleTimeString()}
                      {asg.completionInfo.completionNotes ? ` • Report: "${asg.completionInfo.completionNotes}"` : ''}
                    </div>
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

export default ResponseMonitoringPage;
