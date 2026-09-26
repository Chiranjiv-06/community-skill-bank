import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/states/EmptyState';
import LoadingState from '../../components/states/LoadingState';
import ErrorState from '../../components/states/ErrorState';
import CertificationCard from '../../components/trust/CertificationCard';
import VerificationActionModal from '../../components/trust/VerificationActionModal';
import { certificationService } from '../../services/certificationService';
import { useAuth } from '../../context/AuthContext';
import { ListChecks, CheckCircle2, Clock, ShieldCheck, RefreshCw } from 'lucide-react';

export const VerificationQueuePage = () => {
  const { user } = useAuth();
  const [pendingCerts, setPendingCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verification Action Modal state
  const [activeModalCert, setActiveModalCert] = useState(null);
  const [actionType, setActionType] = useState('verify'); // 'verify' | 'reject'
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await certificationService.getPendingVerifications();
      setPendingCerts(data);
    } catch (err) {
      console.error('[VerificationQueuePage] Error loading pending queue:', err);
      setError('Failed to load pending verification queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleOpenAction = (cert, type) => {
    setActiveModalCert(cert);
    setActionType(type);
    setIsModalOpen(true);
  };

  const handleConfirmAction = async (certId, notesOrReason) => {
    const adminName = user?.name || 'Cmdr. Sarah Vance';
    if (actionType === 'verify') {
      await certificationService.verifyCertification(certId, { adminName, notes: notesOrReason });
    } else {
      await certificationService.rejectCertification(certId, { adminName, reason: notesOrReason });
    }
    await loadQueue();
  };

  return (
    <div className="verification-queue-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Header */}
      <PageHeader
        title="Verification Queue"
        description="Review and audit pending volunteer credential submissions, disaster licenses, and FEMA qualifications awaiting administrative clearance."
        actions={
          <Button variant="outline" onClick={loadQueue}>
            <RefreshCw size={15} style={{ marginRight: '6px' }} />
            Refresh Queue
          </Button>
        }
      />

      {/* Queue Status Alert */}
      <div
        style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={20} color="var(--color-warning)" />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
              Pending Submissions Awaiting Clearance
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
              All approved credentials immediately increase volunteer trust scores and unlock high-hazard dispatch clearances.
            </div>
          </div>
        </div>

        <Badge variant="warning" style={{ fontSize: '13px', padding: '4px 10px', fontWeight: 700 }}>
          {pendingCerts.length} Pending Actions
        </Badge>
      </div>

      {/* Content */}
      {loading && <LoadingState message="Auditing pending volunteer credential submissions..." />}

      {error && (
        <ErrorState
          title="Could Not Load Verification Queue"
          message={error}
          onRetry={loadQueue}
        />
      )}

      {!loading && !error && pendingCerts.length === 0 && (
        <EmptyState
          title="Verification Queue is Clear"
          message="There are currently no volunteer certifications or credentials awaiting administrative review."
          action={
            <Button variant="outline" onClick={loadQueue}>
              <RefreshCw size={15} style={{ marginRight: '6px' }} />
              Check for New Submissions
            </Button>
          }
        />
      )}

      {!loading && !error && pendingCerts.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: 'var(--spacing-md)'
          }}
        >
          {pendingCerts.map((cert) => (
            <CertificationCard
              key={cert.id}
              certification={cert}
              isAdmin={true}
              onVerify={(c) => handleOpenAction(c, 'verify')}
              onReject={(c) => handleOpenAction(c, 'reject')}
            />
          ))}
        </div>
      )}

      {/* Action Modal */}
      <VerificationActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        certification={activeModalCert}
        actionType={actionType}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};

export default VerificationQueuePage;
