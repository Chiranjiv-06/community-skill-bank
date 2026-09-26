import React from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import CertificationStatusBadge from './CertificationStatusBadge';
import {
  Award,
  Building2,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

/**
 * Reusable Certification Credential Card
 * Supports both volunteer and administrator views
 */
export const CertificationCard = ({
  certification,
  isAdmin = false,
  onVerify = null,
  onReject = null,
  onRevoke = null,
  onDelete = null
}) => {
  if (!certification) return null;

  const isVerified = certification.verificationStatus === 'verified';
  const isPending = certification.verificationStatus === 'pending';
  const isRejected = certification.verificationStatus === 'rejected';

  return (
    <Card
      className="certification-card"
      style={{
        borderLeft: isVerified
          ? '4px solid var(--color-success)'
          : isPending
          ? '4px solid var(--color-warning)'
          : '4px solid var(--color-critical)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Badge variant="primary" style={{ fontSize: '11px' }}>
              {certification.category}
            </Badge>
            {certification.credentialId && (
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                ID: {certification.credentialId}
              </span>
            )}
          </div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: 'var(--color-text-primary)' }}>
            {certification.name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            <Building2 size={15} color="var(--color-primary)" />
            <span>{certification.issuingOrg}</span>
          </div>
        </div>

        <div>
          <CertificationStatusBadge
            verificationStatus={certification.verificationStatus}
            status={certification.status}
          />
        </div>
      </div>

      {/* Volunteer Details (Admin view) */}
      {isAdmin && certification.volunteerName && (
        <div
          style={{
            background: 'var(--color-surface-hover)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.88rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={15} color="var(--color-primary)" />
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {certification.volunteerName}
            </span>
            <span style={{ color: 'var(--color-text-muted)' }}>
              ({certification.volunteerEmail || 'volunteer@skillbank.org'})
            </span>
          </div>
          <Badge variant="neutral" style={{ fontSize: '10px' }}>
            ID: {certification.volunteerId}
          </Badge>
        </div>
      )}

      {/* Dates and Document Info */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--spacing-sm)',
          fontSize: '0.85rem',
          color: 'var(--color-text-secondary)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={14} color="var(--color-text-muted)" />
          <span>Issued: <strong>{certification.issueDate || 'N/A'}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={14} color="var(--color-text-muted)" />
          <span>Expires: <strong>{certification.expiryDate || 'Non-Expiring'}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileText size={14} color="var(--color-primary)" />
          <span>Document: <strong style={{ color: 'var(--color-text-primary)' }}>{certification.documentName || 'Certificate.pdf'}</strong></span>
        </div>
      </div>

      {/* Verification Evidence or Rejection Notes */}
      {isVerified && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.84rem',
            color: 'var(--color-success)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}
        >
          <ShieldCheck size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <strong>Verified Credential:</strong> {certification.evidenceNotes || 'Verified against official institutional registry.'}
            {certification.verifiedBy && (
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Clearance granted by {certification.verifiedBy} on {new Date(certification.verifiedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      )}

      {isPending && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.84rem',
            color: 'var(--color-warning)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}
        >
          <AlertTriangle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <strong>Under Command Review:</strong> {certification.evidenceNotes || 'Credential submitted. Awaiting administrative verification.'}
          </div>
        </div>
      )}

      {isRejected && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.84rem',
            color: 'var(--color-critical)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}
        >
          <XCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <strong>Verification Rejected:</strong> {certification.rejectionReason || 'Documentation could not be verified.'}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          marginTop: 'auto',
          paddingTop: 'var(--spacing-sm)',
          borderTop: '1px solid var(--color-border-subtle)',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a
            href={certification.documentUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (certification.documentUrl === '#') {
                e.preventDefault();
                alert(`Viewing simulated credential document: ${certification.documentName || 'Certificate.pdf'}`);
              }
            }}
            style={{
              color: 'var(--color-primary)',
              fontSize: '0.84rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            <ExternalLink size={14} />
            <span>View Supporting Document</span>
          </a>
        </div>

        {/* Admin Controls */}
        {isAdmin && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {isPending && (
              <>
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => onVerify && onVerify(certification)}
                >
                  <CheckCircle size={14} style={{ marginRight: '4px' }} />
                  Verify & Approve
                </Button>
                <Button
                  size="sm"
                  variant="critical"
                  onClick={() => onReject && onReject(certification)}
                >
                  <XCircle size={14} style={{ marginRight: '4px' }} />
                  Reject
                </Button>
              </>
            )}

            {isVerified && onRevoke && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRevoke(certification)}
              >
                Revoke Clearance
              </Button>
            )}

            {isRejected && onVerify && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => onVerify(certification)}
              >
                Re-evaluate Credential
              </Button>
            )}

            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(certification)}
                style={{ color: 'var(--color-text-muted)' }}
              >
                Delete
              </Button>
            )}
          </div>
        )}

        {/* Volunteer Controls */}
        {!isAdmin && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {onDelete && isPending && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(certification)}
                style={{ color: 'var(--color-text-muted)' }}
              >
                Withdraw Submission
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default CertificationCard;
