import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Navigation,
  CheckCircle2,
  Users2,
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
import AssignmentCard from '../../components/assignment/AssignmentCard';
import AssignmentCreationModal from '../../components/assignment/AssignmentCreationModal';
import AssignmentFeedbackModal from '../../components/assignment/AssignmentFeedbackModal';
import assignmentService from '../../services/assignmentService';
import emergencyService from '../../services/emergencyService';
import {
  ASSIGNMENT_STATUSES,
  ASSIGNMENT_STATUS_LABELS
} from '../../data/devAssignments';

export const AdminAssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [emergencyFilter, setEmergencyFilter] = useState('ALL');

  // Create Assignment Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Feedback Modal State
  const [feedbackAssignment, setFeedbackAssignment] = useState(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Delete Assignment Confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification Toast
  const [notification, setNotification] = useState(null);

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const [asgList, emgList] = await Promise.all([
        assignmentService.getAssignments(),
        emergencyService.getEmergencies()
      ]);
      setAssignments(asgList);
      setEmergencies(emgList);
    } catch (err) {
      console.error('[AdminAssignmentsPage] Error fetching assignments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (emergencyFilter !== 'ALL' && a.emergencyId !== emergencyFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchesEmg = a.emergencyTitle?.toLowerCase().includes(q);
        const matchesVol = a.volunteerName?.toLowerCase().includes(q);
        const matchesSkill = a.skill?.toLowerCase().includes(q);
        const matchesLoc = a.stagingArea?.toLowerCase().includes(q);
        if (!matchesEmg && !matchesVol && !matchesSkill && !matchesLoc) return false;
      }
      return true;
    });
  }, [assignments, searchQuery, statusFilter, emergencyFilter]);

  // Statistics counters
  const counts = useMemo(() => {
    return {
      total: assignments.length,
      assigned: assignments.filter((a) => a.status === 'assigned').length,
      accepted: assignments.filter((a) => a.status === 'accepted').length,
      in_progress: assignments.filter((a) => a.status === 'in_progress').length,
      completed: assignments.filter((a) => a.status === 'completed').length
    };
  }, [assignments]);

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleSaveAssignment = async (formData) => {
    setIsSaving(true);
    try {
      const created = await assignmentService.createAssignment(formData);
      setAssignments((prev) => [created, ...prev]);
      setNotification({
        type: 'success',
        message: `Volunteer assignment issued for "${created.volunteerName}" on ${created.emergencyTitle}.`
      });
      setIsCreateModalOpen(false);
      setTimeout(() => setNotification(null), 4500);
    } catch (err) {
      console.error('[AdminAssignmentsPage] Error creating assignment:', err);
      setNotification({ type: 'error', message: err.message || 'Failed to create assignment.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDelete = (assignment) => {
    setAssignmentToDelete(assignment);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!assignmentToDelete) return;
    setIsDeleting(true);
    try {
      await assignmentService.deleteAssignment(assignmentToDelete.id);
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentToDelete.id));
      setNotification({
        type: 'success',
        message: `Assignment for "${assignmentToDelete.volunteerName}" cancelled.`
      });
      setIsDeleteDialogOpen(false);
      setAssignmentToDelete(null);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('[AdminAssignmentsPage] Error cancelling assignment:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setEmergencyFilter('ALL');
  };

  if (isLoading) {
    return <LoadingState message="Loading incident assignments & field response roster..." minHeight="380px" />;
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <PageHeader
        title="Incident Assignment Management"
        subtitle="Orchestrate team dispatches, assign qualified volunteer responders, and monitor real-time lifecycle progression."
        icon={<ClipboardList size={24} color="var(--color-primary)" />}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreateModal}
            icon={<Plus size={16} />}
          >
            Create Assignment
          </Button>
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
          <strong style={{ color: 'var(--text-primary)' }}>Assignment Lifecycle Management:</strong> Incident commanders dispatch matched responders to emergency sites. Mission state advances through <strong>Assigned → Accepted → In Progress → Completed</strong>.
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

      {/* Summary KPI Counters Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)'
        }}
      >
        <Card style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
            Total Dispatches
          </span>
          <strong style={{ fontSize: 'var(--font-xl)', color: 'var(--text-primary)' }}>
            {counts.total}
          </strong>
        </Card>

        <Card style={{ padding: 'var(--space-4)', textAlign: 'center', borderTop: '3px solid var(--color-warning)' }}>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
            Awaiting Response
          </span>
          <strong style={{ fontSize: 'var(--font-xl)', color: 'var(--color-warning)' }}>
            {counts.assigned}
          </strong>
        </Card>

        <Card style={{ padding: 'var(--space-4)', textAlign: 'center', borderTop: '3px solid var(--color-info)' }}>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
            Accepted & En Route
          </span>
          <strong style={{ fontSize: 'var(--font-xl)', color: 'var(--color-info)' }}>
            {counts.accepted}
          </strong>
        </Card>

        <Card style={{ padding: 'var(--space-4)', textAlign: 'center', borderTop: '3px solid var(--color-primary)' }}>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
            On-Scene (In Progress)
          </span>
          <strong style={{ fontSize: 'var(--font-xl)', color: 'var(--color-primary)' }}>
            {counts.in_progress}
          </strong>
        </Card>

        <Card style={{ padding: 'var(--space-4)', textAlign: 'center', borderTop: '3px solid var(--color-success)' }}>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
            Completed
          </span>
          <strong style={{ fontSize: 'var(--font-xl)', color: 'var(--color-success)' }}>
            {counts.completed}
          </strong>
        </Card>
      </div>

      {/* Filter and Search Bar */}
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
              placeholder="Search emergency, volunteer, or skill..."
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

          {/* Status Filter */}
          <div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ marginBottom: 0 }}
              options={[
                { value: 'ALL', label: 'All Lifecycle Statuses' },
                ...ASSIGNMENT_STATUSES.map((st) => ({
                  value: st,
                  label: `Status: ${ASSIGNMENT_STATUS_LABELS[st] || st}`
                }))
              ]}
            />
          </div>

          {/* Emergency Filter */}
          <div>
            <Select
              value={emergencyFilter}
              onChange={(e) => setEmergencyFilter(e.target.value)}
              style={{ marginBottom: 0 }}
              options={[
                { value: 'ALL', label: 'All Incidents' },
                ...emergencies.map((emg) => ({
                  value: emg.id,
                  label: emg.title
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
              Showing <strong>{filteredAssignments.length}</strong> of <strong>{assignments.length}</strong> dispatches
            </span>
            {(searchQuery || statusFilter !== 'ALL' || emergencyFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                style={{ fontSize: 'var(--font-xs)' }}
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Assignments Grid */}
      {assignments.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={32} color="var(--color-primary)" />}
          title="No assignments created yet"
          description="There are currently no active or historical volunteer assignments in the incident command register."
          action={
            <Button variant="primary" size="md" onClick={handleOpenCreateModal} icon={<Plus size={16} />}>
              Create Assignment
            </Button>
          }
        />
      ) : filteredAssignments.length === 0 ? (
        <EmptyState
          icon={<Search size={32} color="var(--text-muted)" />}
          title="No matching assignments found"
          description="No volunteer assignments match your search query or selected lifecycle filters."
          action={
            <Button variant="secondary" size="sm" onClick={handleResetFilters}>
              Clear Filters
            </Button>
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 'var(--space-4)'
          }}
        >
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              isAdmin={true}
              onDelete={handleOpenDelete}
              onFeedback={(asg) => {
                setFeedbackAssignment(asg);
                setIsFeedbackModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Feedback Modal for Completed Assignment */}
      <AssignmentFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => {
          setIsFeedbackModalOpen(false);
          setFeedbackAssignment(null);
        }}
        assignment={feedbackAssignment}
        onSuccess={() => {
          fetchAssignments();
          setNotification({
            type: 'success',
            message: 'Supervisor feedback and verified hours recorded successfully!'
          });
          setTimeout(() => setNotification(null), 5000);
        }}
      />

      {/* Create Assignment Modal */}
      <AssignmentCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveAssignment}
        isLoading={isSaving}
      />

      {/* Delete/Cancel Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Cancel Volunteer Assignment"
        message={
          assignmentToDelete
            ? `Are you sure you want to cancel the assignment for "${assignmentToDelete.volunteerName}" on incident "${assignmentToDelete.emergencyTitle}"? This will revoke the dispatch.`
            : 'Are you sure you want to cancel this assignment?'
        }
        confirmText="Cancel Assignment"
        cancelText="Keep Assignment"
        isDanger
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AdminAssignmentsPage;
