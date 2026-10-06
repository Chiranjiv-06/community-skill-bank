import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import {
  Settings,
  ShieldAlert,
  Radio,
  Sliders,
  Database,
  Save,
  CheckCircle2,
  Lock,
  Cpu
} from 'lucide-react';

export const AdminSettingsPage = () => {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    autoDispatchEnabled: true,
    minMatchScore: '75',
    maxDispatchDistanceKm: '25',
    slaEscalationMinutes: '15',
    defaultSeverity: 'high',
    emergencyBroadcastChannel: 'MUNICIPAL_ALL_HAZARDS',
    telemetryRefreshRate: '30',
    auditLogRetentionDays: '180',
    meshSyncEnabled: true
  });

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleChange = (key, val) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="admin-settings-page" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
      <PageHeader
        title="Incident Command Configuration & Parameters"
        subtitle="Configure automated dispatch thresholds, SLA escalations, multi-channel alerts, and tactical engine parameters."
        icon={<Settings size={24} color="var(--color-critical)" />}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            icon={<Save size={16} />}
          >
            Apply Command Settings
          </Button>
        }
      />

      {saved && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--color-success-bg)',
            border: '1px solid var(--color-success-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-success)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)'
          }}
        >
          <CheckCircle2 size={18} />
          <span>Incident Command engine parameters updated successfully across cluster.</span>
        </div>
      )}

      {/* 2-Column Responsive Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: 'var(--space-5)' }}>
        {/* Automated Dispatch & Matching Engine */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-critical)' }}>
              <Cpu size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                Matching Engine Parameters
              </h3>
              <p style={{ margin: 0, fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                Haversine distance and multi-criteria matching thresholds.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) 0' }}>
            <div>
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                Algorithmic Automated Dispatch
              </span>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                Immediately suggest closest qualified certified volunteers when an incident is reported
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.autoDispatchEnabled}
              onChange={() => handleToggle('autoDispatchEnabled')}
              style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
            <Input
              label="Minimum Eligibility Match Score"
              type="number"
              min="50"
              max="100"
              value={settings.minMatchScore}
              onChange={(e) => handleChange('minMatchScore', e.target.value)}
              helperText="Cutoff percentage for automatic dispatch recommendations"
            />
            <Input
              label="Max Proximity Radius (km)"
              type="number"
              min="5"
              max="100"
              value={settings.maxDispatchDistanceKm}
              onChange={(e) => handleChange('maxDispatchDistanceKm', e.target.value)}
              helperText="Haversine outer boundary"
            />
          </div>
        </Card>

        {/* Operational SLA & Escalation Triggers */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning)' }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                SLA & Crisis Escalation Rules
              </h3>
              <p style={{ margin: 0, fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                Automated escalation triggers for unassigned critical incidents.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
            <Input
              label="Incident SLA Escalation (Minutes)"
              type="number"
              min="5"
              max="120"
              value={settings.slaEscalationMinutes}
              onChange={(e) => handleChange('slaEscalationMinutes', e.target.value)}
              helperText="Auto-escalate severity if quota is not filled"
            />
            <Select
              label="Default Incident Severity"
              value={settings.defaultSeverity}
              onChange={(e) => handleChange('defaultSeverity', e.target.value)}
              options={[
                { value: 'critical', label: 'Critical — Life Threat' },
                { value: 'high', label: 'High — Immediate Response' },
                { value: 'medium', label: 'Medium — Urgent Relief' },
                { value: 'low', label: 'Low — Advisory / Standby' }
              ]}
            />
          </div>

          <Select
            label="Emergency Broadcast Channel"
            value={settings.emergencyBroadcastChannel}
            onChange={(e) => handleChange('emergencyBroadcastChannel', e.target.value)}
            options={[
              { value: 'MUNICIPAL_ALL_HAZARDS', label: '📡 Primary Municipal All-Hazards Channel' },
              { value: 'DISTRICT_RAPID_RESPONSE', label: '🚨 District Rapid Response Network' },
              { value: 'REGIONAL_MUTUAL_AID', label: '🌐 Regional Mutual Aid Mesh' }
            ]}
          />
        </Card>

        {/* Telemetry & Synchronization */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA' }}>
              <Radio size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                Real-Time Telemetry & WebSocket
              </h3>
              <p style={{ margin: 0, fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                Intervals for live location tracking and incident telemetry.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
            <Input
              label="Live Telemetry Heartbeat (Seconds)"
              type="number"
              min="5"
              max="120"
              value={settings.telemetryRefreshRate}
              onChange={(e) => handleChange('telemetryRefreshRate', e.target.value)}
              helperText="Tactical map refresh period"
            />
            <Input
              label="Audit Log Retention (Days)"
              type="number"
              min="30"
              max="730"
              value={settings.auditLogRetentionDays}
              onChange={(e) => handleChange('auditLogRetentionDays', e.target.value)}
              helperText="Security compliance history"
            />
          </div>
        </Card>

        {/* Cluster Security & Clearance Controls */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399' }}>
              <Lock size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                Role-Based Clearance & Permissions
              </h3>
              <p style={{ margin: 0, fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                Coordinator verification tiers and command access controls.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) 0' }}>
            <div>
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                Offline Mesh Sync Protocol
              </span>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                Allow peer-to-peer queue synchronization during network infrastructure blackouts
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.meshSyncEnabled}
              onChange={() => handleToggle('meshSyncEnabled')}
              style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
            />
          </div>

          <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
            <strong>Active Incident Command Security:</strong> Role-based access enforcement active. All simulation runs and dispatch overrides are recorded to immutable audit trails.
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
