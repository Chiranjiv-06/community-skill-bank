import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  Clock,
  Navigation,
  CheckCircle,
  MapPin,
  Flame,
  ShieldCheck,
  BellRing
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingState from '../../components/states/LoadingState';
import EmptyState from '../../components/states/EmptyState';
import AssignmentCard from '../../components/assignment/AssignmentCard';
import VolunteerResponseModal from '../../components/assignment/VolunteerResponseModal';
import { useAuth } from '../../context/AuthContext';
import assignmentService from '../../services/assignmentService';

export const AssignmentsPage = () => {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed' | 'all'

  // Response Modal State
  const [modalState, setModalState] = useState({
    isOpen: false,
    assignment: null,
    mode: 'respond' // 'respond' | 'start' | 'complete'
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Notification Toast
  const [notification, setNotification] = useState(null);

  const volunteerId = currentUser?.id || 'dev-skl-002';

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const list = await assignmentService.getAssignmentsForVolunteer(volunteerId);
      setAssignments(list);
    } catch (err) {
      console.error('[AssignmentsPage] Error fetching volunteer assignments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [volunteerId]);

  // Active vs Completed
  const activeAssignments = useMemo(() => {
    return assignments.filter((a) => ['assigned', 'accepted', 'in_progress'].includes(a.status));
  }, [assignments]);

  const completedAssignments = useMemo(() => {
    return assignments.filter((a) => ['completed', 'declined'].includes(a.status));
  }, [assignments]);

  const displayedAssignments = useMemo(() => {
    if (activeTab === 'active') return activeAssignments;
    if (activeTab === 'completed') return completedAssignments;
    return assignments;
  }, [activeTab, activeAssignments, completedAssignments, assignments]);

  // Newly assigned count needing response
  const pendingResponseCount = useMemo(() => {
    return assignments.filter((a) => a.status === 'assigned').length;
  }, [assignments]);

  // Open Response Modal (Accept / Decline)
  const handleOpenRespond = (assignment) => {
    setModalState({
      isOpen: true,
      assignment,
      mode: 'respond'
    });
  };

  // Open Start Modal (In Progress)
  const handleOpenStart = (assignment) => {
    setModalState({
      isOpen: true,
      assignment,
      mode: 'start'
    });
  };

  // Open Complete Modal
  const handleOpenComplete = (assignment) => {
    setModalState({
      isOpen: true,
      assignment,
      mode: 'complete'
    });
  };

  // Submit Modal Action
  const handleModalSubmit = async (data) => {
    setIsUpdating(true);
    try {
      const { assignment, mode } = modalState;
      let updated;

      if (mode === 'respond') {
        updated = await assignmentService.respondToAssignment(assignment.id, data);
        setNotification({
          type: 'success',
          message: data.response === 'accepted'
            ? `Assignment for ${updated.emergencyTitle} accepted! Next step: Mobilize and mark In Progress when on-scene.`
            : `Assignment declined. Dispatchers have been notified.`
        });
      } else if (mode === 'start') {
        updated = await assignmentService.startAssignment(assignment.id, data);
        setNotification({
          type: 'success',
          message: `Deployment status updated to In Progress! Incident command is monitoring your field activity.`
        });
      } else if (mode === 'complete') {
        updated = await assignmentService.completeAssignment(assignment.id, data);
        setNotification({
          type: 'success',
          message: `Mission successfully completed! Field report submitted to incident command.`
        });
      }

      // Update state
      setAssignments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setModalState({ isOpen: false, assignment: null, mode: 'respond' });
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error('[AssignmentsPage] Error updating assignment status:', err);
      setNotification({ type: 'error', message: err.message || 'Failed to update assignment.' });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading your emergency assignments and response directives..." minHeight="380px" />;
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <PageHeader
        title="My Emergency Assignments"
        subtitle="Review incident dispatches, confirm response availability, update field deployment progress, and conclude missions."
        badge={
          pendingResponseCount > 0 ? (
            <Badge variant="warning" pulse>
              <BellRing size={13} /> {pendingResponseCount} Action Required
            </Badge>
          ) : (
            <Badge variant="success">All Dispatches Acknowledged</Badge>
          )
        }
        icon={<ClipboardList size={24} color="var(--color-primary)" />}
      />

      {/* Urgent Action Banner if pending assignments */}
      {pendingResponseCount > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-4)',
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-6)',
            flexWrap: 'wrap',
            gap: 'var(--space-3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <AlertCircle size={20} color="var(--color-warning)" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: 'var(--text-primary)', display: 'block' }}>
                You have {pendingResponseCount} pending emergency dispatch awaiting response!
              </strong>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                Please review the briefing details and accept or decline promptly to assist incident coordinators.
              </span>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveTab('active')}
          >
            Review Dispatches
          </Button>
        </div>
      )}

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

      {/* Tabs: Active vs Completed */}
      <div className="tab-list" style={{ marginBottom: 'var(--space-6)' }}>
        <button
          className={`tab-btn ${activeTab === 'active' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} />
            <span>Active Deployments ({activeAssignments.length})</span>
          </div>
        </button>

        <button
          className={`tab-btn ${activeTab === 'completed' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={16} />
            <span>Completed Missions ({completedAssignments.length})</span>
          </div>
        </button>

        <button
          className={`tab-btn ${activeTab === 'all' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ClipboardList size={16} />
            <span>All Assignments ({assignments.length})</span>
          </div>
        </button>
      </div>

      {/* Content Grid */}
      {displayedAssignments.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={32} color="var(--text-muted)" />}
          title={
            activeTab === 'active'
              ? 'No active emergency assignments'
              : 'No completed assignments recorded'
          }
          description={
            activeTab === 'active'
              ? 'You currently have no active assignments. When incident commanders match your skills, assignments will appear here.'
              : 'Completed emergency responses and mission logs will appear in this archive.'
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
          {displayedAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              isVolunteer={true}
              onRespond={handleOpenRespond}
              onStart={handleOpenStart}
              onComplete={handleOpenComplete}
            />
          ))}
        </div>
      )}

      {/* Volunteer Response / Update Modal */}
      <VolunteerResponseModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        assignment={modalState.assignment}
        mode={modalState.mode}
        onSubmit={handleModalSubmit}
        isLoading={isUpdating}
      />
    </div>
  );
};

export default AssignmentsPage;
