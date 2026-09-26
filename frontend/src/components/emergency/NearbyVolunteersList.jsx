import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Navigation,
  CheckCircle,
  AlertTriangle,
  Clock,
  Tag,
  Car
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import LoadingState from '../states/LoadingState';
import EmptyState from '../states/EmptyState';

const PROFICIENCY_BADGES = {
  Beginner: 'neutral',
  Intermediate: 'info',
  Advanced: 'warning',
  Expert: 'success'
};

/**
 * Reusable Nearby Volunteers List Component
 * Displays nearby volunteer roster with skills, distance, and eligibility.
 */
export const NearbyVolunteersList = ({
  volunteers = [],
  isLoading = false,
  error = null
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [eligibilityFilter, setEligibilityFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return volunteers.filter((vol) => {
      // Eligibility filter
      if (eligibilityFilter === 'ELIGIBLE' && vol.eligibility.toLowerCase().includes('below')) {
        return false;
      }
      if (eligibilityFilter === 'BELOW' && !vol.eligibility.toLowerCase().includes('below')) {
        return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = vol.name.toLowerCase().includes(query);
        const matchesSkill = vol.skill.toLowerCase().includes(query);
        const matchesExp = vol.experience.toLowerCase().includes(query);
        if (!matchesName && !matchesSkill && !matchesExp) return false;
      }

      return true;
    });
  }, [volunteers, searchQuery, eligibilityFilter]);

  if (isLoading) {
    return <LoadingState message="Locating certified nearby responders within dispatch radius..." minHeight="260px" />;
  }

  if (error) {
    return (
      <div
        style={{
          padding: 'var(--space-6)',
          background: 'var(--color-critical-bg)',
          border: '1px solid var(--color-critical-border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-critical)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)'
        }}
      >
        <AlertTriangle size={20} />
        <div>
          <strong>Error Loading Nearby Responders:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search & Filter Toolbar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
          alignItems: 'center'
        }}
      >
        <div style={{ position: 'relative' }}>
          <Input
            placeholder="Search responder or skill..."
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

        <div>
          <Select
            value={eligibilityFilter}
            onChange={(e) => setEligibilityFilter(e.target.value)}
            style={{ marginBottom: 0 }}
            options={[
              { value: 'ALL', label: 'All Proximity Responders' },
              { value: 'ELIGIBLE', label: 'Eligible Responders Only' },
              { value: 'BELOW', label: 'Restricted / Quota Mismatch' }
            ]}
          />
        </div>

        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', textAlign: 'right' }}>
          Showing <strong>{filtered.length}</strong> of <strong>{volunteers.length}</strong> nearby
        </div>
      </div>

      {/* List Display */}
      {volunteers.length === 0 ? (
        <EmptyState
          icon={<Users size={32} color="var(--text-muted)" />}
          title="No nearby volunteers located"
          description="There are currently no registered volunteers identified within the standard response sector."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search size={32} color="var(--text-muted)" />}
          title="No matching nearby volunteers"
          description="No responders match your active search keyword or eligibility filter."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setEligibilityFilter('ALL');
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-3)'
          }}
        >
          {filtered.map((vol) => {
            const isEligible = !vol.eligibility.toLowerCase().includes('below');
            return (
              <Card
                key={vol.id}
                style={{
                  padding: 'var(--space-4)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderLeft: `3px solid ${isEligible ? 'var(--color-primary)' : 'var(--border-default)'}`
                }}
              >
                <div>
                  {/* Top: Name & Distance Tag */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 'var(--space-2)'
                    }}
                  >
                    <h4
                      style={{
                        fontSize: 'var(--font-base)',
                        fontWeight: 700,
                        color: 'var(--text-primary)'
                      }}
                    >
                      {vol.name}
                    </h4>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: 'var(--font-xs)',
                        fontWeight: 700,
                        color: 'var(--color-primary)',
                        background: 'rgba(249, 115, 22, 0.1)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <Navigation size={12} />
                      {vol.distance}
                    </span>
                  </div>

                  {/* Skill & Proficiency */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      marginBottom: 'var(--space-3)',
                      flexWrap: 'wrap'
                    }}
                  >
                    <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {vol.skill}
                    </span>
                    <Badge variant={PROFICIENCY_BADGES[vol.proficiency] || 'neutral'}>
                      {vol.proficiency}
                    </Badge>
                  </div>

                  {/* Experience */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '6px',
                      fontSize: 'var(--font-xs)',
                      color: 'var(--text-muted)',
                      marginBottom: 'var(--space-3)'
                    }}
                  >
                    <Clock size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{vol.experience}</span>
                  </div>

                  {/* Transport */}
                  {vol.transportation && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: 'var(--font-xs)',
                        color: 'var(--text-secondary)',
                        marginBottom: 'var(--space-3)'
                      }}
                    >
                      <Car size={13} />
                      <span>{vol.transportation}</span>
                    </div>
                  )}
                </div>

                {/* Eligibility Footer */}
                <div
                  style={{
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: 'var(--space-2)',
                    marginTop: 'var(--space-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 'var(--font-xs)'
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                  <Badge variant={isEligible ? 'success' : 'neutral'}>
                    {vol.eligibility}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NearbyVolunteersList;
