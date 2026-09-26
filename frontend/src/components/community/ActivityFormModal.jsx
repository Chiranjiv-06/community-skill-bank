import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import Button from '../common/Button';
import { ACTIVITY_CATEGORIES } from '../../data/devActivities';
import { Calendar, Plus, Save } from 'lucide-react';

/**
 * Admin Modal to create or edit a community activity
 */
export const ActivityFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  activity = null
}) => {
  const isEditing = Boolean(activity);

  const [formData, setFormData] = useState({
    title: '',
    category: ACTIVITY_CATEGORIES[0],
    description: '',
    location: '',
    address: '',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime: '09:00 AM',
    endTime: '01:00 PM',
    duration: '4 Hours',
    capacity: 35,
    organizer: 'Community Skill Bank Coordination',
    organizerContact: 'community@skillbank.org | (555) 019-2831',
    requiredSkills: 'General Assistance, Physical Labor',
    recommendedGear: 'Work gloves, closed-toe footwear, weather-appropriate outdoor attire.'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activity) {
      setFormData({
        title: activity.title || '',
        category: activity.category || ACTIVITY_CATEGORIES[0],
        description: activity.description || '',
        location: activity.location || '',
        address: activity.address || activity.location || '',
        date: activity.date || '',
        startTime: activity.startTime || '09:00 AM',
        endTime: activity.endTime || '01:00 PM',
        duration: activity.duration || '4 Hours',
        capacity: activity.capacity || 30,
        organizer: activity.organizer || '',
        organizerContact: activity.organizerContact || '',
        requiredSkills: Array.isArray(activity.requiredSkills)
          ? activity.requiredSkills.join(', ')
          : activity.requiredSkills || '',
        recommendedGear: activity.recommendedGear || ''
      });
    } else {
      setFormData({
        title: '',
        category: ACTIVITY_CATEGORIES[0],
        description: '',
        location: '',
        address: '',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: '09:00 AM',
        endTime: '01:00 PM',
        duration: '4 Hours',
        capacity: 35,
        organizer: 'Community Skill Bank Coordination',
        organizerContact: 'community@skillbank.org | (555) 019-2831',
        requiredSkills: 'General Assistance, Physical Labor',
        recommendedGear: 'Work gloves, closed-toe footwear, weather-appropriate outdoor attire.'
      });
    }
  }, [activity, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Activity title is required.';
    if (!formData.location.trim()) newErrors.location = 'Location venue is required.';
    if (!formData.date) newErrors.date = 'Date is required.';
    if (!formData.capacity || Number(formData.capacity) <= 0) newErrors.capacity = 'Capacity must be greater than 0.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const skillsArray = formData.requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await onSubmit({
        ...formData,
        capacity: Number(formData.capacity),
        requiredSkills: skillsArray
      });
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setErrors({ form: err.message || 'Failed to save community activity.' });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Community Activity' : 'Schedule Community Disaster Activity'}
      size="md"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {errors.form && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.12)',
              color: 'var(--color-critical)',
              fontSize: '0.85rem'
            }}
          >
            {errors.form}
          </div>
        )}

        <Input
          label="Activity Title *"
          placeholder="e.g. Community Sandbagging & Flood Defense Assembly"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          error={errors.title}
          required
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            options={ACTIVITY_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />

          <Input
            type="number"
            label="Volunteer Capacity *"
            value={formData.capacity}
            onChange={(e) => handleChange('capacity', e.target.value)}
            error={errors.capacity}
            min={1}
            max={500}
            required
          />
        </div>

        <Textarea
          label="Activity Description"
          placeholder="Describe the operational goals, drills, or community objectives of this activity..."
          rows={3}
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <Input
            label="Venue / Location Name *"
            placeholder="e.g. District 2 Riverwalk Depot"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            error={errors.location}
            required
          />

          <Input
            label="Address / Sector"
            placeholder="e.g. 1420 Riverwalk Blvd, Sector 2"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--spacing-md)' }}>
          <Input
            type="date"
            label="Date *"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            error={errors.date}
            required
          />

          <Input
            label="Start Time"
            placeholder="09:00 AM"
            value={formData.startTime}
            onChange={(e) => handleChange('startTime', e.target.value)}
          />

          <Input
            label="End Time"
            placeholder="01:00 PM"
            value={formData.endTime}
            onChange={(e) => handleChange('endTime', e.target.value)}
          />

          <Input
            label="Duration"
            placeholder="4 Hours"
            value={formData.duration}
            onChange={(e) => handleChange('duration', e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <Input
            label="Organizer Name"
            placeholder="e.g. Flood Resilience Corps"
            value={formData.organizer}
            onChange={(e) => handleChange('organizer', e.target.value)}
          />

          <Input
            label="Organizer Contact (Email/Phone)"
            placeholder="e.g. organizer@skillbank.org"
            value={formData.organizerContact}
            onChange={(e) => handleChange('organizerContact', e.target.value)}
          />
        </div>

        <Input
          label="Required Skills (comma-separated)"
          placeholder="e.g. Sandbagging, Physical Labor, First Aid"
          value={formData.requiredSkills}
          onChange={(e) => handleChange('requiredSkills', e.target.value)}
        />

        <Input
          label="Recommended Safety Gear & PPE"
          placeholder="e.g. Leather work gloves, safety boots, high-visibility vest"
          value={formData.recommendedGear}
          onChange={(e) => handleChange('recommendedGear', e.target.value)}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: 'var(--spacing-sm)' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            <Save size={16} style={{ marginRight: '6px' }} />
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Activity' : 'Publish Activity'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ActivityFormModal;
