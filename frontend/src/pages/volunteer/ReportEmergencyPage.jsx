import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Navigation,
  Send,
  ArrowLeft,
  User,
  ShieldCheck
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import emergencyService from '../../services/emergencyService';
import locationService from '../../services/locationService';
import { useAuth } from '../../context/AuthContext';

const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critical — Life Threat / Severe Escalation' },
  { value: 'high', label: 'High — Immediate Response Required' },
  { value: 'medium', label: 'Medium — Urgent Community Relief' },
  { value: 'low', label: 'Low — Advisory / Controlled Hazard' }
];

const CATEGORY_OPTIONS = [
  { value: 'Flood', label: 'Flood & Water Surge' },
  { value: 'Fire', label: 'Fire & Wildfire Hazard' },
  { value: 'Earthquake', label: 'Earthquake & Structural Collapse' },
  { value: 'Medical', label: 'Mass Medical Emergency' },
  { value: 'Storm', label: 'Severe Storm / Cyclone' },
  { value: 'Logistics', label: 'Relief Supply & Shelter Need' },
  { value: 'General Emergency', label: 'Other Crisis Event' }
];

export const ReportEmergencyPage = () => {
  const navigate = useNavigate();
  const { user, currentUser } = useAuth();
  const activeUser = currentUser || user;
  const reporterName = activeUser?.name || activeUser?.full_name || activeUser?.email?.split('@')[0] || 'Registered Responder';
  const reporterEmail = activeUser?.email || 'volunteer@skillbank.org';

  const [formData, setFormData] = useState({
    title: '',
    category: 'Flood',
    severity: 'high',
    location: '',
    latitude: '',
    longitude: '',
    requiredVolunteers: '10',
    description: ''
  });

  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [geoState, setGeoState] = useState({
    status: 'idle', // 'idle' | 'loading' | 'resolved' | 'error'
    resolvedAddress: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  // Automatic location resolution whenever latitude/longitude become available
  useEffect(() => {
    const latStr = formData.latitude?.trim();
    const lngStr = formData.longitude?.trim();
    if (!latStr || !lngStr) {
      setGeoState({ status: 'idle', resolvedAddress: '', message: '' });
      return;
    }

    const lat = Number(latStr);
    const lng = Number(lngStr);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setGeoState({
        status: 'error',
        resolvedAddress: '',
        message: 'Invalid coordinates. Latitude must be -90 to 90, Longitude -180 to 180.'
      });
      return;
    }

    let isCancelled = false;
    setGeoState({ status: 'loading', resolvedAddress: '', message: 'Resolving address from coordinates...' });

    const timer = setTimeout(async () => {
      try {
        const address = await locationService.reverseGeocode(lat, lng);
        if (!isCancelled) {
          if (address) {
            setGeoState({
              status: 'resolved',
              resolvedAddress: address,
              message: 'Location detected'
            });
            // Automatically populate location/address if empty or placeholder
            setFormData((prev) => {
              if (!prev.location.trim() || prev.location.startsWith('Sector Zone')) {
                return { ...prev, location: address };
              }
              return prev;
            });
          } else {
            setGeoState({
              status: 'error',
              resolvedAddress: '',
              message: 'Location lookup unavailable'
            });
          }
        }
      } catch {
        if (!isCancelled) {
          setGeoState({
            status: 'error',
            resolvedAddress: '',
            message: 'Reverse geocoding lookup failed'
          });
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [formData.latitude, formData.longitude]);

  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setIsCapturingLocation(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setFormData((prev) => ({
          ...prev,
          latitude: String(lat),
          longitude: String(lng)
        }));
        setLocationSuccess(true);
        setIsCapturingLocation(false);

        // Automatic location population from coordinates
        try {
          const resolved = await locationService.reverseGeocode(lat, lng);
          if (resolved) {
            setFormData((prev) => ({
              ...prev,
              location: resolved
            }));
          }
        } catch (_) {}
      },
      (err) => {
        console.warn('[ReportEmergencyPage] Geolocation error:', err);
        setError('Location permission denied or unavailable. You can enter details manually.');
        setIsCapturingLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Emergency title is required.');
      return;
    }
    if (!formData.description.trim()) {
      setError('Incident description is required.');
      return;
    }
    if (!formData.location.trim()) {
      setError('Location / sector description is required.');
      return;
    }

    if (formData.latitude !== '' && formData.latitude !== undefined) {
      const lat = Number(formData.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        setError('Latitude must be a valid number between -90 and 90.');
        return;
      }
    }

    if (formData.longitude !== '' && formData.longitude !== undefined) {
      const lng = Number(formData.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        setError('Longitude must be a valid number between -180 and 180.');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await emergencyService.createEmergency({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        severity: formData.severity,
        location: formData.location,
        latitude: formData.latitude !== '' ? Number(formData.latitude) : null,
        longitude: formData.longitude !== '' ? Number(formData.longitude) : null,
        requiredVolunteers: Number(formData.requiredVolunteers) || 10
      });

      setSuccessMessage(`Emergency "${created.title}" successfully declared.`);
      setTimeout(() => {
        navigate(`/volunteer/emergencies/${created.id}`);
      }, 1500);
    } catch (err) {
      console.error('[ReportEmergencyPage] Error reporting emergency:', err);
      setError(err.message || 'Failed to submit emergency report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: 'var(--space-8)' }}>
      <PageHeader
        title="Report Active Emergency"
        subtitle="Field incident intake transmitting real-time crisis alerts and personnel requirements directly to Incident Command."
        icon={<Flame size={24} color="var(--color-critical)" />}
      />

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/volunteer/emergencies')}
          icon={<ArrowLeft size={16} />}
        >
          Back to Emergencies
        </Button>
      </div>

      {error && (
        <div
          style={{
            padding: 'var(--space-4)',
            background: 'var(--color-critical-bg)',
            border: '1px solid var(--color-critical-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-critical)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-4)'
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div
          style={{
            padding: 'var(--space-4)',
            background: 'var(--color-success-bg)',
            border: '1px solid var(--color-success-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-success)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-4)'
          }}
        >
          <CheckCircle size={20} style={{ flexShrink: 0 }} />
          <span>{successMessage}</span>
        </div>
      )}

      <Card style={{ padding: 'var(--space-6)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Appropriate Reporting Profile Section */}
          <div
            style={{
              padding: 'var(--space-4)',
              background: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 'var(--font-sm)',
                  flexShrink: 0
                }}
              >
                <User size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Reporting Official / Profile
                </span>
                <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                  {reporterName} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({reporterEmail})</span>
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'var(--badge-success-bg)',
                  color: 'var(--badge-success-text)',
                  border: '1px solid var(--badge-success-border)',
                  borderRadius: 'var(--radius-full)',
                  padding: '2px 8px',
                  fontWeight: 600
                }}
              >
                <ShieldCheck size={13} />
                Verified Responder Profile
              </span>
            </div>
          </div>

          <Input
            label="Emergency Incident Title"
            required
            placeholder="e.g. Flash Flood Surge at Sector 4 Bridge"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
            <Select
              label="Incident Category"
              options={CATEGORY_OPTIONS}
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
            />

            <Select
              label="Operational Severity"
              options={SEVERITY_OPTIONS}
              value={formData.severity}
              onChange={(e) => handleChange('severity', e.target.value)}
            />
          </div>

          <Input
            label="Sector / Physical Address"
            required
            placeholder="e.g. Riverside District, North Embankment Road"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
          />

          {/* Location Capture Section */}
          <div
            style={{
              padding: 'var(--space-4)',
              background: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <div>
                <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                  Tactical GPS Coordinates
                </span>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                  Accurate coordinates enable Haversine proximity matching for nearby responders.
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCaptureLocation}
                disabled={isCapturingLocation}
                icon={<Navigation size={14} />}
              >
                {isCapturingLocation ? 'Locating...' : 'Use Device Location'}
              </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)' }}>
              <Input
                label="Latitude"
                placeholder="e.g. 34.0522"
                value={formData.latitude}
                onChange={(e) => handleChange('latitude', e.target.value)}
              />
              <Input
                label="Longitude"
                placeholder="e.g. -118.2437"
                value={formData.longitude}
                onChange={(e) => handleChange('longitude', e.target.value)}
              />
            </div>

            {/* Visual Location & Coordinates Relationship Panel */}
            {(formData.latitude || formData.longitude || geoState.status !== 'idle') && (
              <div
                style={{
                  padding: 'var(--space-3)',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Geocoding Resolution:
                  </span>
                  {geoState.status === 'loading' && (
                    <Badge variant="info">Resolving Physical Address...</Badge>
                  )}
                  {geoState.status === 'resolved' && (
                    <Badge variant="success">
                      <CheckCircle size={12} />
                      <span>Location Detected</span>
                    </Badge>
                  )}
                  {geoState.status === 'error' && (
                    <Badge variant="warning">
                      <AlertTriangle size={12} />
                      <span>{geoState.message || 'Location Unresolved'}</span>
                    </Badge>
                  )}
                  {geoState.status === 'idle' && (
                    <Badge variant="neutral">Coordinates Pending</Badge>
                  )}
                </div>

                {geoState.resolvedAddress && (
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Automatically Resolved Location: </span>
                    <strong style={{ color: 'var(--color-primary)' }}>{geoState.resolvedAddress}</strong>
                  </div>
                )}

                {formData.latitude && formData.longitude && !isNaN(Number(formData.latitude)) && !isNaN(Number(formData.longitude)) && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {locationService.formatCoordinates(formData.latitude, formData.longitude)}
                  </div>
                )}
              </div>
            )}

            {locationSuccess && (
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={13} /> Coordinates captured from browser geolocation.
              </span>
            )}
          </div>

          <Input
            label="Estimated Required Volunteers"
            type="number"
            min="1"
            max="1000"
            value={formData.requiredVolunteers}
            onChange={(e) => handleChange('requiredVolunteers', e.target.value)}
          />

          <Textarea
            label="Incident Situation Description"
            required
            rows={4}
            placeholder="Describe immediate hazards, casualty scale, trapped individuals, and access conditions..."
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/volunteer/emergencies')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              icon={<Send size={16} />}
            >
              {isSubmitting ? 'Transmitting Incident...' : 'Declare Emergency'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ReportEmergencyPage;
