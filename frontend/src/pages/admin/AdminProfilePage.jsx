import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingState from '../../components/states/LoadingState';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import {
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Mail,
  Phone,
  Building2,
  Lock,
  Save,
  CheckCircle2,
  Flame,
  Activity,
  Calendar,
  Radio
} from 'lucide-react';

export const AdminProfilePage = () => {
  const { currentUser, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [adminData, setAdminData] = useState({
    fullName: 'Chief Incident Commander',
    email: 'admin@skillbank.org',
    phone: '+1 (555) 019-2834',
    jurisdiction: 'Municipal All-Hazards Command (Central & Metro Sectors)',
    department: 'Bureau of Emergency Management & Civil Defense',
    callSign: 'COMMAND-1',
    clearanceTier: 'Tier 1 — Full Incident Dispatch & Resource Authorization',
    assignedSectors: 'Sectors 1, 2, 3, 4, 7 (Riverside Basin)',
    status: 'active'
  });

  useEffect(() => {
    let isMounted = true;
    const loadAdmin = async () => {
      setLoading(true);
      try {
        if (currentUser?.id) {
          const profile = await userService.getProfile(currentUser.id);
          if (isMounted && profile) {
            setAdminData((prev) => ({
              ...prev,
              fullName: profile.fullName || currentUser.full_name || prev.fullName,
              email: profile.email || currentUser.email || prev.email,
              phone: profile.phone || prev.phone,
              jurisdiction: profile.location || prev.jurisdiction
            }));
          }
        } else if (currentUser) {
          setAdminData((prev) => ({
            ...prev,
            fullName: currentUser.full_name || currentUser.name || prev.fullName,
            email: currentUser.email || prev.email
          }));
        }
      } catch (err) {
        console.warn('[AdminProfilePage] Error fetching admin profile, using active session data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAdmin();
    return () => { isMounted = false; };
  }, [currentUser]);

  const handleChange = (field, val) => {
    setAdminData((prev) => ({ ...prev, [field]: val }));
    setSaved(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setIsEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return <LoadingState message="Loading Incident Command Administrator Profile..." minHeight="360px" />;
  }

  return (
    <div className="admin-profile-page" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
      <PageHeader
        title="Incident Commander & Administrator Profile"
        subtitle="Manage administrative credentials, command jurisdiction, emergency dispatch authorizations, and contact routing."
        icon={<UserCheck size={24} color="var(--color-critical)" />}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            {isEditing ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" icon={<Save size={15} />} onClick={handleSave}>
                  Save Changes
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit Contact Details
              </Button>
            )}
          </div>
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
          <span>Administrator profile details updated successfully.</span>
        </div>
      )}

      {/* Commander Overview Header Card */}
      <Card style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', minWidth: 0 }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #EF4444 0%, #EA580C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: '1.5rem',
                fontWeight: 800,
                boxShadow: '0 4px 16px rgba(239, 68, 68, 0.35)',
                flexShrink: 0
              }}
            >
              {adminData.fullName.charAt(0)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {adminData.fullName}
                </h2>
                <Badge variant="critical">Emergency Administrator</Badge>
                <Badge variant="success">Active Clearance</Badge>
              </div>
              <p style={{ margin: 0, fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                {adminData.department} · Tactical Call Sign: <strong style={{ color: 'var(--color-primary)' }}>{adminData.callSign}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Command Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
            gap: 'var(--space-3)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ padding: 'var(--space-3)', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Operational Role</span>
            <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>Lead Incident Commander</strong>
          </div>
          <div style={{ padding: 'var(--space-3)', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Security Clearance</span>
            <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--color-critical)' }}>Tier 1 (Unrestricted)</strong>
          </div>
          <div style={{ padding: 'var(--space-3)', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Active Municipal Grid</span>
            <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--color-primary)' }}>Sector All-Hazards</strong>
          </div>
          <div style={{ padding: 'var(--space-3)', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>System Delegation</span>
            <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--color-success)' }}>Primary Authority</strong>
          </div>
        </div>
      </Card>

      {/* 2-Column Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: 'var(--space-5)' }}>
        {/* Contact & Dispatch Routing */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA' }}>
              <Building2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                Official Contact & Dispatch Routing
              </h3>
              <p style={{ margin: 0, fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                Direct channels for incident escalation alerts.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input
              label="Official Administrator Name"
              value={adminData.fullName}
              disabled={!isEditing}
              onChange={(e) => handleChange('fullName', e.target.value)}
            />
            <Input
              label="Official Command Email"
              value={adminData.email}
              disabled={!isEditing}
              onChange={(e) => handleChange('email', e.target.value)}
            />
            <Input
              label="Secure Direct Hotline"
              value={adminData.phone}
              disabled={!isEditing}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>
        </Card>

        {/* Command Jurisdiction & Authorizations */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-critical)' }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                Jurisdiction & Operating Authority
              </h3>
              <p style={{ margin: 0, fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                Authorized emergency response sectors and quota controls.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Primary Jurisdiction</span>
              <div style={{ padding: '10px 12px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)', color: 'var(--text-primary)', fontWeight: 600 }}>
                {adminData.jurisdiction}
              </div>
            </div>

            <div>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Supervised Municipal Sectors</span>
              <div style={{ padding: '10px 12px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)', color: 'var(--color-primary)' }}>
                {adminData.assignedSectors}
              </div>
            </div>

            <div>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Authorization Level</span>
              <div style={{ padding: '10px 12px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                {adminData.clearanceTier}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminProfilePage;
