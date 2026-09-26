import {
  Sparkles,
  Award,
  Navigation,
  Clock,
  Car,
  Phone,
  ShieldCheck,
  CheckCircle,
  Info,
  ClipboardList
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';

/**
 * Inspection Modal for Recommended Responder Candidate
 * Displays detailed recommendation score breakdown and reasoning.
 * Integrated with Stage 7 Assignment dispatch.
 */
export const RecommendationDetailModal = ({
  isOpen,
  onClose,
  recommendation = null,
  onAssign = null
}) => {
  if (!recommendation) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={20} color="var(--color-primary)" />
          <span>Recommended Responder Inspection</span>
        </div>
      }
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 'var(--space-3)' }}>
          <Button variant="outline" onClick={onClose}>
            Close Inspection
          </Button>
          {onAssign && (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onAssign(recommendation);
              }}
              icon={<ClipboardList size={16} />}
            >
              Assign This Volunteer
            </Button>
          )}
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Candidate Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-4)',
            background: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div>
            <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {recommendation.volunteerName}
            </h3>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
              Target Requirement: <strong>{recommendation.requirement}</strong>
            </span>
          </div>

          <Badge variant={recommendation.priority === 'Critical Surge' ? 'critical' : 'warning'}>
            {recommendation.priority}
          </Badge>
        </div>

        {/* Scores Overview Card */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 'var(--space-3)'
          }}
        >
          <div
            style={{
              padding: 'var(--space-3)',
              background: 'rgba(249, 115, 22, 0.08)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center'
            }}
          >
            <span style={{ display: 'block', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
              Recommendation Score
            </span>
            <strong style={{ fontSize: 'var(--font-xl)', color: 'var(--color-primary)' }}>
              {recommendation.recommendationScore}
            </strong>
          </div>

          <div
            style={{
              padding: 'var(--space-3)',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center'
            }}
          >
            <span style={{ display: 'block', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
              Skill Match Score
            </span>
            <strong style={{ fontSize: 'var(--font-xl)', color: 'var(--color-info)' }}>
              {recommendation.matchScore}
            </strong>
          </div>

          <div
            style={{
              padding: 'var(--space-3)',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center'
            }}
          >
            <span style={{ display: 'block', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
              Proximity Transit
            </span>
            <strong style={{ fontSize: 'var(--font-xl)', color: 'var(--color-success)' }}>
              {recommendation.distance}
            </strong>
          </div>
        </div>

        {/* Tactical Qualifications & Reliability */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <Award size={16} color="var(--color-primary)" />
            <span>Certifications: <strong>{recommendation.certificationCount} Verified Emergency Credentials</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <Clock size={16} color="var(--text-muted)" />
            <span>Field Experience: {recommendation.experience}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <Car size={16} color="var(--color-info)" />
            <span>Mobility Transport: {recommendation.transportation}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <ShieldCheck size={16} color="var(--color-success)" />
            <span>Historical Response Trust: <strong>{recommendation.trustScore}</strong></span>
          </div>
        </div>

        {/* Detailed Recommendation Reasoning */}
        <div
          style={{
            padding: 'var(--space-4)',
            background: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-md)',
            borderLeft: '4px solid var(--color-primary)',
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}
        >
          <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
            Algorithmic Recommendation Rationale:
          </strong>
          {recommendation.reasoning}
        </div>
      </div>
    </Modal>
  );
};

export default RecommendationDetailModal;
