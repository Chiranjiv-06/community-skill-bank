import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import { SIMULATION_DISASTER_TYPES } from '../../data/devSimulations';
import { Cpu, AlertCircle } from 'lucide-react';

/**
 * Modal to Create or Edit a Disaster Simulation Scenario
 */
export const ScenarioFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    disasterType: 'Flood',
    affectedArea: '',
    radius: 15,
    duration: 48,
    demandMultiplier: 1.5,
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        disasterType: initialData.disasterType || 'Flood',
        affectedArea: initialData.affectedArea || '',
        radius: initialData.radius !== undefined ? initialData.radius : 15,
        duration: initialData.duration !== undefined ? initialData.duration : 48,
        demandMultiplier: initialData.demandMultiplier !== undefined ? initialData.demandMultiplier : 1.5,
        notes: initialData.notes || ''
      });
    } else {
      setFormData({
        name: '',
        disasterType: 'Flood',
        affectedArea: '',
        radius: 15,
        duration: 48,
        demandMultiplier: 1.5,
        notes: ''
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Scenario name is required.';
    }

    if (!formData.disasterType || !SIMULATION_DISASTER_TYPES.includes(formData.disasterType)) {
      newErrors.disasterType = 'Please select a valid disaster type.';
    }

    if (!formData.affectedArea.trim()) {
      newErrors.affectedArea = 'Affected area is required.';
    }

    const radiusNum = Number(formData.radius);
    if (isNaN(radiusNum) || radiusNum <= 0) {
      newErrors.radius = 'Radius must be a positive number greater than 0.';
    }

    const durationNum = Number(formData.duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      newErrors.duration = 'Duration must be a positive number of hours.';
    }

    const multNum = Number(formData.demandMultiplier);
    if (isNaN(multNum) || multNum <= 0) {
      newErrors.demandMultiplier = 'Demand multiplier must be greater than 0.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      ...formData,
      radius: Number(formData.radius),
      duration: Number(formData.duration),
      demandMultiplier: Number(formData.demandMultiplier)
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Disaster Scenario' : 'Create Disaster Scenario'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="sim-form" noValidate>
        {/* Warning Badge */}
        <div className="sim-banner warning" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="sim-banner-content">
            <span className="sim-banner-badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#FCD34D' }}>
              Simulation Mode
            </span>
            <span style={{ fontSize: 'var(--font-xs)' }}>
              Hypothetical scenario parameters. Does NOT create a real emergency declaration.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Scenario Name */}
          <Input
            label="Scenario Title *"
            placeholder="e.g., Coastal Basin Category 4 Cyclone Surge"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
            {/* Disaster Type */}
            <Select
              label="Disaster Type *"
              value={formData.disasterType}
              onChange={(e) => setFormData({ ...formData, disasterType: e.target.value })}
              error={errors.disasterType}
              options={SIMULATION_DISASTER_TYPES.map((type) => ({
                value: type,
                label: type
              }))}
            />

            {/* Affected Area */}
            <Input
              label="Affected Area / Sector *"
              placeholder="e.g., Ward 7 — Riverside Basin & Lowlands"
              value={formData.affectedArea}
              onChange={(e) => setFormData({ ...formData, affectedArea: e.target.value })}
              error={errors.affectedArea}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
            {/* Radius */}
            <Input
              label="Radius (km) *"
              type="number"
              min="1"
              max="500"
              step="1"
              value={formData.radius}
              onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
              error={errors.radius}
              required
            />

            {/* Duration */}
            <Input
              label="Duration (Hours) *"
              type="number"
              min="1"
              max="720"
              step="1"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              error={errors.duration}
              required
            />

            {/* Demand Multiplier */}
            <Input
              label="Demand Multiplier *"
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={formData.demandMultiplier}
              onChange={(e) => setFormData({ ...formData, demandMultiplier: e.target.value })}
              error={errors.demandMultiplier}
              required
            />
          </div>

          {/* Operational Notes */}
          <Textarea
            label="Scenario Narrative & Context (Optional)"
            placeholder="Describe hypothetical severity conditions, infrastructure failures, or weather factors..."
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting} icon={<Cpu size={16} />}>
            {initialData ? 'Save Changes' : 'Create Scenario'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ScenarioFormModal;
