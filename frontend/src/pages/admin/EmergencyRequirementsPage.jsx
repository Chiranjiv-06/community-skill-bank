import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  Plus,
  Flame,
  ArrowRight,
  Layers,
  Edit3,
  Trash2,
  AlertCircle,
  CheckCircle,
  Tag,
  Info
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Select from '../../components/common/Select';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import LoadingState from '../../components/states/LoadingState';
import EmptyState from '../../components/states/EmptyState';
import RequirementFormModal from '../../components/emergency/RequirementFormModal';
import EmergencyStatusBadge from '../../components/emergency/EmergencyStatusBadge';
import EmergencySeverityBadge from '../../components/emergency/EmergencySeverityBadge';
import emergencyService from '../../services/emergencyService';
import {
  URGENCY_LABELS,
  URGENCY_BADGE_VARIANTS
} from '../../data/devEmergencies';

const PROFICIENCY_BADGES = {
  Beginner: 'neutral',
  Intermediate: 'info',
  Advanced: 'warning',
  Expert: 'success'
};

export const EmergencyRequirementsPage = () => {
  const navigate = useNavigate();
  const [emergencies, setEmergencies] = useState([]);
  const [selectedEmergencyId, setSelectedEmergencyId] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Requirement Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [targetEmergencyId, setTargetEmergencyId] = useState('');
  const [selectedReq, setSelectedReq] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Requirement Delete Confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [reqToDelete, setReqToDelete] = useState(null);
  const [deleteEmergencyId, setDeleteEmergencyId] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification Toast
  const [notification, setNotification] = useState(null);

  const fetchEmergencies = async () => {
    setIsLoading(true);
    try {
      const data = await emergencyService.getEmergencies();
      setEmergencies(data);
    } catch (err) {
      console.error('[EmergencyRequirementsPage] Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();
  }, []);

  // Filtered emergency list based on dropdown selection
  const displayedEmergencies = emergencies.filter((emg) =>
    selectedEmergencyId === 'ALL' ? true : emg.id === selectedEmergencyId
  );

  // Total requirements count
  const totalRequirements = displayedEmergencies.reduce(
    (acc, emg) => acc + (emg.requirements?.length || 0),
    0
  );

  const handleOpenAddReq = (emergencyId) => {
    setModalMode('add');
    setTargetEmergencyId(emergencyId || (emergencies[0]?.id || ''));
    setSelectedReq(null);
    setIsModalOpen(true);
  };

  const handleOpenEditReq = (emergencyId, req) => {
    setModalMode('edit');
    setTargetEmergencyId(emergencyId);
    setSelectedReq(req);
    setIsModalOpen(true);
  };

  const handleSaveRequirement = async (formData) => {
    setIsSaving(true);
    try {
      if (modalMode === 'add') {
        const newReq = await emergencyService.createRequirement(targetEmergencyId, formData);
        setEmergencies((prev) =>
          prev.map((e) =>
            e.id === targetEmergencyId
              ? { ...e, requirements: [...(e.requirements || []), newReq] }
              : e
          )
        );
        setNotification({
          type: 'success',
          message: `Requirement "${newReq.skill}" added.`
        });
      } else {
        const updated = await emergencyService.updateRequirement(
          targetEmergencyId,
          selectedReq.id,
          formData
        );
        setEmergencies((prev) =>
          prev.map((e) =>
            e.id === targetEmergencyId
              ? {
                  ...e,
                  requirements: (e.requirements || []).map((r) =>
                    r.id === selectedReq.id ? updated : r
                  )
                }
              : e
          )
        );
        setNotification({
          type: 'success',
          message: `Requirement "${updated.skill}" updated.`
        });
      }
      setIsModalOpen(false);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('[EmergencyRequirementsPage] Error saving requirement:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDelete = (emergencyId, req) => {
    setDeleteEmergencyId(emergencyId);
    setReqToDelete(req);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!reqToDelete || !deleteEmergencyId) return;
    setIsDeleting(true);
    try {
      await emergencyService.deleteRequirement(deleteEmergencyId, reqToDelete.id);
      setEmergencies((prev) =>
        prev.map((e) =>
          e.id === deleteEmergencyId
            ? {
                ...e,
                requirements: (e.requirements || []).filter((r) => r.id !== reqToDelete.id)
              }
            : e
        )
      );
      setNotification({
        type: 'success',
        message: `Requirement "${reqToDelete.skill}" deleted.`
      });
      setIsDeleteDialogOpen(false);
      setReqToDelete(null);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('[EmergencyRequirementsPage] Error deleting requirement:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading requirements bank and quotas..." minHeight="380px" />;
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <PageHeader
        title="Emergency Requirements & Quotas"
        subtitle="Define personnel quotas, skill requirements, and minimum proficiency levels per active disaster incident."
        icon={<FileSpreadsheet size={24} />}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => handleOpenAddReq(emergencies[0]?.id)}
            disabled={emergencies.length === 0}
            icon={<Plus size={16} />}
          >
            Add Requirement
          </Button>
        }
      />

      {/* Dev State Notice */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'rgba(249, 115, 22, 0.08)',
          border: '1px solid rgba(249, 115, 22, 0.25)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-6)',
          fontSize: 'var(--font-sm)',
          color: 'var(--text-secondary)'
        }}
      >
        <Info size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>Emergency Requirements (Dev State):</strong> Manage personnel skill quotas per emergency declaration. Volunteer skill matching and automated recommendations will be built in Stage 6.
        </div>
      </div>

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

      {/* Emergency Filter Selector */}
      {emergencies.length > 0 && (
        <Card style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-4)',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ flex: 1, minWidth: '260px' }}>
              <label
                htmlFor="filter-emergency-select"
                style={{
                  display: 'block',
                  fontSize: 'var(--font-xs)',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-1)'
                }}
              >
                Filter Requirements by Active Incident:
              </label>
              <Select
                id="filter-emergency-select"
                value={selectedEmergencyId}
                onChange={(e) => setSelectedEmergencyId(e.target.value)}
                style={{ marginBottom: 0 }}
                options={[
                  { value: 'ALL', label: `All Emergencies (${emergencies.length} Incidents)` },
                  ...emergencies.map((e) => ({
                    value: e.id,
                    label: `${e.title} [${e.status}]`
                  }))
                ]}
              />
            </div>

            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
              Total Requirements Configured: <strong style={{ color: 'var(--text-primary)' }}>{totalRequirements}</strong>
            </div>
          </div>
        </Card>
      )}

      {/* Emergency Groups */}
      {displayedEmergencies.length === 0 ? (
        <EmptyState
          icon={<FileSpreadsheet size={32} color="var(--text-muted)" />}
          title="No emergencies available"
          description="Create an emergency incident declaration first before configuring skill requirements."
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/admin/emergencies')}
            >
              Go to Emergency Command
            </Button>
          }
        />
      ) : (
        displayedEmergencies.map((emg) => {
          const reqs = emg.requirements || [];
          return (
            <Card key={emg.id} style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-6)' }}>
              {/* Emergency Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: 'var(--space-4)',
                  marginBottom: 'var(--space-4)',
                  flexWrap: 'wrap',
                  gap: 'var(--space-3)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <EmergencySeverityBadge severity={emg.severity} />
                    <EmergencyStatusBadge status={emg.status} />
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                      {emg.location}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {emg.title}
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenAddReq(emg.id)}
                    icon={<Plus size={14} />}
                  >
                    Add Requirement
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/admin/emergencies/${emg.id}`)}
                    icon={<ArrowRight size={14} />}
                  >
                    View Details
                  </Button>
                </div>
              </div>

              {/* Requirements Grid */}
              {reqs.length === 0 ? (
                <div
                  style={{
                    padding: 'var(--space-6)',
                    textAlign: 'center',
                    background: 'var(--bg-surface-elevated)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--border-default)',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--font-sm)'
                  }}
                >
                  <p style={{ marginBottom: 'var(--space-3)' }}>
                    No skill requirements or volunteer quotas have been declared for this incident.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenAddReq(emg.id)}
                    icon={<Plus size={14} />}
                  >
                    Add First Requirement
                  </Button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 'var(--space-3)'
                  }}
                >
                  {reqs.map((req) => (
                    <div
                      key={req.id}
                      style={{
                        padding: 'var(--space-4)',
                        background: 'var(--bg-surface-elevated)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 'var(--space-2)'
                          }}
                        >
                          <Badge variant={URGENCY_BADGE_VARIANTS[req.urgency] || 'neutral'}>
                            {URGENCY_LABELS[req.urgency] || req.urgency}
                          </Badge>
                          <Badge variant={PROFICIENCY_BADGES[req.minProficiency] || 'neutral'}>
                            Min: {req.minProficiency}
                          </Badge>
                        </div>

                        <h4
                          style={{
                            fontSize: 'var(--font-sm)',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            marginBottom: '4px'
                          }}
                        >
                          {req.skill}
                        </h4>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: 'var(--font-xs)',
                            color: 'var(--color-primary)',
                            marginBottom: 'var(--space-3)'
                          }}
                        >
                          <Tag size={12} />
                          <span>{req.category}</span>
                        </div>

                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                          Quota: <strong style={{ color: 'var(--text-primary)' }}>{req.minVolunteers} Volunteers</strong>
                        </div>

                        <div
                          style={{
                            padding: '4px 8px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px dashed var(--border-default)',
                            fontSize: '11px',
                            color: 'var(--color-info)'
                          }}
                        >
                          {req.fulfillmentStatus || `0 / ${req.minVolunteers} Allocated (Dev Placeholder)`}
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: 'var(--space-2)',
                          borderTop: '1px solid var(--border-subtle)',
                          paddingTop: 'var(--space-2)',
                          marginTop: 'var(--space-3)'
                        }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditReq(emg.id, req)}
                          icon={<Edit3 size={13} />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDelete(emg.id, req)}
                          icon={<Trash2 size={13} color="var(--color-critical)" />}
                          style={{ color: 'var(--color-critical)' }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })
      )}

      {/* Requirement Form Modal */}
      <RequirementFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRequirement}
        requirement={selectedReq}
        isLoading={isSaving}
      />

      {/* Delete Requirement Confirmation */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Skill Requirement"
        message={
          reqToDelete
            ? `Are you sure you want to remove the requirement for "${reqToDelete.skill}" (${reqToDelete.minVolunteers} volunteers)?`
            : 'Are you sure you want to delete this requirement?'
        }
        confirmText="Delete Requirement"
        cancelText="Cancel"
        isDanger
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EmergencyRequirementsPage;
