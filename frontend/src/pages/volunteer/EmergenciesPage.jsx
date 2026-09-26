import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Search,
  Filter,
  AlertCircle,
  RefreshCw,
  Info
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import LoadingState from '../../components/states/LoadingState';
import EmptyState from '../../components/states/EmptyState';
import EmergencyCard from '../../components/emergency/EmergencyCard';
import emergencyService from '../../services/emergencyService';
import {
  EMERGENCY_STATUSES,
  STATUS_LABELS,
  EMERGENCY_SEVERITIES,
  SEVERITY_LABELS
} from '../../data/devEmergencies';

export const EmergenciesPage = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const fetchEmergencies = async () => {
    setIsLoading(true);
    try {
      const data = await emergencyService.getEmergencies();
      setEmergencies(data);
    } catch (err) {
      console.error('[EmergenciesPage] Error loading emergencies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();
  }, []);

  // Filtered emergencies
  const filteredEmergencies = useMemo(() => {
    return emergencies.filter((emg) => {
      // Status filter
      if (statusFilter !== 'ALL' && emg.status !== statusFilter) {
        return false;
      }
      // Severity filter
      if (severityFilter !== 'ALL' && emg.severity !== severityFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = emg.title.toLowerCase().includes(query);
        const matchesDesc = emg.description.toLowerCase().includes(query);
        const matchesLocation = emg.location.toLowerCase().includes(query);
        const matchesSkill = emg.requirements?.some((r) =>
          r.skill.toLowerCase().includes(query) || r.category.toLowerCase().includes(query)
        );
        if (!matchesTitle && !matchesDesc && !matchesLocation && !matchesSkill) {
          return false;
        }
      }
      return true;
    });
  }, [emergencies, searchQuery, statusFilter, severityFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setSeverityFilter('ALL');
  };

  if (isLoading) {
    return <LoadingState message="Scanning active regional disaster declarations..." minHeight="380px" />;
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <PageHeader
        title="Active Emergencies"
        subtitle="View regional disaster declarations, live incident requirements, and personnel mobilization quotas."
        icon={<Flame size={24} color="var(--color-critical)" />}
      />

      {/* Development State Notice */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'rgba(249, 115, 22, 0.08)',
          border: '1px solid rgba(249, 115, 22, 0.25)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-6)',
          fontSize: 'var(--font-sm)',
          color: 'var(--text-secondary)'
        }}
      >
        <Info size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>Volunteer Response View:</strong> Browse active emergency declarations and review skill quotas. Mobilization dispatch, proximity matching, and deployment responses will be activated in subsequent stages.
        </div>
      </div>

      {/* Filter and Search Bar */}
      {(emergencies.length > 0 || searchQuery || statusFilter !== 'ALL' || severityFilter !== 'ALL') && (
        <Card style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-4)',
              alignItems: 'center'
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Input
                placeholder="Search emergency, location, or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ marginBottom: 0, paddingLeft: '36px' }}
              />
              <Search
                size={16}
                color="var(--text-muted)"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}
              />
            </div>

            {/* Severity Filter */}
            <div>
              <Select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                style={{ marginBottom: 0 }}
                options={[
                  { value: 'ALL', label: 'All Severities' },
                  ...EMERGENCY_SEVERITIES.map((s) => ({
                    value: s,
                    label: `Severity: ${SEVERITY_LABELS[s] || s}`
                  }))
                ]}
              />
            </div>

            {/* Status Filter */}
            <div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ marginBottom: 0 }}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  ...EMERGENCY_STATUSES.map((st) => ({
                    value: st,
                    label: `Status: ${STATUS_LABELS[st] || st}`
                  }))
                ]}
              />
            </div>

            {/* Count & Reset */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 'var(--font-xs)',
                color: 'var(--text-secondary)'
              }}
            >
              <span>
                Showing <strong>{filteredEmergencies.length}</strong> of <strong>{emergencies.length}</strong> incidents
              </span>
              {(searchQuery || statusFilter !== 'ALL' || severityFilter !== 'ALL') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  style={{ fontSize: 'var(--font-xs)' }}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Content Grid / Empty States */}
      {emergencies.length === 0 ? (
        <EmptyState
          icon={<Flame size={32} color="var(--text-muted)" />}
          title="No emergencies available."
          description="There are currently no active disaster declarations or emergency response incidents published."
        />
      ) : filteredEmergencies.length === 0 ? (
        <EmptyState
          icon={<Search size={32} color="var(--text-muted)" />}
          title="No matching emergencies found"
          description="No emergency records match your current search keywords or status/severity filters."
          action={
            <Button variant="secondary" size="sm" onClick={handleResetFilters}>
              Clear Search & Filters
            </Button>
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 'var(--space-4)'
          }}
        >
          {filteredEmergencies.map((emergency) => (
            <EmergencyCard
              key={emergency.id}
              emergency={emergency}
              isAdmin={false}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EmergenciesPage;
