import React, { useState } from 'react';
import { CheckCircle2, XCircle, Navigation, CheckCircle, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Textarea from '../common/Textarea';

/**
 * Reusable Volunteer Response Modal
 * Supports:
 * - 'respond': Accept or Decline assignment
 * - 'start': Mark assignment as In Progress
 * - 'complete': Mark assignment as Completed with completion notes
 */
export const VolunteerResponseModal = ({
  isOpen,
  onClose,
  assignment,
  mode = 'respond', // 'respond' | 'start' | 'complete'
  onSubmit,
  isLoading = false
}) => {
  const [responseType, setResponseType] = useState('accepted'); // 'accepted' | 'declined'
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  if (!assignment) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (mode === 'respond' && responseType === 'declined' && !notes.trim()) {
      setError('Please provide a brief reason when declining an emergency assignment.');
      return;
    }

    if (mode === 'complete' && !notes.trim()) {
      setError('Please provide a brief completion summary / mission report.');
      return;
    }

    if (mode === 'respond') {
      onSubmit({ response: responseType, notes: notes.trim() });
    } else if (mode === 'start') {
      onSubmit({ notes: notes.trim() });
    } else if (mode === 'complete') {
      onSubmit({ completionNotes: notes.trim() });
    }
  };

  const getTitle = () => {
    if (mode === 'respond') return 'Respond to Emergency Assignment';
    if (mode === 'start') return 'Deploy & Mark In Progress';
    if (mode === 'complete') return 'Complete Emergency Assignment';
    return 'Assignment Update';
  };

  const getSubtitle = () => {
    if (mode === 'respond') return 'Confirm your availability and deploy readiness for this disaster incident.';
    if (mode === 'start') return 'Confirm check-in at incident staging area or active on-scene transit.';
    if (mode === 'complete') return 'File mission conclusion notes and conclude operational deployment.';
    return '';
  };

  const getIcon = () => {
    if (mode === 'respond') return <CheckCircle2 size={22} color="var(--color-primary)" />;
    if (mode === 'start') return <Navigation size={22} color="var(--color-info)" />;
    return <CheckCircle size={22} color="var(--color-success)" />;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      subtitle={getSubtitle()}
      icon={getIcon()}
      maxWidth="560px"
    >
      <form onSubmit={handleSubmit}>
        {/* Assignment Briefing Summary */}
        <div
          style={{
            padding: 'var(--space-4)',
            background: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            fontSize: 'var(--font-sm)'
          }}
        >
          <div>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Emergency Incident</span>
            <strong style={{ color: 'var(--text-primary)' }}>{assignment.emergencyTitle}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Assigned Skill</span>
              <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{assignment.skill}</span>
            </div>
            <div>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Staging Area</span>
              <span style={{ color: 'var(--text-secondary)' }}>{assignment.stagingArea}</span>
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--color-critical-bg)',
              border: '1px solid var(--color-critical-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-critical)',
              fontSize: 'var(--font-xs)',
              marginBottom: 'var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}
          >
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Mode: Respond (Accept or Decline Choice) */}
        {mode === 'respond' && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
              Response Decision *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <button
                type="button"
                onClick={() => setResponseType('accepted')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  background: responseType === 'accepted' ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-surface)',
                  border: `2px solid ${responseType === 'accepted' ? 'var(--color-success)' : 'var(--border-default)'}`,
                  color: responseType === 'accepted' ? 'var(--color-success)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 'var(--font-sm)'
                }}
              >
                <CheckCircle2 size={18} />
                <span>Accept Deployment</span>
              </button>

              <button
                type="button"
                onClick={() => setResponseType('declined')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  background: responseType === 'declined' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-surface)',
                  border: `2px solid ${responseType === 'declined' ? 'var(--color-critical)' : 'var(--border-default)'}`,
                  color: responseType === 'declined' ? 'var(--color-critical)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 'var(--font-sm)'
                }}
              >
                <XCircle size={18} />
                <span>Decline Deployment</span>
              </button>
            </div>
          </div>
        )}

        {/* Notes Field */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Textarea
            label={
              mode === 'respond'
                ? responseType === 'accepted' ? 'Response Notes & ETA (Optional)' : 'Reason for Declining *'
                : mode === 'start'
                ? 'Check-In Notes & On-Scene Telemetry (Optional)'
                : 'Mission Completion Summary / Field Log *'
            }
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              mode === 'respond'
                ? responseType === 'accepted' ? 'e.g. En route with vehicle, ETA 15 minutes.' : 'e.g. Out of town or conflicting medical shift...'
                : mode === 'start'
                ? 'e.g. Checked in at Gate 3 with supervisor. Commencing sweep.'
                : 'e.g. All assigned search sectors completed; no further casualties...'
            }
            rows={3}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>

          <Button
            variant={
              mode === 'respond' && responseType === 'declined'
                ? 'ghost'
                : 'primary'
            }
            type="submit"
            isLoading={isLoading}
            style={
              mode === 'respond' && responseType === 'declined'
                ? { color: 'var(--color-critical)', borderColor: 'var(--color-critical)' }
                : {}
            }
          >
            {mode === 'respond'
              ? responseType === 'accepted' ? 'Confirm Acceptance' : 'Decline Assignment'
              : mode === 'start'
              ? 'Start In-Progress Response'
              : 'Submit Mission Completion'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default VolunteerResponseModal;
