import React from 'react';
import {
  ShieldAlert,
  Brain,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Users,
  Activity,
  Zap,
  Info,
  Layers
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import EmergencySeverityBadge from './EmergencySeverityBadge';
import { URGENCY_LABELS, URGENCY_BADGE_VARIANTS } from '../../data/devEmergencies';

/**
 * Reusable Emergency Intelligence Panel Component
 * Displays automated incident intelligence, risk flags, location validation, and decision reasoning.
 */
export const EmergencyIntelligencePanel = ({
  intelligence = null,
  isLoading = false
}) => {
  if (isLoading || !intelligence) {
    return (
      <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)' }}>
        Generating automated incident intelligence synthesis...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Dev Intelligence Notice */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'rgba(249, 115, 22, 0.08)',
          border: '1px solid rgba(249, 115, 22, 0.25)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-sm)',
          color: 'var(--text-secondary)'
        }}
      >
        <Brain size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>Emergency Intelligence Feed (Dev State):</strong> Incident synthesis combines geospatial location telemetry, multi-hazard risk signals, and required skill quotas for command decision support.
        </div>
      </div>

      {/* Grid: Priority, Location Validation, Staffing Quota */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-4)'
        }}
      >
        {/* Severity & Urgency Card */}
        <Card style={{ padding: 'var(--space-5)' }}>
          <span
            style={{
              display: 'block',
              fontSize: 'var(--font-xs)',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-3)',
              letterSpacing: '0.04em'
            }}
          >
            Incident Urgency & Priority
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <div>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Severity:</span>
              <EmergencySeverityBadge severity={intelligence.severity} />
            </div>

            <div>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Dispatch Urgency:</span>
              <Badge variant={URGENCY_BADGE_VARIANTS[intelligence.urgency] || 'critical'}>
                {URGENCY_LABELS[intelligence.urgency] || intelligence.urgency}
              </Badge>
            </div>
          </div>

          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Automated surge escalation configured for emergency response operations.
          </div>
        </Card>

        {/* Location Validation Card */}
        <Card style={{ padding: 'var(--space-5)' }}>
          <span
            style={{
              display: 'block',
              fontSize: 'var(--font-xs)',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-3)',
              letterSpacing: '0.04em'
            }}
          >
            Geospatial Location Validation
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--space-2)' }}>
            <CheckCircle2 size={16} color="var(--color-success)" />
            <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--color-success)' }}>
              {intelligence.locationValidation?.status || 'Validated'}
            </strong>
          </div>

          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div><strong>Sector:</strong> {intelligence.locationValidation?.sector}</div>
            <div><strong>Jurisdiction:</strong> {intelligence.locationValidation?.jurisdiction}</div>
            <div><strong>Access Route:</strong> {intelligence.locationValidation?.accessCondition}</div>
          </div>
        </Card>

        {/* Staffing & Skills Quota Card */}
        <Card style={{ padding: 'var(--space-5)' }}>
          <span
            style={{
              display: 'block',
              fontSize: 'var(--font-xs)',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-3)',
              letterSpacing: '0.04em'
            }}
          >
            Staffing & Required Skills
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
            <Users size={18} color="var(--color-primary)" />
            <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>
              {intelligence.staffingRequirement}
            </strong>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {intelligence.requiredSkillsSummary?.map((skill, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: 'var(--font-xs)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Zap size={12} color="var(--color-primary)" />
                {skill}
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Risk & Decision Flags */}
      <Card style={{ padding: 'var(--space-6)' }}>
        <h4
          style={{
            fontSize: 'var(--font-base)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertTriangle size={18} color="var(--color-critical)" />
          <span>Active Hazard Risk & Decision Flags ({intelligence.riskFlags?.length || 0})</span>
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
          {intelligence.riskFlags?.map((flag) => (
            <div
              key={flag.id}
              style={{
                padding: 'var(--space-4)',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                borderLeft: `4px solid ${
                  flag.level === 'critical'
                    ? 'var(--color-critical)'
                    : flag.level === 'high'
                    ? 'var(--color-warning)'
                    : 'var(--color-info)'
                }`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>
                  {flag.title}
                </strong>
                <Badge
                  variant={
                    flag.level === 'critical' ? 'critical' : flag.level === 'high' ? 'warning' : 'info'
                  }
                >
                  {flag.level}
                </Badge>
              </div>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                {flag.description}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Decision Reasoning Card for Administrator */}
      <Card style={{ padding: 'var(--space-6)', borderLeft: '4px solid var(--color-primary)' }}>
        <h4
          style={{
            fontSize: 'var(--font-base)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Brain size={18} color="var(--color-primary)" />
          <span>Administrator Decision Reasoning & Recommendation Strategy</span>
        </h4>
        <p
          style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            whiteSpace: 'pre-wrap',
            margin: 0
          }}
        >
          {intelligence.reasoning}
        </p>
      </Card>
    </div>
  );
};

export default EmergencyIntelligencePanel;
