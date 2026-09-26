import React from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Flame,
  Award,
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Bell,
  Calendar,
  ShieldCheck,
  MapPin,
  ExternalLink,
  ClipboardList
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import SummaryCard from '../../components/dashboard/SummaryCard';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import SectionHeader from '../../components/common/SectionHeader';
import { useAuth } from '../../context/AuthContext';
import { MOCK_VOLUNTEER_PROFILE, MOCK_EMERGENCIES, MOCK_NOTIFICATIONS, MOCK_COMMUNITY_ACTIVITIES } from '../../data/mockData';

export const VolunteerDashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title={`Welcome back, ${user?.name || 'Responder'}`}
        subtitle="Volunteer Readiness Console — Operational Status: High Readiness"
        badge={<StatusBadge status="active" label="Available for Deployment" />}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <Link to="/volunteer/assignments">
              <Button variant="outline" size="sm" icon={<ClipboardList size={15} />}>
                My Assignments
              </Button>
            </Link>
            <Link to="/volunteer/report-emergency">
              <Button variant="danger" size="sm" icon={<AlertTriangle size={15} />}>
                Report Incident
              </Button>
            </Link>
            <Link to="/volunteer/skills">
              <Button variant="primary" size="sm" icon={<Zap size={15} />}>
                Update Skills
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
          title="Verified Skills"
          value="7"
          subtitle="4 Primary · 3 Secondary"
          icon={<Zap size={20} />}
          badge={<Badge variant="success">FEMA L3</Badge>}
        />
        <SummaryCard
          title="Incident Alerts"
          value="3"
          subtitle="2 In Your Sector (Dist. 4)"
          icon={<Flame size={20} />}
          badge={<Badge variant="critical">Urgent</Badge>}
        />
        <SummaryCard
          title="Responses Logged"
          value={MOCK_VOLUNTEER_PROFILE.assignmentsCompleted}
          subtitle="100% On-Time Deployment"
          icon={<CheckCircle size={20} />}
        />
        <SummaryCard
          title="Resilience Hours"
          value={`${MOCK_VOLUNTEER_PROFILE.hoursContributed}h`}
          subtitle="Community contribution total"
          icon={<Clock size={20} />}
        />
      </div>

      {/* 2-COLUMN MAIN CONTENT & SECONDARY INFORMATION AREA */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
          gap: 'var(--space-8)',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Main Active Incidents & Responses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <Card>
            <SectionHeader
              title="Active Incidents Requiring Your Verified Skills"
              icon={<Flame size={18} />}
              action={
                <Link to="/volunteer/emergencies">
                  <Button variant="ghost" size="sm" endIcon={<ArrowRight size={14} />}>
                    View All
                  </Button>
                </Link>
              }
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {MOCK_EMERGENCIES.slice(0, 2).map((emergency) => (
                <div
                  key={emergency.id}
                  style={{
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StatusBadge status={emergency.severity} pulse={emergency.severity === 'critical'} />
                      <span style={{ fontWeight: 700, fontSize: 'var(--font-sm)' }}>{emergency.title}</span>
                    </div>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                      {emergency.volunteersDeployed}/{emergency.volunteersNeeded} Deployed
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                    <MapPin size={13} color="var(--color-primary)" />
                    <span>{emergency.location}</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    {emergency.requiredSkills.map((sk) => (
                      <Badge key={sk} variant="neutral" style={{ fontSize: '10px' }}>
                        {sk}
                      </Badge>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                    <Link to="/volunteer/emergencies">
                      <Button variant="outline" size="sm">
                        View Match Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Activity Area: Upcoming Community Drills */}
          <Card>
            <SectionHeader
              title="Community Preparedness Activities"
              icon={<Calendar size={18} />}
              action={
                <Link to="/volunteer/activities">
                  <Button variant="ghost" size="sm" endIcon={<ArrowRight size={14} />}>
                    Calendar
                  </Button>
                </Link>
              }
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {MOCK_COMMUNITY_ACTIVITIES.map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{activity.title}</div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                      {activity.date} · {activity.location}
                    </div>
                  </div>
                  <Badge variant="primary">{activity.participants} Joined</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Secondary Info (Passport + Notifications) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Skill Passport Summary */}
          <Card style={{ border: '1px solid var(--border-highlight)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
              <ShieldCheck size={20} color="var(--color-primary)" />
              <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700 }}>Digital Skill Passport</h3>
            </div>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              Tamper-evident verification badge issued to your identity for field authorization.
            </p>

            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-4)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Passport ID:</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{MOCK_VOLUNTEER_PROFILE.badgeId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Trust Score:</span>
                <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>{MOCK_VOLUNTEER_PROFILE.trustScore}% Verified</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <Badge variant="success" style={{ fontSize: '10px' }}>Active Cleared</Badge>
              </div>
            </div>

            <Link to="/volunteer/skill-passport">
              <Button variant="secondary" size="sm" style={{ width: '100%' }}>
                View Full Skill Passport
              </Button>
            </Link>
          </Card>

          {/* Notification Area */}
          <Card>
            <SectionHeader
              title="Recent Dispatches"
              icon={<Bell size={18} />}
              action={
                <Link to="/volunteer/notifications">
                  <Button variant="ghost" size="sm">
                    All
                  </Button>
                </Link>
              }
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {MOCK_NOTIFICATIONS.map((notif) => (
                <div
                  key={notif.id}
                  style={{
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    borderLeft: `3px solid ${notif.type === 'critical' ? 'var(--color-critical)' : 'var(--color-success)'}`
                  }}
                >
                  <div style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {notif.title}
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {notif.message}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;
