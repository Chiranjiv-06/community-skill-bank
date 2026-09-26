import React, { useState } from 'react';
import {
  Sparkles,
  Award,
  Navigation,
  ExternalLink,
  AlertCircle,
  Eye,
  Info,
  ClipboardList
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import LoadingState from '../states/LoadingState';
import EmptyState from '../states/EmptyState';
import RecommendationDetailModal from './RecommendationDetailModal';

/**
 * Reusable Volunteer Recommendations Section (Admin Only)
 * Displays top-ranked recommendations with match & recommendation scores.
 * Integrated with Stage 7 Assignment dispatch.
 */
export const VolunteerRecommendationsSection = ({
  recommendations = [],
  isLoading = false,
  error = null,
  onAssign = null
}) => {
  const [selectedRec, setSelectedRec] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenInspect = (rec) => {
    setSelectedRec(rec);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return <LoadingState message="Synthesizing multi-variable responder recommendations..." minHeight="280px" />;
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
          <strong>Error Loading Recommendations:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Dev Recommendations Notice */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'rgba(249, 115, 22, 0.08)',
          border: '1px solid rgba(249, 115, 22, 0.25)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-5)',
          fontSize: 'var(--font-sm)',
          color: 'var(--text-secondary)'
        }}
      >
        <Sparkles size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>Intelligent Recommendation Rankings (Admin Only):</strong> Candidates are sorted based on multi-factor suitability (match score, distance, verified certifications, fatigue safety). Responder assignment & response management belong to Stage 7.
        </div>
      </div>

      {recommendations.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={32} color="var(--text-muted)" />}
          title="No recommendations generated"
          description="There are currently no recommended responders meeting the priority surge requirements."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {recommendations.map((rec) => (
            <Card
              key={rec.id}
              hoverable
              style={{
                padding: 'var(--space-4) var(--space-5)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                alignItems: 'center',
                gap: 'var(--space-4)',
                borderLeft: `4px solid ${
                  rec.priority === 'Critical Surge'
                    ? 'var(--color-critical)'
                    : 'var(--color-primary)'
                }`
              }}
            >
              {/* Volunteer & Requirement */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: 'rgba(249, 115, 22, 0.2)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700
                    }}
                  >
                    #{rec.rank}
                  </span>
                  <h4 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {rec.volunteerName}
                  </h4>
                </div>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>
                  Target: {rec.requirement}
                </span>
              </div>

              {/* Recommendation & Match Scores */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                    Rec Score
                  </span>
                  <strong style={{ fontSize: 'var(--font-lg)', color: 'var(--color-primary)' }}>
                    {rec.recommendationScore}
                  </strong>
                </div>

                <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: 'var(--space-3)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                    Match Score
                  </span>
                  <strong style={{ fontSize: 'var(--font-base)', color: 'var(--color-info)' }}>
                    {rec.matchScore}
                  </strong>
                </div>
              </div>

              {/* Distance & Certifications */}
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Navigation size={13} color="var(--color-primary)" />
                  <span>Proximity: <strong>{rec.distance}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={13} color="var(--color-warning)" />
                  <span>{rec.certificationCount} Certifications</span>
                </div>
              </div>

              {/* Priority & Actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 'var(--space-2)',
                  flexWrap: 'wrap'
                }}
              >
                <Badge variant={rec.priority === 'Critical Surge' ? 'critical' : 'warning'}>
                  {rec.priority}
                </Badge>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenInspect(rec)}
                  icon={<Eye size={14} />}
                >
                  Inspect
                </Button>

                {onAssign && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onAssign(rec)}
                    icon={<ClipboardList size={14} />}
                  >
                    Assign Responder
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Inspect Modal */}
      <RecommendationDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recommendation={selectedRec}
        onAssign={onAssign}
      />
    </div>
  );
};

export default VolunteerRecommendationsSection;
