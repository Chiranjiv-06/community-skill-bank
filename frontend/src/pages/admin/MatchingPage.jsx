import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitMerge,
  Flame,
  ArrowRight,
  Filter,
  CheckCircle,
  AlertCircle,
  Info,
  ClipboardList
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import LoadingState from '../../components/states/LoadingState';
import EmptyState from '../../components/states/EmptyState';
import VolunteerMatchingSection from '../../components/emergency/VolunteerMatchingSection';
import EmergencySeverityBadge from '../../components/emergency/EmergencySeverityBadge';
import EmergencyStatusBadge from '../../components/emergency/EmergencyStatusBadge';
import AssignmentCreationModal from '../../components/assignment/AssignmentCreationModal';
import emergencyService from '../../services/emergencyService';
import matchingService from '../../services/matchingService';
import assignmentService from '../../services/assignmentService';

export const MatchingPage = () => {
  const navigate = useNavigate();
  const [emergencies, setEmergencies] = useState([]);
  const [selectedEmergencyId, setSelectedEmergencyId] = useState('');
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMatchingLoading, setIsMatchingLoading] = useState(false);

  // Assignment Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [candidateToAssign, setCandidateToAssign] = useState(null);
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const initEmergencies = async () => {
      setIsLoading(true);
      try {
        const list = await emergencyService.getEmergencies();
        setEmergencies(list);
        if (list.length > 0) {
          setSelectedEmergencyId(list[0].id);
        }
      } catch (err) {
        console.error('[MatchingPage] Error loading emergencies:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initEmergencies();
  }, []);

  useEffect(() => {
    if (!selectedEmergencyId) return;

    const loadMatches = async () => {
      setIsMatchingLoading(true);
      try {
        const candidateMatches = await matchingService.getEmergencyMatches(selectedEmergencyId);
        setMatches(candidateMatches);
      } catch (err) {
        console.error('[MatchingPage] Error fetching matches:', err);
      } finally {
        setIsMatchingLoading(false);
      }
    };

    loadMatches();
  }, [selectedEmergencyId]);

  const currentEmergency = emergencies.find((e) => e.id === selectedEmergencyId);

  if (isLoading) {
    return <LoadingState message="Connecting to algorithmic matching engine..." minHeight="380px" />;
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <PageHeader
        title="Skill Matching Engine"
        subtitle="Algorithmic volunteer matching pairing active crisis incident requirements with verified nearby responder profiles."
        icon={<GitMerge size={24} />}
        actions={
          currentEmergency && (
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate(`/admin/emergencies/${currentEmergency.id}`)}
              icon={<ArrowRight size={16} />}
            >
              View Incident Details
            </Button>
          )
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

      {/* Development State Notice */}
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
          <strong style={{ color: 'var(--text-primary)' }}>Frontend Matching Interface (Dev State):</strong> Displays candidate match records and calculated Match Scores. Match algorithms and scoring calculations are computed by backend microservices.
        </div>
      </div>

      {/* Emergency Target Selector Card */}
      {emergencies.length > 0 && (
        <Card style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-5)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-4)',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ flex: 1, minWidth: '280px' }}>
              <label
                htmlFor="matching-emergency-select"
                style={{
                  display: 'block',
                  fontSize: 'var(--font-xs)',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-1)'
                }}
              >
                Select Target Emergency Declaration:
              </label>
              <Select
                id="matching-emergency-select"
                value={selectedEmergencyId}
                onChange={(e) => setSelectedEmergencyId(e.target.value)}
                style={{ marginBottom: 0 }}
                options={emergencies.map((e) => ({
                  value: e.id,
                  label: `${e.title} [${e.severity.toUpperCase()} • ${e.location}]`
                }))}
              />
            </div>

            {currentEmergency && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <EmergencySeverityBadge severity={currentEmergency.severity} />
                <EmergencyStatusBadge status={currentEmergency.status} />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Matching Results Section */}
      {emergencies.length === 0 ? (
        <EmptyState
          icon={<GitMerge size={32} color="var(--text-muted)" />}
          title="No active emergencies available"
          description="Create an emergency incident declaration before running candidate matching."
          action={
            <Button variant="primary" onClick={() => navigate('/admin/emergencies')}>
              Go to Emergency Command
            </Button>
          }
        />
      ) : (
        <VolunteerMatchingSection
          matches={matches}
          isLoading={isMatchingLoading}
          emergencyTitle={currentEmergency?.title || ''}
          onAssign={(candidate) => {
            setCandidateToAssign(candidate);
            setIsAssignModalOpen(true);
          }}
        />
      )}

      {/* Assignment Modal */}
      <AssignmentCreationModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSave={async (formData) => {
          setIsSavingAssignment(true);
          try {
            const created = await assignmentService.createAssignment(formData);
            setNotification({
              type: 'success',
              message: `Volunteer ${created.volunteerName} successfully assigned to ${created.emergencyTitle}.`
            });
            setIsAssignModalOpen(false);
            setTimeout(() => setNotification(null), 4000);
          } catch (err) {
            console.error('[MatchingPage] Error creating assignment:', err);
            setNotification({ type: 'error', message: err.message || 'Failed to dispatch assignment.' });
          } finally {
            setIsSavingAssignment(false);
          }
        }}
        initialEmergency={currentEmergency}
        initialVolunteer={candidateToAssign}
        initialSkill={candidateToAssign?.skill}
        isLoading={isSavingAssignment}
      />
    </div>
  );
};

export default MatchingPage;
