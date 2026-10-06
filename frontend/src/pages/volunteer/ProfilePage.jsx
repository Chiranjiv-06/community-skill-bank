import React, { useState, useEffect } from 'react';
import {
  User,
  MapPin,
  Clock,
  Heart,
  Edit3,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Lock,
  LocateFixed,
  Compass
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import LoadingState from '../../components/states/LoadingState';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import locationService from '../../services/locationService';
import { ROLE_LABELS, ROLE_BADGE_VARIANTS } from '../../utils/roles';
import { AVAILABILITY_OPTIONS, TRANSPORTATION_OPTIONS } from '../../data/skillCategories';

export const ProfilePage = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState(null);
  const [showManualCoords, setShowManualCoords] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const data = await userService.getProfile(currentUser?.id);
        setProfile(data);
        setFormData(data);
      } catch (err) {
        console.error('[ProfilePage] Failed to load profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [currentUser?.id]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleEmergencyContactChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value
      }
    }));
    if (errors[`emergency_${field}`]) {
      setErrors((prev) => ({ ...prev, [`emergency_${field}`]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName || formData.fullName.trim() === '') {
      newErrors.fullName = 'Full name is required.';
    }

    if (!formData.phone || formData.phone.trim() === '') {
      newErrors.phone = 'Contact phone number is required.';
    }

    if (!formData.location || formData.location.trim() === '') {
      newErrors.location = 'Response sector location is required.';
    }

    if (formData.maxTravelDistance === '' || isNaN(formData.maxTravelDistance) || Number(formData.maxTravelDistance) <= 0) {
      newErrors.maxTravelDistance = 'Maximum travel distance must be a positive number.';
    }

    if (formData.latitude !== '' && formData.latitude !== undefined) {
      const lat = Number(formData.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitude = 'Latitude must be between -90 and 90.';
      }
    }

    if (formData.longitude !== '' && formData.longitude !== undefined) {
      const lng = Number(formData.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.longitude = 'Longitude must be between -180 and 180.';
      }
    }

    if (formData.emergencyContact?.name && !formData.emergencyContact?.phone) {
      newErrors.emergency_phone = 'Phone number is required when emergency contact name is specified.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setSuccessMessage(null);
    try {
      const updated = await userService.updateProfile(currentUser?.id, formData);
      setProfile(updated);
      setFormData(updated);
      setIsEditing(false);
      setLocationStatus(null);
      setShowManualCoords(false);
      setSuccessMessage('Profile information successfully saved to local development state.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('[ProfilePage] Error saving profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDetectLocation = () => {
    if (isDetectingLocation) return;

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationStatus({
        type: 'error',
        message: 'Geolocation is not supported by your browser.'
      });
      return;
    }

    setIsDetectingLocation(true);
    setLocationStatus({
      type: 'info',
      message: 'Requesting browser location permission...'
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const rawLat = position.coords.latitude;
        const rawLng = position.coords.longitude;
        const lat = Number(rawLat.toFixed(4));
        const lng = Number(rawLng.toFixed(4));

        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));

        // Automatic location population from coordinates
        locationService.reverseGeocode(lat, lng).then((resolvedLoc) => {
          if (resolvedLoc) {
            setFormData((prev) => ({
              ...prev,
              location: resolvedLoc
            }));
          }
        }).catch(() => {});

        setErrors((prev) => ({
          ...prev,
          latitude: null,
          longitude: null
        }));

        setIsDetectingLocation(false);
        setLocationStatus({
          type: 'success',
          message: `Location successfully detected: ${lat}, ${lng}`
        });
      },
      (error) => {
        setIsDetectingLocation(false);
        let errorMsg = 'Unable to determine your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission was denied. Please allow location access in your browser or enter coordinates manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information is currently unavailable. Check device GPS or network.';
            break;
          case error.TIMEOUT:
            errorMsg = 'The request to obtain your location timed out. Please try again.';
            break;
          default:
            errorMsg = error.message || 'An unknown error occurred while detecting location.';
            break;
        }
        setLocationStatus({
          type: 'error',
          message: errorMsg
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  const handleCancel = () => {
    setFormData(profile);
    setErrors({});
    setIsEditing(false);
    setLocationStatus(null);
    setShowManualCoords(false);
  };

  if (isLoading || !profile) {
    return <LoadingState message="Loading volunteer responder profile..." minHeight="400px" />;
  }

  const roleLabel = ROLE_LABELS[profile.role] || 'Community Volunteer';
  const badgeVariant = ROLE_BADGE_VARIANTS[profile.role] || 'badge-neutral';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <PageHeader
        title="Volunteer Profile"
        subtitle="Manage your personal details, emergency contact, readiness availability, and operational credentials."
        icon={<User size={24} />}
        actions={
          isEditing ? (
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <Button
                variant="secondary"
                size="md"
                onClick={handleCancel}
                icon={<X size={16} />}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSave}
                icon={<Save size={16} />}
                isLoading={isSaving}
              >
                Save Changes
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsEditing(true)}
              icon={<Edit3 size={16} />}
            >
              Edit Profile
            </Button>
          )
        }
      />

      {/* Success Notification */}
      {successMessage && (
        <div
          style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--badge-success-bg)',
            border: '1px solid var(--badge-success-border)',
            color: 'var(--badge-success-text)',
            fontSize: 'var(--font-sm)',
            marginBottom: 'var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)'
          }}
        >
          <CheckCircle size={18} color="var(--color-success)" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 1. SERVER-CONTROLLED PROFILE SECTION (STRICTLY READ-ONLY) */}
      <Card style={{ marginBottom: 'var(--space-6)', borderLeft: '4px solid var(--color-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700 }}>
              Incident Command System Credentials (Read-Only)
            </h3>
          </div>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
            Maintained by Command & Central Registry
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-4)',
            background: 'var(--bg-surface-elevated)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Responder ID
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--font-sm)' }}>
              {profile.id}
            </span>
          </div>

          <div>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Registered Email
            </span>
            <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>
              {profile.email}
            </span>
          </div>

          <div>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Clearance Role
            </span>
            <Badge variant={badgeVariant}>
              {roleLabel}
            </Badge>
          </div>

          <div>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Verification Status
            </span>
            <Badge variant="success">
              <CheckCircle size={12} />
              <span>{profile.verification_status === 'verified' ? 'Verified Responder' : 'Pending Verification'}</span>
            </Badge>
          </div>
        </div>
      </Card>

      {/* 2. PROFILE EDIT / VIEW FORM */}
      <form onSubmit={handleSave}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* SECTION A: Basic Information */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
              <User size={18} color="var(--color-primary)" />
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>Basic Information</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-4)' }}>
              {isEditing ? (
                <Input
                  label="Full Name"
                  id="profile-name"
                  value={formData.fullName}
                  error={errors.fullName}
                  required
                  onChange={(e) => handleFieldChange('fullName', e.target.value)}
                />
              ) : (
                <div style={{ marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Full Name</span>
                  <div style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {profile.fullName}
                  </div>
                </div>
              )}

              {isEditing ? (
                <Textarea
                  label="Biography & Volunteer Summary"
                  id="profile-bio"
                  rows={3}
                  value={formData.bio}
                  helperText="Brief summary of your background, motivations, and special interests in emergency service"
                  onChange={(e) => handleFieldChange('bio', e.target.value)}
                />
              ) : (
                <div style={{ marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Biography</span>
                  <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {profile.bio || 'No biography provided.'}
                  </p>
                </div>
              )}

              {isEditing ? (
                <Textarea
                  label="Disaster & Emergency Experience"
                  id="profile-experience"
                  rows={3}
                  value={formData.experience}
                  helperText="List disaster activations, past flood/storm responses, CERT drills, or relevant field experience"
                  onChange={(e) => handleFieldChange('experience', e.target.value)}
                />
              ) : (
                <div>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Field Experience</span>
                  <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {profile.experience || 'No prior disaster experience recorded.'}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* SECTION B: Contact Information & Location */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
              <MapPin size={18} color="var(--color-primary)" />
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>Contact Information & Location</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              {isEditing ? (
                <Input
                  label="Phone Number"
                  id="profile-phone"
                  value={formData.phone}
                  error={errors.phone}
                  required
                  placeholder="+1 (555) 000-0000"
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                />
              ) : (
                <div>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Phone Number</span>
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {profile.phone}
                  </div>
                </div>
              )}

              {isEditing ? (
                <Input
                  label="Home Sector / Municipality Location"
                  id="profile-location"
                  value={formData.location}
                  error={errors.location}
                  required
                  placeholder="e.g. District 4 - Northern Basin"
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                />
              ) : (
                <div>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Primary Sector Location</span>
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {profile.location}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION B.1: Geolocation Coordinates & Automatic Capture */}
            {isEditing ? (
              <div
                style={{
                  marginTop: 'var(--space-4)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 'var(--space-3)',
                    marginBottom: 'var(--space-3)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Compass size={16} color="var(--color-primary)" />
                      <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Deployment Coordinates (GPS)
                      </span>
                    </div>
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Capture coordinates automatically via your browser to enable emergency dispatch. Browser location permission is required.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={<LocateFixed size={15} />}
                    isLoading={isDetectingLocation}
                    disabled={isDetectingLocation}
                    onClick={handleDetectLocation}
                  >
                    {isDetectingLocation ? 'Detecting Location...' : 'Use My Current Location'}
                  </Button>
                </div>

                {locationStatus && (
                  <div
                    style={{
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-xs)',
                      marginBottom: 'var(--space-3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background:
                        locationStatus.type === 'success'
                          ? 'var(--badge-success-bg)'
                          : locationStatus.type === 'error'
                          ? 'var(--badge-critical-bg)'
                          : 'var(--badge-info-bg)',
                      color:
                        locationStatus.type === 'success'
                          ? 'var(--badge-success-text)'
                          : locationStatus.type === 'error'
                          ? 'var(--badge-critical-text)'
                          : 'var(--badge-info-text)',
                      border: `1px solid ${
                        locationStatus.type === 'success'
                          ? 'var(--badge-success-border)'
                          : locationStatus.type === 'error'
                          ? 'var(--badge-critical-border)'
                          : 'var(--badge-info-border)'
                      }`
                    }}
                  >
                    {locationStatus.type === 'success' ? (
                      <CheckCircle size={14} />
                    ) : (
                      <AlertCircle size={14} />
                    )}
                    <span>{locationStatus.message}</span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                  <div
                    style={{
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                      Latitude
                    </span>
                    <div style={{ fontSize: 'var(--font-sm)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {formData.latitude !== undefined && formData.latitude !== null && formData.latitude !== '' ? formData.latitude : 'Not detected'}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                      Longitude
                    </span>
                    <div style={{ fontSize: 'var(--font-sm)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {formData.longitude !== undefined && formData.longitude !== null && formData.longitude !== '' ? formData.longitude : 'Not detected'}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 'var(--space-3)' }}>
                  <button
                    type="button"
                    onClick={() => setShowManualCoords(!showManualCoords)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      fontSize: 'var(--font-xs)',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0
                    }}
                  >
                    {showManualCoords ? 'Hide manual coordinate entry' : 'Edit coordinates manually'}
                  </button>

                  {showManualCoords && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-3)' }}>
                      <Input
                        label="Manual Latitude"
                        id="profile-latitude"
                        type="number"
                        step="0.0001"
                        value={formData.latitude ?? ''}
                        error={errors.latitude}
                        helperText="Decimal coordinates (-90 to 90)"
                        onChange={(e) => handleFieldChange('latitude', e.target.value)}
                      />
                      <Input
                        label="Manual Longitude"
                        id="profile-longitude"
                        type="number"
                        step="0.0001"
                        value={formData.longitude ?? ''}
                        error={errors.longitude}
                        helperText="Decimal coordinates (-180 to 180)"
                        onChange={(e) => handleFieldChange('longitude', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                <div>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Latitude</span>
                  <div style={{ fontSize: 'var(--font-sm)', fontFamily: 'var(--font-mono)' }}>
                    {profile.latitude !== null && profile.latitude !== undefined && profile.latitude !== '' ? profile.latitude : 'Not set'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Longitude</span>
                  <div style={{ fontSize: 'var(--font-sm)', fontFamily: 'var(--font-mono)' }}>
                    {profile.longitude !== null && profile.longitude !== undefined && profile.longitude !== '' ? profile.longitude : 'Not set'}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* SECTION C: Operational Availability & Response Preferences */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
              <Clock size={18} color="var(--color-primary)" />
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>Operational Availability & Transportation</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              {isEditing ? (
                <Select
                  label="Availability Schedule"
                  id="profile-availability"
                  value={formData.availability}
                  onChange={(e) => handleFieldChange('availability', e.target.value)}
                  options={AVAILABILITY_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
                />
              ) : (
                <div>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Availability Schedule</span>
                  <Badge variant="primary" style={{ marginTop: '4px' }}>
                    {profile.availability}
                  </Badge>
                </div>
              )}

              {isEditing ? (
                <Select
                  label="Transportation Capability"
                  id="profile-transportation"
                  value={formData.transportation}
                  onChange={(e) => handleFieldChange('transportation', e.target.value)}
                  options={TRANSPORTATION_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
                />
              ) : (
                <div>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Transportation</span>
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {profile.transportation}
                  </div>
                </div>
              )}

              {isEditing ? (
                <Input
                  label="Maximum Travel Distance (km)"
                  id="profile-max-distance"
                  type="number"
                  min="1"
                  max="500"
                  value={formData.maxTravelDistance}
                  error={errors.maxTravelDistance}
                  helperText="Maximum kilometers willing to mobilize from base sector"
                  onChange={(e) => handleFieldChange('maxTravelDistance', e.target.value)}
                />
              ) : (
                <div>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Max Deployment Radius</span>
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {profile.maxTravelDistance} km
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* SECTION D: Emergency Contact */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
              <Heart size={18} color="var(--color-critical)" />
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>Emergency Contact</h3>
            </div>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              Designated contact in the event of an incident or deployment safety inquiry.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
              {isEditing ? (
                <Input
                  label="Contact Name"
                  id="profile-emergency-name"
                  value={formData.emergencyContact?.name || ''}
                  onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                />
              ) : (
                <div>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Contact Name</span>
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>
                    {profile.emergencyContact?.name || 'None provided'}
                  </div>
                </div>
              )}

              {isEditing ? (
                <Input
                  label="Contact Phone"
                  id="profile-emergency-phone"
                  value={formData.emergencyContact?.phone || ''}
                  error={errors.emergency_phone}
                  onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                />
              ) : (
                <div>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Contact Phone</span>
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>
                    {profile.emergencyContact?.phone || 'None provided'}
                  </div>
                </div>
              )}

              {isEditing ? (
                <Input
                  label="Relationship"
                  id="profile-emergency-rel"
                  placeholder="e.g. Spouse, Parent, Sibling"
                  value={formData.emergencyContact?.relationship || ''}
                  onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                />
              ) : (
                <div>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Relationship</span>
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>
                    {profile.emergencyContact?.relationship || 'None provided'}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
