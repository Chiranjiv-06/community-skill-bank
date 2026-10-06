import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Flame,
  ArrowLeft,
  MapPin,
  Users,
  Clock,
  Layers,
  Edit3,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle,
  Tag,
  Award,
  ShieldAlert,
  Info,
  Map,
  Navigation,
  Brain,
  GitMerge,
  Sparkles
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Select from '../../components/common/Select';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import LoadingState from '../../components/states/LoadingState';
import EmptyState from '../../components/states/EmptyState';
import EmergencyStatusBadge from '../../components/emergency/EmergencyStatusBadge';
import EmergencySeverityBadge from '../../components/emergency/EmergencySeverityBadge';
import EmergencyFormModal from '../../components/emergency/EmergencyFormModal';
import RequirementFormModal from '../../components/emergency/RequirementFormModal';
import EmergencyMap from '../../components/emergency/EmergencyMap';
import NearbyVolunteersList from '../../components/emergency/NearbyVolunteersList';
import VolunteerMatchingSection from '../../components/emergency/VolunteerMatchingSection';
import EmergencyIntelligencePanel from '../../components/emergency/EmergencyIntelligencePanel';
import VolunteerRecommendationsSection from '../../components/emergency/VolunteerRecommendationsSection';
import AssignmentCreationModal from '../../components/assignment/AssignmentCreationModal';
import { useAuth } from '../../context/AuthContext';
import { isAdminRole } from '../../utils/roles';
import emergencyService from '../../services/emergencyService';
import locationService from '../../services/locationService';
import matchingService from '../../services/matchingService';
import intelligenceService from '../../services/intelligenceService';
import assignmentService from '../../services/assignmentService';
import {
  EMERGENCY_STATUSES,
  STATUS_LABELS,
  URGENCY_LABELS,
  URGENCY_BADGE_VARIANTS
} from '../../data/devEmergencies';

const PROFICIENCY_BADGES = {
  Beginner: 'neutral',
  Intermediate: 'info',
  Advanced: 'warning',
  Expert: 'success'
};

export const EmergencyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isAdmin = isAdminRole(currentUser?.role);

  // Tab State: 'overview' | 'map' | 'intelligence' | 'matching'
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    urlTab && ['overview', 'map', 'intelligence', 'matching'].includes(urlTab) ? urlTab : 'map'
  );

  useEffect(() => {
    if (urlTab && ['overview', 'map', 'intelligence', 'matching'].includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      updated.set('tab', newTab);
      return updated;
    }, { replace: true });
  };

  const [emergency, setEmergency] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [notification, setNotification] = useState(null);

  // Stage 6 Data States
  const [nearbyVolunteers, setNearbyVolunteers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [intelligence, setIntelligence] = useState(null);
  const [isLoadingStage6, setIsLoadingStage6] = useState(true);

  // Emergency Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEmergency, setIsSavingEmergency] = useState(false);

  // Emergency Delete Confirmation
  const [isDeleteEmergencyOpen, setIsDeleteEmergencyOpen] = useState(false);
  const [isDeletingEmergency, setIsDeletingEmergency] = useState(false);

  // Requirement Modals
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [reqModalMode, setReqModalMode] = useState('add');
  const [selectedReq, setSelectedReq] = useState(null);
  const [isSavingReq, setIsSavingReq] = useState(false);

  // Requirement Delete Confirmation
  const [isDeleteReqOpen, setIsDeleteReqOpen] = useState(false);
  const [reqToDelete, setReqToDelete] = useState(null);
  const [isDeletingReq, setIsDeletingReq] = useState(false);

  // Stage 7 Assignment Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [volunteerToAssign, setVolunteerToAssign] = useState(null);
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);

  const handleOpenAssign = (candidate) => {
    setVolunteerToAssign(candidate);
    setIsAssignModalOpen(true);
  };

  const handleSaveAssignment = async (formData) => {
    setIsSavingAssignment(true);
    try {
      const created = await assignmentService.createAssignment(formData);
      setNotification({
        type: 'success',
        message: `Volunteer ${created.volunteerName} dispatched to ${created.emergencyTitle}.`
      });
      setIsAssignModalOpen(false);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('[EmergencyDetailPage] Error dispatching assignment:', err);
      setNotification({ type: 'error', message: err.message || 'Failed to dispatch assignment.' });
    } finally {
      setIsSavingAssignment(false);
    }
  };

  // Load emergency on mount or ID change
  const fetchEmergency = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await emergencyService.getEmergencyById(id);
      if (!data) {
        setErrorMessage(`Emergency with ID "${id}" was not found.`);
      } else {
        setEmergency(data);
        // Load Stage 6 modules
        setIsStage6Loading(data.id);
      }
    } catch (err) {
      console.error('[EmergencyDetailPage] Error fetching emergency:', err);
      setErrorMessage(err.message || 'Failed to load emergency details.');
    } finally {
      setIsLoading(false);
    }
  };

  const setIsStage6Loading = async (emergencyId) => {
    setIsLoadingStage6(true);
    try {
      const [nearby, candidateMatches, recs, intel] = await Promise.all([
        locationService.getNearbyVolunteers(emergencyId),
        matchingService.getEmergencyMatches(emergencyId),
        isAdmin ? matchingService.getEmergencyRecommendations(emergencyId) : Promise.resolve([]),
        intelligenceService.getEmergencyIntelligence(emergencyId)
      ]);
      setNearbyVolunteers(nearby);
      setMatches(candidateMatches);
      setRecommendations(recs);
      setIntelligence(intel);
    } catch (err) {
      console.warn('[EmergencyDetailPage] Error loading Stage 6 geospatial & matching data:', err);
    } finally {
      setIsLoadingStage6(false);
    }
  };

  useEffect(() => {
    fetchEmergency();
  }, [id, isAdmin]);

  // Status Change Handler (Admin)
  const handleStatusChange = async (newStatus) => {
    try {
      const updated = await emergencyService.updateEmergencyStatus(id, newStatus);
      setEmergency(updated);
      setNotification({
        type: 'success',
        message: `Emergency status transitioned to "${STATUS_LABELS[newStatus]}".`
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('[EmergencyDetailPage] Error updating status:', err);
      setNotification({ type: 'error', message: err.message || 'Failed to update status.' });
    }
  };

  // Edit Emergency Submit (Admin)
  const handleSaveEmergency = async (formData) => {
    setIsSavingEmergency(true);
    try {
      const updated = await emergencyService.updateEmergency(id, formData);
      setEmergency(updated);
      setIsEditModalOpen(false);
      setNotification({
        type: 'success',
        message: 'Emergency incident details updated successfully.'
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('[EmergencyDetailPage] Error updating emergency:', err);
    } finally {
      setIsSavingEmergency(false);
    }
  };

  // Delete Emergency Handler (Admin)
  const handleConfirmDeleteEmergency = async () => {
    setIsDeletingEmergency(true);
    try {
      await emergencyService.deleteEmergency(id);
      navigate(isAdmin ? '/admin/emergencies' : '/volunteer/emergencies', { replace: true });
    } catch (err) {
      console.error('[EmergencyDetailPage] Error deleting emergency:', err);
      setIsDeletingEmergency(false);
    }
  };

  // Open Add Requirement
  const handleOpenAddReq = () => {
    setReqModalMode('add');
    setSelectedReq(null);
    setIsReqModalOpen(true);
  };

  // Open Edit Requirement
  const handleOpenEditReq = (req) => {
    setReqModalMode('edit');
    setSelectedReq(req);
    setIsReqModalOpen(true);
  };

  // Save Requirement (Add / Edit)
  const handleSaveRequirement = async (formData) => {
    setIsSavingReq(true);
    try {
      if (reqModalMode === 'add') {
        const newReq = await emergencyService.createRequirement(id, formData);
        setEmergency((prev) => ({
          ...prev,
          requirements: [...(prev.requirements || []), newReq]
        }));
        setNotification({
          type: 'success',
          message: `Requirement "${newReq.skill}" added to incident quota.`
        });
      } else {
        const updated = await emergencyService.updateRequirement(id, selectedReq.id, formData);
        setEmergency((prev) => ({
          ...prev,
          requirements: (prev.requirements || []).map((r) => (r.id === selectedReq.id ? updated : r))
        }));
        setNotification({
          type: 'success',
          message: `Requirement "${updated.skill}" updated successfully.`
        });
      }
      setIsReqModalOpen(false);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('[EmergencyDetailPage] Error saving requirement:', err);
    } finally {
      setIsSavingReq(false);
    }
  };

  // Delete Requirement
  const handleOpenDeleteReq = (req) => {
    setReqToDelete(req);
    setIsDeleteReqOpen(true);
  };

  const handleConfirmDeleteReq = async () => {
    if (!reqToDelete) return;
    setIsDeletingReq(true);
    try {
      await emergencyService.deleteRequirement(id, reqToDelete.id);
      setEmergency((prev) => ({
        ...prev,
        requirements: (prev.requirements || []).filter((r) => r.id !== reqToDelete.id)
      }));
      setNotification({
        type: 'success',
        message: `Requirement "${reqToDelete.skill}" removed from incident.`
      });
      setIsDeleteReqOpen(false);
      setReqToDelete(null);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('[EmergencyDetailPage] Error deleting requirement:', err);
    } finally {
      setIsDeletingReq(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading disaster incident record and geospatial telemetry..." minHeight="400px" />;
  }

  if (errorMessage || !emergency) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <PageHeader
          title="Emergency Not Found"
          subtitle={errorMessage || 'The requested emergency does not exist or has been removed.'}
          icon={<AlertCircle size={24} color="var(--color-critical)" />}
          actions={
            <Button
              variant="outline"
              onClick={() => navigate(isAdmin ? '/admin/emergencies' : '/volunteer/emergencies')}
              icon={<ArrowLeft size={16} />}
            >
              Back to Emergencies
            </Button>
          }
        />
      </div>
    );
  }

  const backUrl = isAdmin ? '/admin/emergencies' : '/volunteer/emergencies';
  const formattedCreated = new Date(emergency.createdTime).toLocaleString();
  const formattedUpdated = new Date(emergency.updatedTime).toLocaleString();
  const reqCount = emergency.requirements?.length || 0;

  return (
    <div className="emergency-management-container" style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', boxSizing: 'border-box', minWidth: 0 }}>
      {/* Back Link */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link
          to={backUrl}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            fontSize: 'var(--font-sm)',
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Emergencies</span>
        </Link>
      </div>

      {/* Page Header */}
      <PageHeader
        title={emergency.title}
        subtitle={`Incident ID: ${emergency.id} • Registered Sector: ${emergency.location}`}
        icon={<Flame size={26} color="var(--color-critical)" />}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button
              variant={activeTab === 'map' ? 'secondary' : 'outline'}
              size="md"
              onClick={() => handleTabChange('map')}
              icon={<Map size={16} />}
            >
              Tactical Map ({nearbyVolunteers.length})
            </Button>
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setIsEditModalOpen(true)}
                  icon={<Edit3 size={16} />}
                >
                  Edit Emergency
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setIsDeleteEmergencyOpen(true)}
                  icon={<Trash2 size={16} color="var(--color-critical)" />}
                  style={{ color: 'var(--color-critical)' }}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            background:
              notification.type === 'success'
                ? 'var(--color-success-bg)'
                : 'var(--color-critical-bg)',
            border: `1px solid ${
              notification.type === 'success'
                ? 'var(--color-success-border)'
                : 'var(--color-critical-border)'
            }`,
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-6)',
            fontSize: 'var(--font-sm)',
            color:
              notification.type === 'success'
                ? 'var(--color-success)'
                : 'var(--color-critical)'
          }}
        >
          {notification.type === 'success' ? (
            <CheckCircle size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Interactive Tabs */}
      <div className="tab-list" style={{ marginBottom: 'var(--space-6)' }}>
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'tab-btn-active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={16} />
            <span>Incident Overview</span>
          </div>
        </button>

        <button
          className={`tab-btn ${activeTab === 'map' ? 'tab-btn-active' : ''}`}
          onClick={() => handleTabChange('map')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Map size={16} />
            <span>Tactical Map & Proximity ({nearbyVolunteers.length})</span>
          </div>
        </button>

        <button
          className={`tab-btn ${activeTab === 'intelligence' ? 'tab-btn-active' : ''}`}
          onClick={() => handleTabChange('intelligence')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Brain size={16} />
            <span>Emergency Intelligence</span>
          </div>
        </button>

        {isAdmin && (
          <button
            className={`tab-btn ${activeTab === 'matching' ? 'tab-btn-active' : ''}`}
            onClick={() => handleTabChange('matching')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <GitMerge size={16} />
              <span>Matching & Recommendations ({recommendations.length})</span>
            </div>
          </button>
        )}
      </div>

      {/* TAB 1: OVERVIEW & QUOTAS */}
      {activeTab === 'overview' && (
        <div>
          {/* Top Incident Summary Panel */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-6)'
            }}
          >
            {/* Status & Severity Card */}
            <Card style={{ padding: 'var(--space-5)' }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 'var(--font-xs)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: 'var(--space-3)',
                  letterSpacing: '0.05em'
                }}
              >
                Incident Priority & Status
              </span>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  marginBottom: 'var(--space-4)',
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Severity</span>
                  <EmergencySeverityBadge severity={emergency.severity} />
                </div>

                <div>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Current Status</span>
                  <EmergencyStatusBadge status={emergency.status} />
                </div>
              </div>

              {/* Admin Status Transition Control */}
              {isAdmin ? (
                <div style={{ marginTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
                  <label
                    htmlFor="status-transition-select"
                    style={{
                      display: 'block',
                      fontSize: 'var(--font-xs)',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--space-2)'
                    }}
                  >
                    Change Incident Status:
                  </label>
                  <Select
                    id="status-transition-select"
                    value={emergency.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    options={EMERGENCY_STATUSES.map((st) => ({
                      value: st,
                      label: STATUS_LABELS[st] || st
                    }))}
                    helperText="Transitions state across open, in_progress, resolved, and cancelled."
                  />
                </div>
              ) : (
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                  Status updates are managed by Incident Command Administration.
                </div>
              )}
            </Card>

            {/* Location & Personnel Quota Card */}
            <Card style={{ padding: 'var(--space-5)' }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 'var(--font-xs)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: 'var(--space-3)',
                  letterSpacing: '0.05em'
                }}
              >
                Location & Personnel Quota
              </span>

              <div style={{ marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontWeight: 600 }}>
                  <MapPin size={16} />
                  <span>{emergency.location}</span>
                </div>
                {(emergency.latitude !== null && emergency.latitude !== undefined && emergency.longitude !== null && emergency.longitude !== undefined) ? (
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginLeft: '22px', display: 'block' }}>
                    Latitude: {Number(emergency.latitude).toFixed(4)}, Longitude: {Number(emergency.longitude).toFixed(4)}
                  </span>
                ) : (
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginLeft: '22px', display: 'block' }}>
                    Geographic coordinates not specified
                  </span>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: 'var(--space-3)',
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  marginTop: 'var(--space-2)'
                }}
              >
                <Users size={18} color="var(--color-primary)" />
                <div>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>
                    Required Volunteers
                  </span>
                  <strong style={{ fontSize: 'var(--font-base)', color: 'var(--text-primary)' }}>
                    {emergency.requiredVolunteers} Volunteers Total
                  </strong>
                </div>
              </div>

              <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTabChange('map')}
                  icon={<Map size={14} />}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Open Tactical Map & Proximity ({nearbyVolunteers.length})
                </Button>
              </div>
            </Card>

            {/* Timeline & Metadata Card */}
            <Card style={{ padding: 'var(--space-5)' }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 'var(--font-xs)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: 'var(--space-3)',
                  letterSpacing: '0.05em'
                }}
              >
                Timeline & Auditing
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--font-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="var(--text-muted)" />
                  <div>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Declared At</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{formattedCreated}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="var(--text-muted)" />
                  <div>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Last Incident Update</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{formattedUpdated}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Description Panel */}
          <Card style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
            <h4
              style={{
                fontSize: 'var(--font-base)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-3)'
              }}
            >
              Incident Narrative & Situation Report
            </h4>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 'var(--font-sm)', whiteSpace: 'pre-wrap', margin: 0 }}>
              {emergency.description}
            </p>
          </Card>

          {/* Emergency Requirements Section */}
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-4)',
                flexWrap: 'wrap',
                gap: 'var(--space-3)'
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 'var(--font-xl)',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Layers size={22} color="var(--color-primary)" />
                  <span>Emergency Requirements ({reqCount})</span>
                </h3>
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                  Required disaster skills, minimum proficiency standards, and target volunteer quotas.
                </p>
              </div>

              {isAdmin && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleOpenAddReq}
                  icon={<Plus size={16} />}
                >
                  Add Requirement
                </Button>
              )}
            </div>

            {reqCount === 0 ? (
              <EmptyState
                icon={<Layers size={32} color="var(--text-muted)" />}
                title="No requirements added yet."
                description={
                  isAdmin
                    ? "This incident has no skill requirements declared. Add the first emergency requirement to specify needed skills and quotas."
                    : "No specific skill requirements have been published for this incident yet."
                }
                action={
                  isAdmin ? (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleOpenAddReq}
                      icon={<Plus size={16} />}
                    >
                      Add Requirement
                    </Button>
                  ) : null
                }
              />
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: 'var(--space-4)'
                }}
              >
                {emergency.requirements.map((req) => (
                  <Card
                    key={req.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: 'var(--space-5)',
                      borderTop: `3px solid ${
                        req.urgency === 'immediate'
                          ? 'var(--color-critical)'
                          : req.urgency === 'high'
                          ? 'var(--color-warning)'
                          : req.urgency === 'medium'
                          ? 'var(--color-info)'
                          : 'var(--border-default)'
                      }`
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 'var(--space-3)',
                          gap: 'var(--space-2)'
                        }}
                      >
                        <Badge variant={URGENCY_BADGE_VARIANTS[req.urgency] || 'neutral'}>
                          {URGENCY_LABELS[req.urgency] || req.urgency}
                        </Badge>
                        <Badge variant={PROFICIENCY_BADGES[req.minProficiency] || 'neutral'}>
                          Min: {req.minProficiency}
                        </Badge>
                      </div>

                      {/* Skill Name */}
                      <h4
                        style={{
                          fontSize: 'var(--font-base)',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          marginBottom: 'var(--space-2)',
                          lineHeight: 1.3
                        }}
                      >
                        {req.skill}
                      </h4>

                      {/* Category */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: 'var(--font-xs)',
                          color: 'var(--color-primary)',
                          marginBottom: 'var(--space-3)'
                        }}
                      >
                        <Tag size={13} />
                        <span style={{ fontWeight: 600 }}>{req.category}</span>
                      </div>

                      {/* Personnel Quota */}
                      <div
                        style={{
                          padding: 'var(--space-3)',
                          background: 'var(--bg-surface-elevated)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                          marginBottom: 'var(--space-3)',
                          fontSize: 'var(--font-sm)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>Minimum Volunteers:</span>
                          <strong style={{ color: 'var(--text-primary)' }}>{req.minVolunteers} Responders</strong>
                        </div>
                      </div>

                      {/* Fulfillment State Representation */}
                      <div
                        style={{
                          padding: 'var(--space-2) var(--space-3)',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px dashed var(--border-default)',
                          marginBottom: 'var(--space-4)',
                          fontSize: 'var(--font-xs)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        <span style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '2px' }}>
                          Requirement Fulfillment:
                        </span>
                        <strong style={{ color: 'var(--color-info)' }}>
                          {req.fulfillmentStatus || `0 / ${req.minVolunteers} Allocated (Dev Placeholder)`}
                        </strong>
                      </div>
                    </div>

                    {/* Admin Actions on Requirement */}
                    {isAdmin && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: 'var(--space-2)',
                          borderTop: '1px solid var(--border-subtle)',
                          paddingTop: 'var(--space-3)',
                          marginTop: 'var(--space-2)'
                        }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditReq(req)}
                          icon={<Edit3 size={14} />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDeleteReq(req)}
                          icon={<Trash2 size={14} color="var(--color-critical)" />}
                          style={{ color: 'var(--color-critical)' }}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TACTICAL MAP & PROXIMITY */}
      {activeTab === 'map' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
          {/* Map Section */}
          <div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={20} color="var(--color-critical)" />
                <span>Geospatial Incident Map & Volunteer Locations</span>
              </h3>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                Powered by OpenStreetMap & Leaflet. Displays incident epicenter and nearby responder proximity.
              </p>
            </div>

            <EmergencyMap
              emergency={emergency}
              nearbyVolunteers={nearbyVolunteers}
              height="440px"
            />
          </div>

          {/* Nearby Volunteers Roster */}
          <div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Navigation size={20} color="var(--color-primary)" />
                <span>Nearby Volunteers & Proximity Roster ({nearbyVolunteers.length})</span>
              </h3>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                Registered responders located within proximity radius of the incident.
              </p>
            </div>

            <NearbyVolunteersList
              volunteers={nearbyVolunteers}
              isLoading={isLoadingStage6}
            />
          </div>
        </div>
      )}

      {/* TAB 3: EMERGENCY INTELLIGENCE */}
      {activeTab === 'intelligence' && (
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <EmergencyIntelligencePanel
            intelligence={intelligence}
            isLoading={isLoadingStage6}
          />
        </div>
      )}

      {/* TAB 4: MATCHING & RECOMMENDATIONS (ADMIN ONLY) */}
      {isAdmin && activeTab === 'matching' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', marginBottom: 'var(--space-8)' }}>
          {/* Recommended Volunteers Section */}
          <div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--color-primary)" />
                <span>Top Recommended Responders ({recommendations.length})</span>
              </h3>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                Prioritized algorithmic candidates ranked by suitability and recommendation scores.
              </p>
            </div>

            <VolunteerRecommendationsSection
              recommendations={recommendations}
              isLoading={isLoadingStage6}
              onAssign={handleOpenAssign}
            />
          </div>

          {/* Full Matching Candidates Section */}
          <div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GitMerge size={20} color="var(--color-info)" />
                <span>All Incident Matching Candidates ({matches.length})</span>
              </h3>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                Multi-criteria candidate pool matching declared emergency skills and requirements.
              </p>
            </div>

            <VolunteerMatchingSection
              matches={matches}
              isLoading={isLoadingStage6}
              emergencyTitle={emergency.title}
              onAssign={handleOpenAssign}
            />
          </div>
        </div>
      )}

      {/* Admin Emergency Edit Modal */}
      {isAdmin && (
        <EmergencyFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveEmergency}
          emergency={emergency}
          isLoading={isSavingEmergency}
        />
      )}

      {/* Admin Emergency Delete Confirmation */}
      {isAdmin && (
        <ConfirmationDialog
          isOpen={isDeleteEmergencyOpen}
          onClose={() => setIsDeleteEmergencyOpen(false)}
          onConfirm={handleConfirmDeleteEmergency}
          title="Delete Emergency Declaration"
          message={`Are you sure you want to permanently delete emergency declaration "${emergency.title}"? This action removes the emergency and its associated quotas from your frontend development records.`}
          confirmText="Delete Emergency"
          cancelText="Cancel"
          isDanger
          isLoading={isDeletingEmergency}
        />
      )}

      {/* Admin Requirement Form Modal */}
      {isAdmin && (
        <RequirementFormModal
          isOpen={isReqModalOpen}
          onClose={() => setIsReqModalOpen(false)}
          onSave={handleSaveRequirement}
          requirement={selectedReq}
          isLoading={isSavingReq}
        />
      )}

      {/* Admin Requirement Delete Confirmation */}
      {isAdmin && (
        <ConfirmationDialog
          isOpen={isDeleteReqOpen}
          onClose={() => setIsDeleteReqOpen(false)}
          onConfirm={handleConfirmDeleteReq}
          title="Delete Skill Requirement"
          message={
            reqToDelete
              ? `Are you sure you want to remove the requirement for "${reqToDelete.skill}" (${reqToDelete.minVolunteers} volunteers) from this emergency incident?`
              : 'Are you sure you want to remove this requirement?'
          }
          confirmText="Delete Requirement"
          cancelText="Cancel"
          isDanger
          isLoading={isDeletingReq}
        />
      )}

      {/* Admin Assignment Creation Modal */}
      {isAdmin && (
        <AssignmentCreationModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onSave={handleSaveAssignment}
          initialEmergency={emergency}
          initialVolunteer={volunteerToAssign}
          initialSkill={volunteerToAssign?.skill}
          isLoading={isSavingAssignment}
        />
      )}
    </div>
  );
};

export default EmergencyDetailPage;
