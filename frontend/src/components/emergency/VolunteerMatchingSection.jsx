import React, { useState, useMemo } from 'react';
import {
  GitMerge,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Navigation,
  Clock,
  Award,
  Zap,
  Info,
  ClipboardList
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
 * Reusable Volunteer Matching Section
 * Displays algorithmic match candidates, match scores, distance, and eligibility.
 * Integrated with Stage 7 Assignment dispatch.
 */
export const VolunteerMatchingSection = ({
  matches = [],
  isLoading = false,
  error = null,
  emergencyTitle = '',
  onAssign = null
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('ALL');

  // Unique skills for filtering
  const availableSkills = useMemo(() => {
    const set = new Set();
    matches.forEach((m) => {
      if (m.skill) set.add(m.skill);
    });
    return Array.from(set);
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (skillFilter !== 'ALL' && m.skill !== skillFilter) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = m.volunteerName.toLowerCase().includes(query);
        const matchesSkill = m.skill.toLowerCase().includes(query);
        const matchesScore = m.matchScore.toLowerCase().includes(query);
        if (!matchesName && !matchesSkill && !matchesScore) return false;
      }
      return true;
    });
  }, [matches, searchQuery, skillFilter]);

  if (isLoading) {
    return <LoadingState message="Running multi-criteria candidate match evaluation..." minHeight="300px" />;
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
        <AlertCircle size={20} />
        <div>
          <strong>Error Loading Matching Candidates:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Backend Scoring Explanatory Notice */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-5)',
          fontSize: 'var(--font-sm)',
          color: 'var(--text-secondary)'
        }}
      >
        <Info size={18} color="var(--color-info)" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>Algorithmic Matching Engine (Dev State):</strong> Match Scores represent backend multi-parameter algorithmic evaluation (skill fit, proximity radius, proficiency threshold, readiness). Real scoring will execute via FastAPI in Stage 17.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-5)',
          alignItems: 'center'
        }}
      >
        <div style={{ position: 'relative' }}>
          <Input
            placeholder="Search candidate name or skill..."
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
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            style={{ marginBottom: 0 }}
            options={[
              { value: 'ALL', label: 'All Matched Capabilities' },
              ...availableSkills.map((s) => ({ value: s, label: s }))
            ]}
          />
        </div>

        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', textAlign: 'right' }}>
          Showing <strong>{filteredMatches.length}</strong> of <strong>{matches.length}</strong> matched candidates
        </div>
      </div>

      {/* Matches Grid */}
      {matches.length === 0 ? (
        <EmptyState
          icon={<GitMerge size={32} color="var(--text-muted)" />}
          title="No candidate matches found"
          description="There are currently no active responder matches meeting the emergency requirements."
        />
      ) : filteredMatches.length === 0 ? (
        <EmptyState
          icon={<Search size={32} color="var(--text-muted)" />}
          title="No candidates match active filter"
          description="No matched responders match your search keywords or skill requirement filter."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSkillFilter('ALL');
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
            gap: 'var(--space-4)'
          }}
        >
          {filteredMatches.map((item) => {
            const isEligible = !item.eligibility.toLowerCase().includes('below');
            return (
              <Card
                key={item.id}
                style={{
                  padding: 'var(--space-5)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `3px solid ${isEligible ? 'var(--color-primary)' : 'var(--border-default)'}`
                }}
              >
                <div>
                  {/* Top Bar: Name & Match Score */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 'var(--space-3)'
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          fontSize: 'var(--font-base)',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          marginBottom: '2px'
                        }}
                      >
                        {item.volunteerName}
                      </h4>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                        {item.category}
                      </span>
                    </div>

                    {/* Match Score Badge */}
                    <div
                      style={{
                        textAlign: 'center',
                        background: 'rgba(249, 115, 22, 0.12)',
                        border: '1px solid rgba(249, 115, 22, 0.35)',
                        borderRadius: 'var(--radius-md)',
                        padding: '4px 10px'
                      }}
                    >
                      <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Match Score
                      </span>
                      <strong style={{ fontSize: 'var(--font-base)', color: 'var(--color-primary)' }}>
                        {item.matchScore}
                      </strong>
                    </div>
                  </div>

                  {/* Skill & Proficiency */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: 'var(--space-3)',
                      background: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      marginBottom: 'var(--space-3)',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>
                        Matched Requirement:
                      </span>
                      <strong style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>
                        {item.skill}
                      </strong>
                    </div>
                    <Badge variant={PROFICIENCY_BADGES[item.proficiency] || 'neutral'}>
                      {item.proficiency}
                    </Badge>
                  </div>

                  {/* Experience & Proximity Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={13} color="var(--text-muted)" />
                      <span>{item.experience}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Navigation size={13} color="var(--color-primary)" />
                      <span>Proximity: <strong>{item.distance}</strong> from incident epicenter</span>
                    </div>
                  </div>
                </div>

                {/* Eligibility Status */}
                <div
                  style={{
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: 'var(--space-3)',
                    marginTop: 'var(--space-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 'var(--font-xs)',
                    gap: 'var(--space-2)',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Eligibility:</span>
                    <Badge variant={isEligible ? 'success' : 'neutral'}>
                      {item.eligibility}
                    </Badge>
                  </div>

                  {onAssign && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onAssign(item)}
                      icon={<ClipboardList size={13} />}
                    >
                      Assign Responder
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VolunteerMatchingSection;
