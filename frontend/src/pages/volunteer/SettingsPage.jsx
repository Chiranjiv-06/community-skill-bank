import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Settings,
  Bell,
  MapPin,
  Shield,
  Smartphone,
  Save,
  CheckCircle2,
  Moon,
  Sun,
  HardDrive
} from 'lucide-react';

export const SettingsPage = () => {
  const { user, currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const activeUser = currentUser || user;

  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    dispatchRadius: '15',
    smsAlerts: true,
    pushAlerts: true,
    offlineSync: true,
    contactPhone: '+1 (555) 234-5678',
    emergencyContact: 'Sarah Rivera (+1 555 987-6543)',
    availabilityStatus: 'available',
    primarySkillTrack: 'Swift Water Rescue'
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
    <div className="settings-page" style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
      <PageHeader
        title="Volunteer Preferences & Settings"
        subtitle="Manage personal incident dispatch notifications, tactical GPS proximity radius, and offline synchronization."
        icon={<Settings size={24} color="var(--color-primary)" />}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            icon={<Save size={16} />}
          >
            Save Preferences
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
          <span>Your volunteer profile and operational preferences have been updated.</span>
        </div>
      )}

      {/* Grid of Settings Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 'var(--space-5)' }}>
        {/* Proximity & Tactical Dispatch Radius */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(249, 115, 22, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
              <MapPin size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                Field Proximity & Dispatch Radius
              </h3>
              <p style={{ margin: 0, fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                Maximum mobilization perimeter for emergency match alerts.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <label style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Max Mobilization Radius: <strong style={{ color: 'var(--color-primary)' }}>{settings.dispatchRadius} km</strong>
            </label>
            <input
              type="range"
              min="2"
              max="50"
              step="1"
              value={settings.dispatchRadius}
              onChange={(e) => handleChange('dispatchRadius', e.target.value)}
              style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>2 km (Local Ward)</span>
              <span>25 km (Metropolitan)</span>
              <span>50 km (Regional)</span>
            </div>
          </div>

          <Select
            label="Current Operational Status"
            value={settings.availabilityStatus}
            onChange={(e) => handleChange('availabilityStatus', e.target.value)}
            options={[
              { value: 'available', label: '🟢 Immediate Deployment Ready' },
              { value: 'standby', label: '🟡 Standby / On-Call Only' },
              { value: 'unavailable', label: '🔴 Temporarily Unavailable' }
            ]}
          />
        </Card>

        {/* Emergency Alert Channels */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA' }}>
              <Bell size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                Emergency Alerts & Channels
              </h3>
              <p style={{ margin: 0, fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                Transmission channels for high-priority crisis broadcasts.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) 0' }}>
              <div>
                <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                  Critical Emergency Push Notifications
                </span>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                  Instant push popups for Tier-1 / Critical incidents in your sector
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.pushAlerts}
                onChange={() => handleToggle('pushAlerts')}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderTop: '1px solid var(--border-subtle)' }}>
              <div>
                <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                  Urgent SMS Dispatch Alerts
                </span>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                  SMS fallback alerts when mobile data coverage is compromised
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.smsAlerts}
                onChange={() => handleToggle('smsAlerts')}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
            </div>
          </div>
        </Card>

        {/* Emergency Contact & Contact Routing */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399' }}>
              <Smartphone size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                Field Contact & Safety Escalation
              </h3>
              <p style={{ margin: 0, fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                Field coordinator direct lines and next-of-kin safety details.
              </p>
            </div>
          </div>

          <Input
            label="Direct Mobile Dispatch Number"
            value={settings.contactPhone}
            onChange={(e) => handleChange('contactPhone', e.target.value)}
            placeholder="+1 (555) 000-0000"
          />

          <Input
            label="Next of Kin / Emergency Safety Contact"
            value={settings.emergencyContact}
            onChange={(e) => handleChange('emergencyContact', e.target.value)}
            placeholder="Full Name & Phone Number"
          />
        </Card>

        {/* System & Offline Cache */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(148, 163, 184, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
              <HardDrive size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                Offline Protocol & Storage
              </h3>
              <p style={{ margin: 0, fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                Local indexed caching for remote disaster zones.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) 0' }}>
            <div>
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                Offline Incident & Guide Cache
              </span>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                Preload tactical SOPs and assigned incident cards for zero-connectivity zones
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.offlineSync}
              onChange={() => handleToggle('offlineSync')}
              style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)' }}>
            <div>
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                Interface Display Theme
              </span>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                Current: {theme === 'dark' ? 'Command Center Dark' : 'High-Contrast Light'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              icon={theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            >
              {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
