import React, { useState } from 'react';
import Modal from '../common/Modal';
import Textarea from '../common/Textarea';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { ShieldCheck, XCircle, AlertTriangle, User, Building2, Calendar, FileText } from 'lucide-react';

/**
 * Admin Verification Action Modal
 * Allows administrators to formally Verify/Approve, Reject, or Revoke credentials
 */
export const VerificationActionModal = ({
  isOpen,
  onClose,
  certification,
  actionType = 'verify', // 'verify' | 'reject' | 'revoke'
  onConfirm
}) => {
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !certification) return null;

  const isVerify = actionType === 'verify';
  const isReject = actionType === 'reject';
  const isRevoke = actionType === 'revoke';

  const title = isVerify
    ? 'Verify & Approve Emergency Credential'
    : isReject
    ? 'Reject Credential Verification'
    : 'Revoke Verified Credential';

  const defaultReason = isVerify
    ? 'Credential verified against official registry. Clearances approved for incident dispatch.'
    : isReject
    ? 'Submitted documentation could not be verified or does not meet minimum standards.'
    : 'Credential expired or revoked by issuing authority.';

  const handleAction = async () => {
    setIsProcessing(true);
    try {
      await onConfirm(certification.id, notes.trim() || defaultReason);
      setIsProcessing(false);
      onClose();
    } catch (err) {
      setIsProcessing(false);
      alert(err.message || 'Verification action failed.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {/* Credential Snapshot */}
        <div
          style={{
            background: 'var(--color-surface-hover)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {certification.name}
            </span>
            <Badge variant="primary">{certification.category}</Badge>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
            <User size={14} color="var(--color-primary)" />
            <span>Volunteer: <strong>{certification.volunteerName}</strong> ({certification.volunteerEmail})</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
            <Building2 size={14} color="var(--color-text-muted)" />
            <span>Issuing Organization: <strong>{certification.issuingOrg}</strong></span>
          </div>

          <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            <span>Issued: {certification.issueDate}</span>
            <span>Expires: {certification.expiryDate || 'Non-Expiring'}</span>
            <span>Document: {certification.documentName}</span>
          </div>

          {certification.evidenceNotes && (
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
              Volunteer Notes: "{certification.evidenceNotes}"
            </div>
          )}
        </div>

        {/* Action Explanation / Instructions */}
        {isVerify && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: 'var(--color-success)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <ShieldCheck size={18} />
            <span>
              Approving will mark this credential as <strong>Verified Active</strong> and reflect in the volunteer's Trust Passport and Stage 6 Matching clearances.
            </span>
          </div>
        )}

        {isReject && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: 'var(--color-critical)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <XCircle size={18} />
            <span>
              Rejecting will notify the volunteer and log your administrative explanation on their record.
            </span>
          </div>
        )}

        {isRevoke && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              color: 'var(--color-warning)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertTriangle size={18} />
            <span>
              Revoking will remove this credential's active standing in deployment eligibility.
            </span>
          </div>
        )}

        {/* Reason / Notes Input */}
        <Textarea
          label={isVerify ? 'Clearance Verification Notes' : 'Administrative Decision Reason *'}
          placeholder={defaultReason}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          required={!isVerify}
        />

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: 'var(--spacing-sm)' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>

          {isVerify && (
            <Button variant="success" onClick={handleAction} disabled={isProcessing}>
              <ShieldCheck size={16} style={{ marginRight: '6px' }} />
              {isProcessing ? 'Verifying...' : 'Confirm Verification & Approve'}
            </Button>
          )}

          {isReject && (
            <Button variant="critical" onClick={handleAction} disabled={isProcessing}>
              <XCircle size={16} style={{ marginRight: '6px' }} />
              {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          )}

          {isRevoke && (
            <Button variant="critical" onClick={handleAction} disabled={isProcessing}>
              <AlertTriangle size={16} style={{ marginRight: '6px' }} />
              {isProcessing ? 'Revoking...' : 'Revoke Clearance'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default VerificationActionModal;
