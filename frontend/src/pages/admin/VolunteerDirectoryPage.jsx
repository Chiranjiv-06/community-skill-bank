import React, { useState, useEffect } from 'react';
import {
  Users2,
  Search,
  ShieldCheck,
  Award,
  Clock,
  CheckCircle2,
  Mail,
  MapPin,
  ExternalLink
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import LoadingState from '../../components/states/LoadingState';
import EmptyState from '../../components/states/EmptyState';
import { trustService } from '../../services/trustService';
import TrustTierBadge from '../../components/trust/TrustTierBadge';

export const VolunteerDirectoryPage = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');

  useEffect(() => {
    const loadVolunteers = async () => {
      setLoading(true);
      try {
        const data = await trustService.getAllTrustProfiles();
        setVolunteers(data || []);
      } catch (err) {
        console.error('[VolunteerDirectoryPage] Error loading volunteer profiles:', err);
      } finally {
        setLoading(false);
      }
    };

    loadVolunteers();
  }, []);

  const filtered = volunteers.filter((vol) => {
    const nameMatch = (vol.volunteerName || '').toLowerCase().includes(search.toLowerCase());
    const emailMatch = (vol.volunteerEmail || '').toLowerCase().includes(search.toLowerCase());
    const tierMatch = tierFilter === 'ALL' || vol.trustTier === tierFilter;
    return (nameMatch || emailMatch) && tierMatch;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
      <PageHeader
        title="Community Volunteer Directory"
        subtitle="Operational roster of registered disaster volunteers, verified trust tiers, and verified readiness records."
        icon={<Users2 size={24} color="var(--color-primary)" />}
      />

      {/* Filter Bar */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 'var(--space-4)', alignItems: 'center' }}>
          <Input
            placeholder="Search volunteers by name or email..."
            icon={<Search size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 0 }}
          />

          <Select
            label="Filter by Trust Tier"
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Trust Tiers' },
              { value: 'Verified Tier 3', label: 'Tier 3 — Advanced Lead Responder' },
              { value: 'Verified Tier 2', label: 'Tier 2 — Skilled Responder' },
              { value: 'Tier 1 Standard', label: 'Tier 1 — General Volunteer' }
            ]}
            style={{ marginBottom: 0 }}
          />
        </div>
      </Card>

      {/* Volunteer Grid */}
      {loading ? (
        <LoadingState message="Loading operational volunteer directory..." minHeight="300px" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users2 size={36} color="var(--text-muted)" />}
          title="No Volunteers Found"
          description="Adjust your search criteria to view registered community responders."
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
            gap: 'var(--space-4)'
          }}
        >
          {filtered.map((vol) => (
            <Card
              key={vol.volunteerId}
              hover
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 'var(--space-5)',
                gap: 'var(--space-4)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 'var(--font-sm)'
                      }}
                    >
                      {(vol.volunteerName || 'V').charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {vol.volunteerName}
                      </h3>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={11} /> {vol.volunteerEmail}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <TrustTierBadge tier={vol.trustTier} />
                </div>

                {/* Metrics */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-3)',
                    background: 'var(--bg-surface-elevated)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    textAlign: 'center'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Trust Score</span>
                    <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--color-primary)' }}>{vol.trustScore || 85}%</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Missions</span>
                    <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>{vol.assignmentsCompleted || 0}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Hours</span>
                    <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--color-success)' }}>{vol.hoursContributed || 0}h</strong>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 'var(--space-3)',
                  fontSize: 'var(--font-xs)',
                  color: 'var(--text-muted)'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)' }}>
                  <ShieldCheck size={13} /> Verified Responder
                </span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{vol.volunteerId}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VolunteerDirectoryPage;
