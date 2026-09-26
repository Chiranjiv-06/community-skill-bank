import React, { useState, useEffect } from 'react';
import { Layers, Edit3, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { SKILL_CATEGORIES, PROFICIENCY_LEVELS } from '../../data/skillCategories';
import { REQUIREMENT_URGENCIES, URGENCY_LABELS } from '../../data/devEmergencies';

/**
 * Reusable Modal for Adding and Editing an Emergency Skill Requirement
 */
export const RequirementFormModal = ({
  isOpen,
  onClose,
  onSave,
  requirement = null,
  isLoading = false
}) => {
  const isEdit = Boolean(requirement);

  const [formData, setFormData] = useState({
    skill: '',
    category: SKILL_CATEGORIES[0],
    minProficiency: 'Intermediate',
    minVolunteers: '4',
    urgency: 'high'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (requirement) {
      setFormData({
        skill: requirement.skill || '',
        category: requirement.category || SKILL_CATEGORIES[0],
        minProficiency: requirement.minProficiency || 'Intermediate',
        minVolunteers: String(requirement.minVolunteers || '4'),
        urgency: requirement.urgency || 'high'
      });
    } else {
      setFormData({
        skill: '',
        category: SKILL_CATEGORIES[0],
        minProficiency: 'Intermediate',
        minVolunteers: '4',
        urgency: 'high'
      });
    }
    setErrors({});
  }, [requirement, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};

    if (!formData.skill || formData.skill.trim() === '') {
      errs.skill = 'Required skill is required.';
    }
    if (!formData.category || !SKILL_CATEGORIES.includes(formData.category)) {
      errs.category = 'Please select a valid disaster skill category.';
    }
    if (!PROFICIENCY_LEVELS.includes(formData.minProficiency)) {
      errs.minProficiency = `Minimum proficiency must be one of: ${PROFICIENCY_LEVELS.join(', ')}`;
    }
    if (
      formData.minVolunteers === '' ||
      isNaN(formData.minVolunteers) ||
      Number(formData.minVolunteers) <= 0
    ) {
      errs.minVolunteers = 'Minimum volunteers must be a positive integer.';
    }
    if (!REQUIREMENT_URGENCIES.includes(formData.urgency)) {
      errs.urgency = `Urgency must be one of: ${REQUIREMENT_URGENCIES.join(', ')}`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      ...formData,
      skill: formData.skill.trim(),
      minVolunteers: Number(formData.minVolunteers)
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
            <Layers size={20} color="var(--color-primary)" />
          )}
          <span>{isEdit ? 'Edit Skill Requirement' : 'Add Emergency Skill Requirement'}</span>
        </div>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isLoading}>
            {isEdit ? 'Save Changes' : 'Add Requirement'}
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

        {/* Required Skill */}
        <Input
          label="Required Skill"
          id="req-skill-input"
          value={formData.skill}
          onChange={(e) => handleChange('skill', e.target.value)}
          placeholder="e.g. Swift Water & Flood Rescue, Heavy Machinery, Trauma Care"
          required
          error={errors.skill}
          helperText="Specify the disaster response capability needed."
        />

        {/* Category */}
        <Select
          label="Category"
          id="req-category-select"
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          required
          error={errors.category}
          options={SKILL_CATEGORIES.map((c) => ({ value: c, label: c }))}
          helperText="Disaster domain taxonomy."
        />

        {/* Minimum Proficiency */}
        <Select
          label="Minimum Proficiency"
          id="req-proficiency-select"
          value={formData.minProficiency}
          onChange={(e) => handleChange('minProficiency', e.target.value)}
          required
          error={errors.minProficiency}
          options={PROFICIENCY_LEVELS.map((p) => ({ value: p, label: p }))}
          helperText="Strict Stage 4 proficiencies: Beginner, Intermediate, Advanced, Expert."
        />

        {/* Min Volunteers & Urgency */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <Input
            label="Minimum Volunteers"
            id="req-volunteers-input"
            type="number"
            min="1"
            value={formData.minVolunteers}
            onChange={(e) => handleChange('minVolunteers', e.target.value)}
            required
            error={errors.minVolunteers}
            helperText="Quota for this skill"
          />

          <Select
            label="Urgency"
            id="req-urgency-select"
            value={formData.urgency}
            onChange={(e) => handleChange('urgency', e.target.value)}
            required
            error={errors.urgency}
            options={REQUIREMENT_URGENCIES.map((u) => ({
              value: u,
              label: URGENCY_LABELS[u] || u
            }))}
            helperText="Dispatch surge urgency"
          />
        </div>
      </form>
    </Modal>
  );
};

export default RequirementFormModal;
