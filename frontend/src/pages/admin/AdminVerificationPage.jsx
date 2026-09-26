import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import EmptyState from '../../components/states/EmptyState';
import LoadingState from '../../components/states/LoadingState';
import ErrorState from '../../components/states/ErrorState';
import CertificationCard from '../../components/trust/CertificationCard';
import VerificationActionModal from '../../components/trust/VerificationActionModal';
import TrustTierBadge from '../../components/trust/TrustTierBadge';
import { certificationService } from '../../services/certificationService';
import { trustService } from '../../services/trustService';
import { useAuth } from '../../context/AuthContext';
import { CERTIFICATION_CATEGORIES } from '../../data/devTrust';
import {
  CheckCheck,
  ShieldCheck,
  Clock,
  XCircle,
  Users,
  Search,
  Filter,
  Award,
  RefreshCw,
  Eye
} from 'lucide-react';

export const AdminVerificationPage = () => {
  const { user } = useAuth();
  const [certifications, setCertifications] = useState([]);
  const [trustProfiles, setTrustProfiles] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab mode: 'credentials' | 'trust_profiles'
  const [activeTab, setActiveTab] = useState('credentials');

  // Filter state
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [activeModalCert, setActiveModalCert] = useState(null);
  const [actionType, setActionType] = useState('verify'); // 'verify' | 'reject' | 'revoke'
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [certs, profiles, sum] = await Promise.all([
        certificationService.getCertifications(),
        trustService.getAllTrustProfiles(),
        trustService.getVerificationSummary()
      ]);
      setCertifications(certs);
      setTrustProfiles(profiles);
      setSummary(sum);
    } catch (err) {
      console.error('[AdminVerificationPage] Error loading verification data:', err);
      setError('Failed to load verification database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
    } else if (actionType === 'reject') {
      await certificationService.rejectCertification(certId, { adminName, reason: notesOrReason });
    } else if (actionType === 'revoke') {
      await certificationService.revokeCertification(certId, { adminName, reason: notesOrReason });
    }
    await loadData();
  };

  const handleDelete = async (cert) => {
    if (window.confirm(`Permanently delete certification record for "${cert.name}" (${cert.volunteerName})?`)) {
      await certificationService.deleteCertification(cert.id);
      await loadData();
    }
  };

  // Filtered certifications
  const filteredCerts = certifications.filter((cert) => {
    if (statusFilter !== 'ALL' && cert.verificationStatus !== statusFilter) {
      return false;
    }
    if (categoryFilter !== 'ALL' && cert.category !== categoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = cert.name?.toLowerCase().includes(q);
      const matchVol = cert.volunteerName?.toLowerCase().includes(q);
      const matchOrg = cert.issuingOrg?.toLowerCase().includes(q);
      const matchCred = cert.credentialId?.toLowerCase().includes(q);
      if (!matchName && !matchVol && !matchOrg && !matchCred) return false;
    }
    return true;
  });

  const verifiedCount = certifications.filter((c) => c.verificationStatus === 'verified').length;
  const pendingCount = certifications.filter((c) => c.verificationStatus === 'pending').length;
  const rejectedCount = certifications.filter((c) => c.verificationStatus === 'rejected').length;

  return (
    <div className="admin-verification-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Header */}
      <PageHeader
        title="Volunteer & Credential Verification"
        description="Administrative verification framework for validating national disaster certifications, medical licenses, and background checks."
        actions={
          <Button variant="outline" onClick={loadData}>
            <RefreshCw size={15} style={{ marginRight: '6px' }} />
            Refresh Records
          </Button>
        }
      />

      {/* KPI Counters */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--spacing-md)'
        }}
      >
        <div
          onClick={() => {
            setActiveTab('credentials');
            setStatusFilter('ALL');
          }}
          style={{
            background: 'var(--color-surface)',
            border: activeTab === 'credentials' && statusFilter === 'ALL' ? '1px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Total Credentials</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>
            {certifications.length}
          </div>
        </div>

        <div
          onClick={() => {
            setActiveTab('credentials');
            setStatusFilter('pending');
          }}
          style={{
            background: 'var(--color-surface)',
            border: activeTab === 'credentials' && statusFilter === 'pending' ? '1px solid var(--color-warning)' : '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-warning)' }}>
            <Clock size={15} />
            <span>Awaiting Review</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-warning)', marginTop: '4px' }}>
            {pendingCount}
          </div>
        </div>

        <div
          onClick={() => {
            setActiveTab('credentials');
            setStatusFilter('verified');
          }}
          style={{
            background: 'var(--color-surface)',
            border: activeTab === 'credentials' && statusFilter === 'verified' ? '1px solid var(--color-success)' : '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-success)' }}>
            <ShieldCheck size={15} />
            <span>Verified Active</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>
            {verifiedCount}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('trust_profiles')}
          style={{
            background: 'var(--color-surface)',
            border: activeTab === 'trust_profiles' ? '1px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-primary)' }}>
            <Users size={15} />
            <span>Audited Responders</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px' }}>
            {trustProfiles.length}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('credentials')}
          style={{
            background: activeTab === 'credentials' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'credentials' ? '#fff' : 'var(--color-text-secondary)',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Award size={16} />
          <span>Credential Registry & Verification ({certifications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('trust_profiles')}
          style={{
            background: activeTab === 'trust_profiles' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'trust_profiles' ? '#fff' : 'var(--color-text-secondary)',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ShieldCheck size={16} />
          <span>Volunteer Trust Audits ({trustProfiles.length})</span>
        </button>
      </div>

      {/* TAB 1: CREDENTIALS */}
      {activeTab === 'credentials' && (
        <>
          {/* Filters & Search */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              alignItems: 'center',
              flexWrap: 'wrap',
              background: 'var(--color-surface)',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)'
            }}
          >
            <div style={{ flex: 1, minWidth: '220px' }}>
              <Input
                placeholder="Search by volunteer name, credential title, issuer, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ width: '180px' }}>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Categories' },
                  ...CERTIFICATION_CATEGORIES.map((c) => ({ value: c, label: c }))
                ]}
              />
            </div>

            <div style={{ width: '180px' }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'pending', label: 'Pending Review Only' },
                  { value: 'verified', label: 'Verified Only' },
                  { value: 'rejected', label: 'Rejected Only' }
                ]}
              />
            </div>
          </div>

          {/* List */}
          {loading && <LoadingState message="Loading credential verification records..." />}

          {error && (
            <ErrorState
              title="Could Not Load Records"
              message={error}
              onRetry={loadData}
            />
          )}

          {!loading && !error && filteredCerts.length === 0 && (
            <EmptyState
              title="No Credential Records Found"
              message="No records matched your search or status criteria."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusFilter('ALL');
                    setCategoryFilter('ALL');
                    setSearchQuery('');
                  }}
                >
                  Reset Filters
                </Button>
              }
            />
          )}

          {!loading && !error && filteredCerts.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: 'var(--spacing-md)'
              }}
            >
              {filteredCerts.map((cert) => (
                <CertificationCard
                  key={cert.id}
                  certification={cert}
                  isAdmin={true}
                  onVerify={(c) => handleOpenAction(c, 'verify')}
                  onReject={(c) => handleOpenAction(c, 'reject')}
                  onRevoke={(c) => handleOpenAction(c, 'revoke')}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: VOLUNTEER TRUST AUDITS */}
      {activeTab === 'trust_profiles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {trustProfiles.map((tp) => (
            <Card key={tp.volunteerId}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-text-primary)' }}>
                      {tp.volunteerName}
                    </h3>
                    <Badge variant="neutral" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                      {tp.passportId}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    {tp.volunteerEmail}
                  </div>
                </div>

                <TrustTierBadge
                  tier={tp.trustTier}
                  score={tp.trustScore}
                  verificationStatus={tp.verificationStatus}
                  showScore={true}
                />
              </div>

              {/* Stats Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '10px',
                  background: 'var(--color-surface-hover)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: 'var(--spacing-md)',
                  fontSize: '0.85rem'
                }}
              >
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Background Check:</span>
                  <div style={{ fontWeight: 600, color: 'var(--color-success)' }}>{tp.backgroundCheckStatus}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Verified Certs:</span>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{tp.verifiedCertificationsCount}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Trainings Mastered:</span>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{tp.completedTrainingsCount}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Field Deployments:</span>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{tp.completedDeploymentsCount} missions</div>
                </div>
              </div>

              {/* Indicators list */}
              <div style={{ marginTop: 'var(--spacing-sm)' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                  Command Clearance Factors:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(tp.trustIndicators || []).map((ind) => (
                    <Badge key={ind.id} variant="neutral" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCheck size={12} color="var(--color-success)" />
                      <span>{ind.title}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
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

export default AdminVerificationPage;
