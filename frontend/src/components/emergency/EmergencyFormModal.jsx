import React, { useState, useEffect } from 'react';
import { Flame, Edit3, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Input from '../common/Input';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import {
  EMERGENCY_STATUSES,
  STATUS_LABELS,
  EMERGENCY_SEVERITIES,
  SEVERITY_LABELS
} from '../../data/devEmergencies';
import locationService from '../../services/locationService';

/**
 * Reusable Emergency Create & Edit Modal
 */
export const EmergencyFormModal = ({
  isOpen,
  onClose,
  onSave,
  emergency = null,
  isLoading = false
}) => {
  const isEdit = Boolean(emergency);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    latitude: '',
    longitude: '',
    severity: 'high',
    status: 'open',
    requiredVolunteers: '10'
  });

  const [errors, setErrors] = useState({});
  const [geoStatus, setGeoStatus] = useState({ status: 'idle', address: '', message: '' });

  useEffect(() => {
    if (emergency) {
      setFormData({
        title: emergency.title || '',
        description: emergency.description || '',
        location: emergency.location || '',
        latitude: emergency.latitude !== null && emergency.latitude !== undefined ? String(emergency.latitude) : '',
        longitude: emergency.longitude !== null && emergency.longitude !== undefined ? String(emergency.longitude) : '',
        severity: emergency.severity || 'high',
        status: emergency.status || 'open',
        requiredVolunteers: String(emergency.requiredVolunteers || '10')
      });
      if (emergency.latitude && emergency.longitude) {
        setGeoStatus({
          status: 'resolved',
          address: emergency.location || '',
          message: 'Location verified'
        });
      }
    } else {
      setFormData({
        title: '',
        description: '',
        location: '',
        latitude: '',
        longitude: '',
        severity: 'high',
        status: 'open',
        requiredVolunteers: '10'
      });
      setGeoStatus({ status: 'idle', address: '', message: '' });
    }
    setErrors({});
  }, [emergency, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'latitude' || field === 'longitude') {
        const latVal = field === 'latitude' ? value : prev.latitude;
        const lngVal = field === 'longitude' ? value : prev.longitude;
        const lat = Number(latVal);
        const lng = Number(lngVal);

        if (!latVal || !lngVal) {
          setGeoStatus({ status: 'idle', address: '', message: '' });
        } else if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          setGeoStatus({ status: 'error', address: '', message: 'Coordinates out of bounds (-90..90, -180..180)' });
        } else {
          setGeoStatus({ status: 'loading', address: '', message: 'Resolving address from coordinates...' });
          locationService.reverseGeocode(lat, lng).then((resolved) => {
            if (resolved) {
              setGeoStatus({ status: 'resolved', address: resolved, message: 'Location detected' });
              if (!next.location || next.location.startsWith('Sector Zone')) {
                setFormData((curr) => ({ ...curr, location: resolved }));
              }
            } else {
              setGeoStatus({ status: 'error', address: '', message: 'Location lookup failed' });
            }
          }).catch(() => {
            setGeoStatus({ status: 'error', address: '', message: 'Reverse geocoding error' });
          });
        }
      }

      return next;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};

    if (!formData.title || formData.title.trim() === '') {
      errs.title = 'Emergency title is required.';
    }
    if (!formData.description || formData.description.trim() === '') {
      errs.description = 'Incident description is required.';
    }
    if (!formData.location || formData.location.trim() === '') {
      errs.location = 'Incident location / sector is required.';
    }
    if (!EMERGENCY_SEVERITIES.includes(formData.severity)) {
      errs.severity = `Severity must be one of: ${EMERGENCY_SEVERITIES.join(', ')}`;
    }
    if (!EMERGENCY_STATUSES.includes(formData.status)) {
      errs.status = `Status must be one of: ${EMERGENCY_STATUSES.join(', ')}`;
    }
    if (
      formData.requiredVolunteers === '' ||
      isNaN(formData.requiredVolunteers) ||
      Number(formData.requiredVolunteers) <= 0
    ) {
      errs.requiredVolunteers = 'Required volunteers must be a positive number.';
    }

    if (formData.latitude !== '' && formData.latitude !== undefined) {
      const lat = Number(formData.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errs.latitude = 'Latitude must be between -90 and 90.';
      }
    }

    if (formData.longitude !== '' && formData.longitude !== undefined) {
      const lng = Number(formData.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        errs.longitude = 'Longitude must be between -180 and 180.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      ...formData,
      requiredVolunteers: Number(formData.requiredVolunteers),
      latitude: formData.latitude !== '' ? Number(formData.latitude) : null,
      longitude: formData.longitude !== '' ? Number(formData.longitude) : null
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isEdit ? (
            <Edit3 size={20} color="var(--color-primary)" />
          ) : (
            <Flame size={20} color="var(--color-critical)" />
          )}
          <span>{isEdit ? 'Edit Emergency Declaration' : 'Declare New Emergency Incident'}</span>
        </div>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isLoading}>
            {isEdit ? 'Save Changes' : 'Declare Emergency'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {errors.submit && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: 'var(--space-3)',
              background: 'var(--color-critical-bg)',
              border: '1px solid var(--color-critical-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-critical)',
              fontSize: 'var(--font-sm)',
              marginBottom: 'var(--space-4)'
            }}
          >
            <AlertCircle size={16} />
            <span>{errors.submit}</span>
          </div>
        )}

        {/* Emergency Title */}
        <Input
          label="Emergency Title"
          id="emergency-title-input"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g. Flash Flood Evacuation & Search - Ward 7"
          required
          error={errors.title}
          helperText="Official incident declaration headline."
        />

        {/* Description */}
        <Textarea
          label="Incident Description"
          id="emergency-description-input"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Provide comprehensive details of disaster situation, hazards, perimeter boundaries, and mobilization urgency..."
          required
          rows={3}
          error={errors.description}
        />

        {/* Location */}
        <Input
          label="Incident Location / Sector"
          id="emergency-location-input"
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="e.g. Riverside Basin & Lowlands, Ward 7"
          required
          error={errors.location}
        />

        {/* Coordinates Row */}
        <div className="emergency-coordinate-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--space-3)' }}>
          <Input
            label="Latitude"
            id="emergency-latitude-input"
            type="number"
            step="any"
            value={formData.latitude}
            onChange={(e) => handleChange('latitude', e.target.value)}
            placeholder="e.g. 34.0582"
            error={errors.latitude}
            helperText="-90 to 90"
          />
          <Input
            label="Longitude"
            id="emergency-longitude-input"
            type="number"
            step="any"
            value={formData.longitude}
            onChange={(e) => handleChange('longitude', e.target.value)}
            placeholder="e.g. -118.2483"
            error={errors.longitude}
            helperText="-180 to 180"
          />
        </div>

        {/* Visual Location & Coordinates Relationship Panel */}
        {(formData.latitude || formData.longitude || geoStatus.status !== 'idle') && (
          <div
            style={{
              padding: 'var(--space-3)',
              background: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              marginTop: 'calc(var(--space-2) * -1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Location Status:
              </span>
              {geoStatus.status === 'loading' && (
                <Badge variant="info">Resolving Physical Address...</Badge>
              )}
              {geoStatus.status === 'resolved' && (
                <Badge variant="success">
                  <CheckCircle size={12} />
                  <span>Location Detected</span>
                </Badge>
              )}
              {geoStatus.status === 'error' && (
                <Badge variant="warning">
                  <AlertTriangle size={12} />
                  <span>{geoStatus.message || 'Location Unresolved'}</span>
                </Badge>
              )}
              {geoStatus.status === 'idle' && (
                <Badge variant="neutral">Coordinates Pending</Badge>
              )}
            </div>

            {geoStatus.address && (
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-primary)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Automatically Resolved Location: </span>
                <strong style={{ color: 'var(--color-primary)' }}>{geoStatus.address}</strong>
              </div>
            )}

            {formData.latitude && formData.longitude && !isNaN(Number(formData.latitude)) && !isNaN(Number(formData.longitude)) && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Coordinates: {locationService.formatCoordinates(formData.latitude, formData.longitude)}
              </div>
            )}
          </div>
        )}

        {/* Severity, Status, Required Volunteers */}
        <div className="emergency-details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-3)' }}>
          {/* Severity */}
          <Select
            label="Severity"
            id="emergency-severity-select"
            value={formData.severity}
            onChange={(e) => handleChange('severity', e.target.value)}
            required
            error={errors.severity}
            options={EMERGENCY_SEVERITIES.map((s) => ({
              value: s,
              label: SEVERITY_LABELS[s] || s
            }))}
            helperText="Strict: critical, high, medium, low."
          />

          {/* Status */}
          <Select
            label="Status"
            id="emergency-status-select"
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            required
            error={errors.status}
            options={EMERGENCY_STATUSES.map((st) => ({
              value: st,
              label: STATUS_LABELS[st] || st
            }))}
            helperText="Strict: open, in_progress, resolved, cancelled."
          />

          {/* Required Volunteers */}
          <Input
            label="Required Volunteers"
            id="emergency-volunteers-input"
            type="number"
            min="1"
            value={formData.requiredVolunteers}
            onChange={(e) => handleChange('requiredVolunteers', e.target.value)}
            required
            error={errors.requiredVolunteers}
            helperText="Target personnel quota"
          />
        </div>
      </form>
    </Modal>
  );
};

export default EmergencyFormModal;
