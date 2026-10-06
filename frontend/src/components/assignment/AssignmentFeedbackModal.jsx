import React, { useState } from 'react';
import { Star, Clock, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import { trustService } from '../../services/trustService';

const RATING_OPTIONS = [
  { value: '5', label: '5 — Outstanding Operational Performance' },
  { value: '4', label: '4 — Commendable / Exceeded Quota' },
  { value: '3', label: '3 — Satisfactory / Met Requirements' },
  { value: '2', label: '2 — Marginal / Needs Supervised Guidance' },
  { value: '1', label: '1 — Unsatisfactory / Protocol Non-compliance' }
];

export const AssignmentFeedbackModal = ({
  isOpen,
  onClose,
  assignment,
  onSuccess = null
}) => {
  const [rating, setRating] = useState('5');
  const [hoursServed, setHoursServed] = useState('4.0');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!assignment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hours = parseFloat(hoursServed);
    if (isNaN(hours) || hours <= 0) {
      setError('Please enter a valid positive number of service hours.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await trustService.submitAssignmentFeedback(
        assignment.emergencyId,
        assignment.id,
        {
          rating: parseInt(rating, 10),
          hoursServed: hours,
          feedbackNotes
        }
      );
      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('[AssignmentFeedbackModal] Error submitting feedback:', err);
      setError(err.message || 'Failed to submit assignment feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Operational Feedback & Hours"
      icon={<ShieldCheck size={20} color="var(--color-primary)" />}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
          Submitting performance evaluation for responder{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{assignment.volunteerName}</strong> on{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{assignment.emergencyTitle}</strong>.
        </div>

        {error && (
          <div
            style={{
              padding: 'var(--space-3)',
              background: 'var(--color-critical-bg)',
              border: '1px solid var(--color-critical-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-critical)',
              fontSize: 'var(--font-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            style={{
              padding: 'var(--space-3)',
              background: 'var(--color-success-bg)',
              border: '1px solid var(--color-success-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-success)',
              fontSize: 'var(--font-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}
          >
            <CheckCircle size={16} />
            <span>Feedback and verified service hours recorded successfully!</span>
          </div>
        )}

        <Select
          label="Supervisor Performance Rating"
          options={RATING_OPTIONS}
          value={rating}
          onChange={(e) => setRating(e.target.value)}
        />

        <Input
          label="Verified Service Hours Served"
          type="number"
          step="0.5"
          min="0.5"
          max="168"
          required
          value={hoursServed}
          onChange={(e) => setHoursServed(e.target.value)}
        />

        <Textarea
          label="Performance Notes & Debrief Summary"
          placeholder="Document tactical capabilities demonstrated, leadership observations, or safety notes..."
          rows={3}
          value={feedbackNotes}
          onChange={(e) => setFeedbackNotes(e.target.value)}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || success}>
            {isSubmitting ? 'Recording...' : 'Submit Evaluation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignmentFeedbackModal;
