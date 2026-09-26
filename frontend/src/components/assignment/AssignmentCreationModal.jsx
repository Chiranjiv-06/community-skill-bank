import React, { useState, useEffect } from 'react';
import { ClipboardList, AlertCircle, ShieldAlert, Users2, MapPin } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import emergencyService from '../../services/emergencyService';
import { ASSIGNMENT_PRIORITIES } from '../../data/devAssignments';

export const AssignmentCreationModal = ({
  isOpen,
  onClose,
  onSave,
  initialEmergency = null,
  initialVolunteer = null,
  initialSkill = '',
  isLoading = false
}) => {
  const [emergencies, setEmergencies] = useState([]);
  const [formData, setFormData] = useState({
    emergencyId: '',
    emergencyTitle: '',
    emergencyLocation: '',
    emergencySeverity: 'critical',
    volunteerId: '',
    volunteerName: '',
    volunteerPhone: '',
    skill: '',
    proficiency: 'Intermediate',
    priority: 'Critical Surge',
    stagingArea: '',
    instructions: ''
  });

  const [errors, setErrors] = useState({});

  // Load emergencies list for selector if needed
  useEffect(() => {
    const fetchEmergenciesList = async () => {
      try {
        const list = await emergencyService.getEmergencies();
        setEmergencies(list);
      } catch (err) {
        console.error('[AssignmentCreationModal] Error loading emergencies:', err);
      }
    };
    if (isOpen) {
      fetchEmergenciesList();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const emgId = initialEmergency?.id || (emergencies.length > 0 ? emergencies[0].id : 'emg-501');
      const emgTitle = initialEmergency?.title || (emergencies.length > 0 ? emergencies[0].title : '');
      const emgLocation = initialEmergency?.location || (emergencies.length > 0 ? emergencies[0].location : '');
      const emgSeverity = initialEmergency?.severity || 'critical';

      const volId = initialVolunteer?.volunteerId || initialVolunteer?.id || 'dev-skl-002';
      const volName = initialVolunteer?.volunteerName || initialVolunteer?.name || 'Alex Rivera';
      const volPhone = initialVolunteer?.phone || '+1 (555) 234-8901';
      const skillName = initialSkill || initialVolunteer?.skill || 'Swift Water & Flood Rescue';
      const proficiency = initialVolunteer?.proficiency || 'Advanced';

      setFormData({
        emergencyId: emgId,
        emergencyTitle: emgTitle,
        emergencyLocation: emgLocation,
        emergencySeverity: emgSeverity,
        volunteerId: volId,
        volunteerName: volName,
        volunteerPhone: volPhone,
        skill: skillName,
        proficiency,
        priority: 'Critical Surge',
        stagingArea: emgLocation ? `${emgLocation} - Staging Post A` : 'Incident Staging Area',
        instructions: `Report to staging post. Coordinate with on-scene incident supervisor for ${skillName} operational tasks.`
      });
      setErrors({});
    }
  }, [isOpen, initialEmergency, initialVolunteer, initialSkill, emergencies]);

  const handleEmergencyChange = (emgId) => {
    const found = emergencies.find((e) => e.id === emgId);
    setFormData((prev) => ({
      ...prev,
      emergencyId: emgId,
      emergencyTitle: found?.title || '',
      emergencyLocation: found?.location || '',
      emergencySeverity: found?.severity || 'high',
      stagingArea: found?.location ? `${found.location} - Staging Post A` : prev.stagingArea
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.emergencyId) errs.emergencyId = 'Emergency incident is required.';
    if (!formData.volunteerName.trim()) errs.volunteerName = 'Volunteer name is required.';
    if (!formData.skill.trim()) errs.skill = 'Designated skill is required.';
    if (!formData.stagingArea.trim()) errs.stagingArea = 'Staging area / location is required.';
    if (!formData.instructions.trim()) errs.instructions = 'Briefing instructions are required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      emergencyId: formData.emergencyId,
      emergencyTitle: formData.emergencyTitle,
      emergencyLocation: formData.emergencyLocation,
      emergencySeverity: formData.emergencySeverity,
      volunteerId: formData.volunteerId,
      volunteerName: formData.volunteerName,
      volunteerPhone: formData.volunteerPhone,
      skill: formData.skill,
      proficiency: formData.proficiency,
      priority: formData.priority,
      stagingArea: formData.stagingArea,
      instructions: formData.instructions
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dispatch Volunteer Assignment"
      subtitle="Issue an incident assignment and staging instructions to a qualified responder."
      icon={<ClipboardList size={22} color="var(--color-primary)" />}
      maxWidth="620px"
    >
      <form onSubmit={handleSubmit}>
        {/* Incident Summary Card */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-critical)', fontWeight: 700, fontSize: 'var(--font-sm)' }}>
            <ShieldAlert size={16} />
            <span>Incident: {formData.emergencyTitle || 'Emergency Incident Dispatch'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: 'var(--font-xs)' }}>
            <Users2 size={14} color="var(--color-primary)" />
            <span>Assigned Responder: <strong style={{ color: 'var(--text-primary)' }}>{formData.volunteerName}</strong> ({formData.skill})</span>
          </div>
        </div>

        {/* Emergency Selector if not prefilled */}
        {!initialEmergency && emergencies.length > 0 && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <Select
              label="Target Emergency Incident *"
              value={formData.emergencyId}
              onChange={(e) => handleEmergencyChange(e.target.value)}
              options={emergencies.map((emg) => ({
                value: emg.id,
                label: `${emg.title} (${emg.location})`
              }))}
              error={errors.emergencyId}
            />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <Input
            label="Assigned Volunteer Name *"
            value={formData.volunteerName}
            onChange={(e) => setFormData({ ...formData, volunteerName: e.target.value })}
            placeholder="e.g. Marcus Vance"
            error={errors.volunteerName}
            disabled={Boolean(initialVolunteer)}
          />

          <Input
            label="Required Skill *"
            value={formData.skill}
            onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
            placeholder="e.g. Swift Water & Flood Rescue"
            error={errors.skill}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <Select
            label="Deployment Priority *"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            options={ASSIGNMENT_PRIORITIES.map((p) => ({ value: p, label: p }))}
          />

          <Input
            label="Designated Staging Area *"
            value={formData.stagingArea}
            onChange={(e) => setFormData({ ...formData, stagingArea: e.target.value })}
            placeholder="e.g. Levee Pier 3 Staging Area"
            error={errors.stagingArea}
          />
        </div>

        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Textarea
            label="Operational Briefing & Instructions *"
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            placeholder="Specify equipment requirements, reporting point, and field supervisor..."
            rows={3}
            error={errors.instructions}
          />
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading} icon={<ClipboardList size={16} />}>
            Confirm Assignment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignmentCreationModal;
