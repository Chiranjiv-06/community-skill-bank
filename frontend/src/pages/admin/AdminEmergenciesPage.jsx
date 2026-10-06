import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Plus,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Info
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import LoadingState from '../../components/states/LoadingState';
import EmptyState from '../../components/states/EmptyState';
import EmergencyCard from '../../components/emergency/EmergencyCard';
import EmergencyFormModal from '../../components/emergency/EmergencyFormModal';
import emergencyService from '../../services/emergencyService';
import {
  EMERGENCY_STATUSES,
  STATUS_LABELS,
  EMERGENCY_SEVERITIES,
  SEVERITY_LABELS
} from '../../data/devEmergencies';

export const AdminEmergenciesPage = () => {
  const navigate = useNavigate();
  const [emergencies, setEmergencies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  // Emergency Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Emergency Delete Confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [emergencyToDelete, setEmergencyToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification Toast
  const [notification, setNotification] = useState(null);

  const fetchEmergencies = async () => {
    setIsLoading(true);
    try {
      const data = await emergencyService.getEmergencies();
      setEmergencies(data);
    } catch (err) {
      console.error('[AdminEmergenciesPage] Error fetching emergencies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();
  }, []);

  // Filtered emergencies
  const filteredEmergencies = useMemo(() => {
    return emergencies.filter((emg) => {
      // Status filter
      if (statusFilter !== 'ALL' && emg.status !== statusFilter) {
        return false;
      }
      // Severity filter
      if (severityFilter !== 'ALL' && emg.severity !== severityFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = emg.title.toLowerCase().includes(query);
        const matchesDesc = emg.description.toLowerCase().includes(query);
        const matchesLocation = emg.location.toLowerCase().includes(query);
        const matchesSkill = emg.requirements?.some((r) =>
          r.skill.toLowerCase().includes(query) || r.category.toLowerCase().includes(query)
        );
        if (!matchesTitle && !matchesDesc && !matchesLocation && !matchesSkill) {
          return false;
        }
      }
      return true;
    });
  }, [emergencies, searchQuery, statusFilter, severityFilter]);

  const handleOpenCreateModal = () => {
    setSelectedEmergency(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emergency) => {
    setSelectedEmergency(emergency);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEmergency(null);
  };

  const handleSaveEmergency = async (formData) => {
    setIsSaving(true);
    try {
      if (selectedEmergency) {
        const updated = await emergencyService.updateEmergency(selectedEmergency.id, formData);
        setEmergencies((prev) =>
          prev.map((e) => (e.id === selectedEmergency.id ? updated : e))
        );
        setNotification({
          type: 'success',
          message: `Emergency "${updated.title}" updated successfully.`
        });
      } else {
        const created = await emergencyService.createEmergency(formData);
        setEmergencies((prev) => [created, ...prev]);
        setNotification({
          type: 'success',
          message: `New emergency declaration "${created.title}" published.`
        });
      }
      setIsModalOpen(false);
      setTimeout(() => setNotification(null), 4500);
    } catch (err) {
      console.error('[AdminEmergenciesPage] Error saving emergency:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDeleteDialog = (emergency) => {
    setEmergencyToDelete(emergency);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setEmergencyToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!emergencyToDelete) return;
    setIsDeleting(true);
    try {
      await emergencyService.deleteEmergency(emergencyToDelete.id);
      setEmergencies((prev) => prev.filter((e) => e.id !== emergencyToDelete.id));
      setNotification({
        type: 'success',
        message: `Emergency declaration "${emergencyToDelete.title}" deleted.`
      });
      setIsDeleteDialogOpen(false);
      setEmergencyToDelete(null);
      setTimeout(() => setNotification(null), 4500);
    } catch (err) {
      console.error('[AdminEmergenciesPage] Error deleting emergency:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setSeverityFilter('ALL');
  };

  if (isLoading) {
    return <LoadingState message="Loading incident command dashboard..." minHeight="380px" />;
  }

  return (
    <div className="emergency-management-container" style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', boxSizing: 'border-box', minWidth: 0 }}>
      {/* Page Header */}
      <PageHeader
        title="Emergency Incident Command"
        subtitle="Declare, monitor, categorize, and transition disaster events across municipal and regional sectors."
        icon={<Flame size={24} color="var(--color-critical)" />}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/admin/emergencies/requirements')}
              icon={<FileSpreadsheet size={16} />}
            >
              Requirements Bank
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleOpenCreateModal}
              icon={<Plus size={16} />}
            >
              Declare Emergency
            </Button>
          </div>
        }
      />

      {/* Development State Banner */}
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
          <strong style={{ color: 'var(--text-primary)' }}>Incident Operations Command:</strong> Monitor real-time disaster declarations, manage personnel mobilization quotas, and track field response lifecycle across all sectors.
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

      {/* Filter and Search Bar */}
      {(emergencies.length > 0 || searchQuery || statusFilter !== 'ALL' || severityFilter !== 'ALL') && (
        <Card style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-4)',
              alignItems: 'center'
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Input
                placeholder="Search emergency, location, or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ marginBottom: 0, paddingLeft: '36px' }}
              />
              <Search
                size={16}
                color="var(--text-muted)"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}
              />
            </div>

            {/* Severity Filter */}
            <div>
              <Select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                style={{ marginBottom: 0 }}
                options={[
                  { value: 'ALL', label: 'All Severities' },
                  ...EMERGENCY_SEVERITIES.map((s) => ({
                    value: s,
                    label: `Severity: ${SEVERITY_LABELS[s] || s}`
                  }))
                ]}
              />
            </div>

            {/* Status Filter */}
            <div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ marginBottom: 0 }}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  ...EMERGENCY_STATUSES.map((st) => ({
                    value: st,
                    label: `Status: ${STATUS_LABELS[st] || st}`
                  }))
                ]}
              />
            </div>

            {/* Count & Reset */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 'var(--font-xs)',
                color: 'var(--text-secondary)'
              }}
            >
              <span>
                Showing <strong>{filteredEmergencies.length}</strong> of <strong>{emergencies.length}</strong> incidents
              </span>
              {(searchQuery || statusFilter !== 'ALL' || severityFilter !== 'ALL') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  style={{ fontSize: 'var(--font-xs)' }}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Content Grid / Empty States */}
      {emergencies.length === 0 ? (
        <EmptyState
          icon={<Flame size={32} color="var(--color-critical)" />}
          title="No emergencies available."
          description="There are currently no active or historical emergency declarations in the command register."
          action={
            <Button
              variant="primary"
              size="md"
              onClick={handleOpenCreateModal}
              icon={<Plus size={16} />}
            >
              Declare Emergency
            </Button>
          }
        />
      ) : filteredEmergencies.length === 0 ? (
        <EmptyState
          icon={<Search size={32} color="var(--text-muted)" />}
          title="No matching emergencies found"
          description="No emergency incidents match your search query or selected filters."
          action={
            <Button variant="secondary" size="sm" onClick={handleResetFilters}>
              Clear Search & Filters
            </Button>
          }
        />
      ) : (
        <div
          className="emergency-cards-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
            gap: 'var(--space-4)',
            width: '100%',
            boxSizing: 'border-box',
            minWidth: 0
          }}
        >
          {filteredEmergencies.map((emergency) => (
            <EmergencyCard
              key={emergency.id}
              emergency={emergency}
              isAdmin={true}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteDialog}
            />
          ))}
        </div>
      )}

      {/* Emergency Create / Edit Modal */}
      <EmergencyFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveEmergency}
        emergency={selectedEmergency}
        isLoading={isSaving}
      />

      {/* Emergency Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Emergency Declaration"
        message={
          emergencyToDelete
            ? `Are you sure you want to permanently delete emergency declaration "${emergencyToDelete.title}"? This action cannot be undone.`
            : 'Are you sure you want to delete this emergency declaration?'
        }
        confirmText="Delete Emergency"
        cancelText="Cancel"
        isDanger
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AdminEmergenciesPage;
