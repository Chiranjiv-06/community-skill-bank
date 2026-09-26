import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { ShieldCheck, AlertCircle, Clock, User, Layers, Hash } from 'lucide-react';

/**
 * Inspection modal for an individual audit event record
 * Guaranteed sanitization: no credentials, JWTs, or secrets.
 */
export const AuditDetailModal = ({
  isOpen,
  onClose,
  log
}) => {
  if (!log) return null;

  const isSuccess = log.status === 'Success';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Audit Event Record"
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Event Header Banner */}
        <div className={`sim-banner ${isSuccess ? '' : 'warning'}`}>
          <div className="sim-banner-content">
            {isSuccess ? (
              <ShieldCheck size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
            ) : (
              <AlertCircle size={18} style={{ color: 'var(--color-critical)', flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600 }}>
              Action: <code style={{ color: 'var(--color-orange-400)' }}>{log.action}</code>
            </span>
          </div>
          <Badge variant={isSuccess ? 'success' : 'danger'}>
            {log.status.toUpperCase()}
          </Badge>
        </div>

        {/* Detailed Fields Grid */}
        <div className="audit-detail-grid">
          <div className="audit-detail-item">
            <span className="audit-detail-label">Timestamp</span>
            <span className="audit-detail-val">
              {new Date(log.timestamp).toLocaleString()}
            </span>
          </div>

          <div className="audit-detail-item">
            <span className="audit-detail-label">Actor / Initiator</span>
            <span className="audit-detail-val" style={{ color: 'var(--color-orange-400)' }}>
              {log.actor}
            </span>
          </div>

          <div className="audit-detail-item">
            <span className="audit-detail-label">Entity Domain</span>
            <span className="audit-detail-val">{log.entity}</span>
          </div>

          <div className="audit-detail-item">
            <span className="audit-detail-label">Entity ID</span>
            <span className="audit-detail-val" style={{ fontFamily: 'var(--font-mono)' }}>
              {log.entityId}
            </span>
          </div>

          <div className="audit-detail-item full-width">
            <span className="audit-detail-label">Trace Request ID</span>
            <span className="audit-detail-val" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
              {log.requestId}
            </span>
          </div>
        </div>

        {/* Operational Context Metadata */}
        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <div>
            <span className="audit-detail-label" style={{ display: 'block', marginBottom: '6px' }}>
              Event Metadata Attributes
            </span>
            <pre className="audit-json-box">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </div>
        )}

        {/* Security Compliance Note */}
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-2)' }}>
          🔒 Immutable compliance record. Authentication tokens, passwords, and private keys are scrubbed prior to persistence.
        </div>

        {/* Close Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AuditDetailModal;
