import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import EmptyState from '../../components/states/EmptyState';
import LoadingState from '../../components/states/LoadingState';
import ErrorState from '../../components/states/ErrorState';
import CertificationCard from '../../components/trust/CertificationCard';
import CertificationUploadModal from '../../components/trust/CertificationUploadModal';
import { certificationService } from '../../services/certificationService';
import { useAuth } from '../../context/AuthContext';
import { CERTIFICATION_CATEGORIES } from '../../data/devTrust';
import { Award, Plus, Filter, Search, ShieldCheck, Clock, XCircle } from 'lucide-react';

export const CertificationsPage = () => {
  const { user } = useAuth();
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadCertifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const volunteerId = user?.id || 'dev-skl-002';
      const data = await certificationService.getCertificationsForVolunteer(volunteerId);
      setCertifications(data);
    } catch (err) {
      console.error('[CertificationsPage] Error loading certifications:', err);
      setError('Failed to load your certification credentials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertifications();
  }, [user]);

  const handleUploadSubmit = async (formData) => {
    await certificationService.submitCertification({
      ...formData,
      volunteerId: user?.id || 'dev-skl-002',
      volunteerName: user?.name || 'Alex Rivera',
      volunteerEmail: user?.email || 'alex.rivera@skillbank.org'
    });
    await loadCertifications();
  };

  const handleDelete = async (cert) => {
    if (window.confirm(`Are you sure you want to withdraw ${cert.name}?`)) {
      await certificationService.deleteCertification(cert.id);
      await loadCertifications();
    }
  };

  // Filtered list
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
      const matchOrg = cert.issuingOrg?.toLowerCase().includes(q);
      const matchCategory = cert.category?.toLowerCase().includes(q);
      if (!matchName && !matchOrg && !matchCategory) return false;
    }
    return true;
  });

  const verifiedCount = certifications.filter((c) => c.verificationStatus === 'verified').length;
  const pendingCount = certifications.filter((c) => c.verificationStatus === 'pending').length;
  const rejectedCount = certifications.filter((c) => c.verificationStatus === 'rejected').length;

  return (
    <div className="certifications-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Page Header */}
      <PageHeader
        title="My Certifications & Credentials"
        description="Manage your verified emergency qualifications, FEMA certifications, medical licenses, and specialized disaster credentials."
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} style={{ marginRight: '6px' }} />
            Submit New Credential
          </Button>
        }
      />

      {/* Overview Stat Badges */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--spacing-md)'
        }}
      >
        <div
          onClick={() => setStatusFilter('ALL')}
          style={{
            background: 'var(--color-surface)',
            border: statusFilter === 'ALL' ? '1px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease'
          }}
        >
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Total Submitted</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>
            {certifications.length}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('verified')}
          style={{
            background: 'var(--color-surface)',
            border: statusFilter === 'verified' ? '1px solid var(--color-success)' : '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease'
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
          onClick={() => setStatusFilter('pending')}
          style={{
            background: 'var(--color-surface)',
            border: statusFilter === 'pending' ? '1px solid var(--color-warning)' : '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-warning)' }}>
            <Clock size={15} />
            <span>Pending Review</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-warning)', marginTop: '4px' }}>
            {pendingCount}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('rejected')}
          style={{
            background: 'var(--color-surface)',
            border: statusFilter === 'rejected' ? '1px solid var(--color-critical)' : '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-critical)' }}>
            <XCircle size={15} />
            <span>Action Required</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-critical)', marginTop: '4px' }}>
            {rejectedCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
            placeholder="Search credentials by title, issuer, or keyword..."
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
              { value: 'ALL', label: 'All Verification Statuses' },
              { value: 'verified', label: 'Verified Only' },
              { value: 'pending', label: 'Pending Review Only' },
              { value: 'rejected', label: 'Rejected / Needs Review' }
            ]}
          />
        </div>
      </div>

      {/* Content States */}
      {loading && <LoadingState message="Loading disaster certifications..." />}

      {error && (
        <ErrorState
          title="Could Not Load Certifications"
          message={error}
          onRetry={loadCertifications}
        />
      )}

      {!loading && !error && filteredCerts.length === 0 && (
        <EmptyState
          title="No Certifications Found"
          message={
            certifications.length === 0
              ? 'You have not submitted any disaster certifications or emergency credentials yet. Click "Submit New Credential" to register your qualifications.'
              : 'No certifications matched your filter criteria.'
          }
          action={
            certifications.length === 0 ? (
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                <Plus size={16} style={{ marginRight: '6px' }} />
                Submit Your First Credential
              </Button>
            ) : (
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
            )
          }
        />
      )}

      {!loading && !error && filteredCerts.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 'var(--spacing-md)'
          }}
        >
          {filteredCerts.map((cert) => (
            <CertificationCard
              key={cert.id}
              certification={cert}
              isAdmin={false}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Upload Credential Modal */}
      <CertificationUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleUploadSubmit}
        currentVolunteer={user}
      />
    </div>
  );
};

export default CertificationsPage;
