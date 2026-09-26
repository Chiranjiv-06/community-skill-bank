import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import Button from '../common/Button';
import { CERTIFICATION_CATEGORIES } from '../../data/devTrust';
import { UploadCloud, Award, CheckCircle } from 'lucide-react';

/**
 * Volunteer Modal to submit new certification credentials for administrative verification
 */
export const CertificationUploadModal = ({
  isOpen,
  onClose,
  onSubmit,
  currentVolunteer
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: CERTIFICATION_CATEGORIES[0],
    issuingOrg: '',
    credentialId: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    documentName: 'Emergency_Credential.pdf',
    evidenceNotes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Certification name is required.';
    if (!formData.issuingOrg.trim()) newErrors.issuingOrg = 'Issuing organization is required.';
    if (!formData.issueDate) newErrors.issueDate = 'Issue date is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        ...formData,
        volunteerId: currentVolunteer?.id || 'dev-skl-002',
        volunteerName: currentVolunteer?.name || 'Alex Rivera',
        volunteerEmail: currentVolunteer?.email || 'alex.rivera@skillbank.org'
      });
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setErrors({ form: err.message || 'Failed to submit certification.' });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Emergency Certification"
      size="md"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
          Submit official disaster credentials, medical licenses, or technical emergency qualifications. 
          Once verified by Incident Command Administration, this credential will be added to your verified Skill Passport.
        </p>

        {errors.form && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.12)',
              color: 'var(--color-critical)',
              fontSize: '0.85rem'
            }}
          >
            {errors.form}
          </div>
        )}

        <Input
          label="Certification / Credential Title *"
          placeholder="e.g. FEMA ICS-200: Basic Incident Command System"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          required
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            options={CERTIFICATION_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />

          <Input
            label="Issuing Organization *"
            placeholder="e.g. FEMA, American Red Cross, AHA"
            value={formData.issuingOrg}
            onChange={(e) => handleChange('issuingOrg', e.target.value)}
            error={errors.issuingOrg}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <Input
            label="License / Credential ID"
            placeholder="e.g. FEMA-EMI-77491"
            value={formData.credentialId}
            onChange={(e) => handleChange('credentialId', e.target.value)}
          />

          <Input
            label="Document / PDF File Name"
            placeholder="e.g. FEMA_ICS200_Certificate.pdf"
            value={formData.documentName}
            onChange={(e) => handleChange('documentName', e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <Input
            type="date"
            label="Issue Date *"
            value={formData.issueDate}
            onChange={(e) => handleChange('issueDate', e.target.value)}
            error={errors.issueDate}
            required
          />

          <Input
            type="date"
            label="Expiration Date (if applicable)"
            value={formData.expiryDate}
            onChange={(e) => handleChange('expiryDate', e.target.value)}
            placeholder="Leave empty if non-expiring"
          />
        </div>

        <Textarea
          label="Verification Notes & Evidence Description"
          placeholder="Include details on where the certificate can be cross-referenced (e.g. FEMA Student ID, National Registry number)..."
          rows={3}
          value={formData.evidenceNotes}
          onChange={(e) => handleChange('evidenceNotes', e.target.value)}
        />

        {/* Simulated Document Upload Box */}
        <div
          style={{
            border: '2px dashed var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            textAlign: 'center',
            background: 'var(--color-surface-hover)'
          }}
        >
          <UploadCloud size={28} color="var(--color-primary)" style={{ margin: '0 auto 8px auto' }} />
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Document Attached: {formData.documentName || 'Credential.pdf'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            Simulated PDF credential verification file (Max 15MB)
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: 'var(--spacing-md)' }}>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            <CheckCircle size={16} style={{ marginRight: '6px' }} />
            {isSubmitting ? 'Submitting...' : 'Submit Credential for Verification'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CertificationUploadModal;
