import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Flame,
  Users2,
  GitMerge,
  BarChart3,
  Cpu,
  ArrowRight,
  Plus,
  Radio,
  Clock,
  AlertCircle,
  Activity,
  CheckCircle2,
  FileCheck2,
  Map
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import SummaryCard from '../../components/dashboard/SummaryCard';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import SectionHeader from '../../components/common/SectionHeader';
import { MOCK_STATISTICS, MOCK_EMERGENCIES, MOCK_NOTIFICATIONS } from '../../data/mockData';

export const AdminDashboard = () => {
  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title="Incident Command Center"
        subtitle="Disaster & Emergency Resource Orchestration System"
        badge={<Badge variant="critical">Emergency Operations Active</Badge>}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Link to="/admin/simulations">
              <Button variant="outline" size="sm" icon={<Cpu size={15} />}>
                Run Drill Simulation
              </Button>
            </Link>
            <Link to="/admin/emergencies">
              <Button variant="primary" size="sm" icon={<Plus size={15} />}>
                Create Incident Dispatch
              </Button>
            </Link>
          </div>
        }
      />

      {/* 1. SUMMARY CARDS AREA */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)'
        }}
      >
        <SummaryCard
          title="Active Emergencies"
          value={MOCK_STATISTICS.activeEmergencies}
          subtitle="1 Critical · 1 High · 1 Moderate"
          icon={<Flame size={20} color="var(--color-critical)" />}
          badge={<Badge variant="critical">Critical</Badge>}
        />
        <SummaryCard
          title="Field Deployments"
          value={MOCK_STATISTICS.activeDeployments}
          subtitle="Volunteers currently on-scene"
          icon={<Users2 size={20} />}
          badge={<Badge variant="success">Dispatched</Badge>}
        />
        <SummaryCard
          title="Avg. Match Latency"
          value={`${MOCK_STATISTICS.averageResponseMinutes}m`}
          subtitle="Target threshold: <15 min"
          icon={<Clock size={20} />}
        />
        <SummaryCard
          title="Readiness Index"
          value={MOCK_STATISTICS.readinessRate}
          subtitle="Calculated over 86 skill types"
          icon={<Activity size={20} />}
          badge={<Badge variant="primary">Optimal</Badge>}
        />
      </div>

      {/* 2-COLUMN MAIN CONTENT & SECONDARY INFORMATION AREA */}
      <div
        className="admin-dashboard-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
          gap: 'var(--space-8)',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Active Incidents Command Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <Card>
            <SectionHeader
              title="Active Incidents Under Municipal Monitoring"
              icon={<ShieldAlert size={18} color="var(--color-critical)" />}
              action={
                <Link to="/admin/emergencies">
                  <Button variant="ghost" size="sm" endIcon={<ArrowRight size={14} />}>
                    Manage All
                  </Button>
                </Link>
              }
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {MOCK_EMERGENCIES.map((emg) => (
                <div
                  key={emg.id}
                  style={{
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-3)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <StatusBadge status={emg.severity} pulse={emg.severity === 'critical'} />
                      <span style={{ fontWeight: 700, fontSize: 'var(--font-base)' }}>{emg.title}</span>
                    </div>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                      Incident ID: <strong>{emg.id}</strong>
                    </span>
                  </div>

                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                    Sector Location: <strong>{emg.location}</strong>
                  </div>

                  {/* Quota Progress */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Skill Quota Fulfillment:</span>
                      <span style={{ fontWeight: 600 }}>
                        {emg.volunteersDeployed} / {emg.volunteersNeeded} Responders
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--bg-surface)',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          width: `${(emg.volunteersDeployed / emg.volunteersNeeded) * 100}%`,
                          height: '100%',
                          background: emg.severity === 'critical' ? 'var(--color-critical)' : 'var(--color-primary)',
                          borderRadius: 'var(--radius-full)'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-1)' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {emg.requiredSkills.map((sk) => (
                        <Badge key={sk} variant="neutral" style={{ fontSize: '10px' }}>
                          {sk}
                        </Badge>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link to={`/admin/emergencies/${emg.id}?tab=map`}>
                        <Button variant="outline" size="sm" icon={<Map size={14} />}>
                          Tactical Map
                        </Button>
                      </Link>
                      <Link to="/admin/matching">
                        <Button variant="outline" size="sm" icon={<GitMerge size={14} />}>
                          Dispatch Engine
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Activity Area: Incident Operations Audit Log Preview */}
          <Card>
            <SectionHeader
              title="Incident Log & Operation Stream"
              icon={<Activity size={18} />}
              action={
                <Link to="/admin/audit">
                  <Button variant="ghost" size="sm" endIcon={<ArrowRight size={14} />}>
                    Audit Center
                  </Button>
                </Link>
              }
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: 'var(--font-xs)', padding: 'var(--space-2) 0' }}>
                <CheckCircle2 size={16} color="var(--color-success)" />
                <span style={{ color: 'var(--text-primary)', flex: 1 }}>
                  Verification Queue: 4 new FEMA credentials approved for District 2 responders.
                </span>
                <span style={{ color: 'var(--text-muted)' }}>12m ago</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: 'var(--font-xs)', padding: 'var(--space-2) 0' }}>
                <Flame size={16} color="var(--color-critical)" />
                <span style={{ color: 'var(--text-primary)', flex: 1 }}>
                  Flash Flood Evacuation incident escalated to Critical Severity by Central Dispatch.
                </span>
                <span style={{ color: 'var(--text-muted)' }}>42m ago</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: 'var(--font-xs)', padding: 'var(--space-2) 0' }}>
                <Cpu size={16} color="var(--color-primary)" />
                <span style={{ color: 'var(--text-primary)', flex: 1 }}>
                  Scheduled Seismic Stress Drill simulation completed with 84.5% projected readiness.
                </span>
                <span style={{ color: 'var(--text-muted)' }}>2h ago</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Secondary Info (Verification Queue + System Status) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Verification Queue Summary */}
          <Card>
            <SectionHeader
              title="Verification Queue"
              icon={<FileCheck2 size={18} />}
              action={
                <Link to="/admin/verification-queue">
                  <Badge variant="warning">4 Pending</Badge>
                </Link>
              }
            />
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              Volunteer credentials requiring administrative validation before incident assignment.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)' }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-xs)' }}>Dr. Marcus Webb</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ACLS Healthcare Provider · Submitted today</div>
              </div>
              <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)' }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-xs)' }}>Elena Rostova</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Heavy Equipment Class-A · Submitted 1d ago</div>
              </div>
            </div>

            <Link to="/admin/verification-queue">
              <Button variant="secondary" size="sm" style={{ width: '100%' }}>
                Process Verification Queue
              </Button>
            </Link>
          </Card>

          {/* Quick Engine Links */}
          <Card>
            <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
              Command Quick Actions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <Link to="/admin/matching" style={{ textDecoration: 'none' }}>
                <Button variant="outline" size="sm" style={{ width: '100%', justifyContent: 'flex-start' }} icon={<GitMerge size={16} />}>
                  Skill Matching Engine
                </Button>
              </Link>
              <Link to="/admin/analytics" style={{ textDecoration: 'none' }}>
                <Button variant="outline" size="sm" style={{ width: '100%', justifyContent: 'flex-start' }} icon={<BarChart3 size={16} />}>
                  Readiness Analytics
                </Button>
              </Link>
              <Link to="/admin/simulations" style={{ textDecoration: 'none' }}>
                <Button variant="outline" size="sm" style={{ width: '100%', justifyContent: 'flex-start' }} icon={<Cpu size={16} />}>
                  Disaster Simulator
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
