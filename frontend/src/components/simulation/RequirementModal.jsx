import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { SKILL_CATEGORIES, PROFICIENCY_LEVELS } from '../../data/skillCategories';
import { Award, Plus, Check } from 'lucide-react';

const URGENCY_LEVELS = ['Critical', 'High', 'Medium', 'Low'];

/**
 * Modal to Add or Edit a Simulation Requirement
 */
export const RequirementModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState({
    skill: '',
    category: SKILL_CATEGORIES[0] || 'Search & Rescue (SAR)',
    minProficiency: 'Intermediate',
    minVolunteers: 5,
    urgency: 'High'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        skill: initialData.skill || '',
        category: initialData.category || SKILL_CATEGORIES[0],
        minProficiency: initialData.minProficiency || 'Intermediate',
        minVolunteers: initialData.minVolunteers !== undefined ? initialData.minVolunteers : 5,
        urgency: initialData.urgency || 'High'
      });
    } else {
      setFormData({
        skill: '',
        category: SKILL_CATEGORIES[0] || 'Search & Rescue (SAR)',
        minProficiency: 'Intermediate',
        minVolunteers: 5,
        urgency: 'High'
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors = {};

    if (!formData.skill.trim()) {
      newErrors.skill = 'Skill capability name is required.';
    }

    const volNum = Number(formData.minVolunteers);
    if (isNaN(volNum) || volNum <= 0) {
      newErrors.minVolunteers = 'Minimum volunteers must be at least 1.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      ...formData,
      skill: formData.skill.trim(),
      minVolunteers: Number(formData.minVolunteers)
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Simulation Requirement' : 'Add Simulation Requirement'}
      size="md"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Skill Name */}
          <Input
            label="Required Skill Capability *"
            placeholder="e.g., Swift Water & Flood Rescue"
            value={formData.skill}
            onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
            error={errors.skill}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
            {/* Category */}
            <Select
              label="Capability Category *"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={SKILL_CATEGORIES.map((cat) => ({
                value: cat,
                label: cat
              }))}
            />

            {/* Minimum Proficiency */}
            <Select
              label="Minimum Proficiency *"
              value={formData.minProficiency}
              onChange={(e) => setFormData({ ...formData, minProficiency: e.target.value })}
              options={PROFICIENCY_LEVELS.map((lvl) => ({
                value: lvl,
                label: lvl
              }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
            {/* Minimum Volunteers */}
            <Input
              label="Required Responders (Base Count) *"
              type="number"
              min="1"
              max="500"
              value={formData.minVolunteers}
              onChange={(e) => setFormData({ ...formData, minVolunteers: e.target.value })}
              error={errors.minVolunteers}
              required
            />

            {/* Urgency */}
            <Select
              label="Priority / Urgency *"
              value={formData.urgency}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
              options={URGENCY_LEVELS.map((urg) => ({
                value: urg,
                label: urg
              }))}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting} icon={initialData ? <Check size={16} /> : <Plus size={16} />}>
            {initialData ? 'Update Requirement' : 'Add Requirement'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RequirementModal;
