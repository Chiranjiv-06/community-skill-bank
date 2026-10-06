import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  Plus,
  Edit3,
  Trash2,
  Clock,
  Tag,
  AlertCircle,
  CheckCircle,
  Search,
  Award,
  Info,
  Filter,
  Layers
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import LoadingState from '../../components/states/LoadingState';
import EmptyState from '../../components/states/EmptyState';
import { useAuth } from '../../context/AuthContext';
import skillService from '../../services/skillService';
import { SKILL_CATEGORIES, PROFICIENCY_LEVELS } from '../../data/skillCategories';

/**
 * Mapping of strict proficiency levels to badge variants
 */
const PROFICIENCY_BADGES = {
  Beginner: 'neutral',
  Intermediate: 'info',
  Advanced: 'warning',
  Expert: 'success'
};

export const SkillsPage = () => {
  const { currentUser } = useAuth();
  const [skills, setSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: SKILL_CATEGORIES[0],
    experience: '',
    proficiency: 'Intermediate'
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deletion Confirmation State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // User Notification Banner
  const [notification, setNotification] = useState(null);

  // Load skills on mount and user change
  useEffect(() => {
    const fetchSkills = async () => {
      setIsLoading(true);
      try {
        const data = await skillService.getUserSkills(currentUser?.id);
        setSkills(data);
      } catch (err) {
        console.error('[SkillsPage] Failed to load skills:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSkills();
  }, [currentUser?.id]);

  // Filter skills based on search term and category
  const filteredSkills = useMemo(() => {
    return skills.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.experience.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === 'ALL' || item.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [skills, searchQuery, categoryFilter]);

  // Open Modal in Add Mode
  const handleOpenAddModal = () => {
    setModalMode('add');
    setSelectedSkill(null);
    setFormData({
      name: '',
      category: SKILL_CATEGORIES[0],
      experience: '',
      proficiency: 'Intermediate'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Modal in Edit Mode
  const handleOpenEditModal = (skill) => {
    setModalMode('edit');
    setSelectedSkill(skill);
    setFormData({
      name: skill.name,
      category: skill.category,
      experience: skill.experience,
      proficiency: skill.proficiency
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSkill(null);
    setFormErrors({});
  };

  // Form field change handler
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Validation
  const validateForm = () => {
    const errors = {};

    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Skill name is required.';
    }

    if (!formData.category || !SKILL_CATEGORIES.includes(formData.category)) {
      errors.category = 'Please select a valid emergency skill category.';
    }

    if (!formData.experience || formData.experience.trim() === '') {
      errors.experience = 'Experience description is required.';
    }

    if (!formData.proficiency || !PROFICIENCY_LEVELS.includes(formData.proficiency)) {
      errors.proficiency = `Proficiency must be one of: ${PROFICIENCY_LEVELS.join(', ')}`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler (Add / Edit)
  const handleSubmitSkill = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (modalMode === 'add') {
        const newSkill = await skillService.addSkill(currentUser?.id, formData);
        setSkills((prev) => [newSkill, ...prev]);
        setNotification({
          type: 'success',
          message: `Skill "${newSkill.name}" has been added to your local emergency profile.`
        });
      } else {
        const updated = await skillService.updateSkill(
          currentUser?.id,
          selectedSkill.id,
          formData
        );
        setSkills((prev) =>
          prev.map((s) => (s.id === selectedSkill.id ? updated : s))
        );
        setNotification({
          type: 'success',
          message: `Skill "${updated.name}" has been updated successfully.`
        });
      }
      setIsModalOpen(false);
      setTimeout(() => setNotification(null), 4500);
    } catch (err) {
      console.error('[SkillsPage] Error saving skill:', err);
      setFormErrors({ submit: err.message || 'Failed to save skill.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handlers
  const handleOpenDeleteDialog = (skill) => {
    setSkillToDelete(skill);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSkillToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!skillToDelete) return;

    setIsDeleting(true);
    try {
      await skillService.deleteSkill(currentUser?.id, skillToDelete.id);
      setSkills((prev) => prev.filter((s) => s.id !== skillToDelete.id));
      setNotification({
        type: 'success',
        message: `Skill "${skillToDelete.name}" has been removed from your local profile.`
      });
      setIsDeleteDialogOpen(false);
      setSkillToDelete(null);
      setTimeout(() => setNotification(null), 4500);
    } catch (err) {
      console.error('[SkillsPage] Error deleting skill:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading your emergency skills & competencies..." minHeight="380px" />;
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <PageHeader
        title="My Skills"
        subtitle="Register, categorize, and declare disaster proficiencies from trauma care to technical rescue."
        icon={<Zap size={24} />}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenAddModal}
            icon={<Plus size={16} />}
          >
            Add Skill
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
          <strong style={{ color: 'var(--text-primary)' }}>Responder Skill Profile:</strong> Keep your operational capabilities, certifications, and experience updated to ensure rapid matching when disaster quotas are declared.
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

      {/* Filter and Search Bar (only show if skills exist or active filter) */}
      {(skills.length > 0 || searchQuery || categoryFilter !== 'ALL') && (
        <Card style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 'var(--space-4)',
              alignItems: 'center'
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Input
                placeholder="Search skills, experience, or categories..."
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

            {/* Category Filter */}
            <div>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ marginBottom: 0 }}
                options={[
                  { value: 'ALL', label: 'All Disaster Categories' },
                  ...SKILL_CATEGORIES.map((cat) => ({ value: cat, label: cat }))
                ]}
              />
            </div>

            {/* Count & Status Display */}
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
                Showing <strong>{filteredSkills.length}</strong> of <strong>{skills.length}</strong> declared skills
              </span>
              {(searchQuery || categoryFilter !== 'ALL') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('ALL');
                  }}
                  style={{ fontSize: 'var(--font-xs)' }}
                >
                  Reset Filters
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Skill List Content */}
      {skills.length === 0 ? (
        <EmptyState
          icon={<Zap size={32} color="var(--color-primary)" />}
          title="No skills added yet."
          description="You have not declared any disaster or emergency response skills. Add your field proficiencies to be prepared for emergency response matching."
          action={
            <Button
              variant="primary"
              size="md"
              onClick={handleOpenAddModal}
              icon={<Plus size={16} />}
            >
              Add Skill
            </Button>
          }
        />
      ) : filteredSkills.length === 0 ? (
        <EmptyState
          icon={<Search size={32} color="var(--text-muted)" />}
          title="No matching skills found"
          description={`No declared skills match your current search query "${searchQuery}" or selected category filter.`}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('ALL');
              }}
            >
              Clear Search & Filters
            </Button>
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-4)'
          }}
        >
          {filteredSkills.map((skill) => (
            <Card
              key={skill.id}
              hoverable
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 'var(--space-5)',
                borderTop: `3px solid ${
                  skill.proficiency === 'Expert'
                    ? 'var(--color-success)'
                    : skill.proficiency === 'Advanced'
                    ? 'var(--color-primary)'
                    : skill.proficiency === 'Intermediate'
                    ? 'var(--color-info)'
                    : 'var(--border-default)'
                }`
              }}
            >
              <div>
                {/* Header: Skill Name & Proficiency Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 'var(--space-3)',
                    marginBottom: 'var(--space-3)'
                  }}
                >
                  <h4
                    style={{
                      fontSize: 'var(--font-base)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      lineHeight: 1.3
                    }}
                  >
                    {skill.name}
                  </h4>
                  <Badge variant={PROFICIENCY_BADGES[skill.proficiency] || 'neutral'}>
                    {skill.proficiency}
                  </Badge>
                </div>

                {/* Category Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: 'var(--space-3)',
                    fontSize: 'var(--font-xs)',
                    color: 'var(--color-primary)'
                  }}
                >
                  <Tag size={13} />
                  <span style={{ fontWeight: 600 }}>{skill.category}</span>
                </div>

                {/* Experience Detail */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: 'var(--space-3)',
                    background: 'var(--bg-surface-elevated)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: 'var(--space-4)',
                    fontSize: 'var(--font-sm)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <Clock size={16} color="var(--text-muted)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <span style={{ display: 'block', fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Experience
                    </span>
                    <span>{skill.experience}</span>
                  </div>
                </div>
              </div>

              {/* Actions: Edit and Delete */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 'var(--space-2)',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 'var(--space-3)',
                  marginTop: 'var(--space-2)'
                }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEditModal(skill)}
                  icon={<Edit3 size={14} />}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenDeleteDialog(skill)}
                  icon={<Trash2 size={14} color="var(--color-critical)" />}
                  style={{ color: 'var(--color-critical)' }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Skill Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          modalMode === 'add' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={20} color="var(--color-primary)" />
              <span>Add Disaster & Emergency Skill</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={20} color="var(--color-primary)" />
              <span>Edit Emergency Skill</span>
            </div>
          )
        }
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmitSkill}
              isLoading={isSubmitting}
            >
              {modalMode === 'add' ? 'Add Skill' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmitSkill}>
          {formErrors.submit && (
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
              <span>{formErrors.submit}</span>
            </div>
          )}

          {/* Skill Name */}
          <Input
            label="Skill"
            id="skill-name-input"
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder="e.g. Swift Water & Flood Rescue, Trauma Triage"
            required
            error={formErrors.name}
            helperText="Specify the technical or operational emergency response skill."
          />

          {/* Category */}
          <Select
            label="Category"
            id="skill-category-select"
            value={formData.category}
            onChange={(e) => handleFieldChange('category', e.target.value)}
            required
            error={formErrors.category}
            options={SKILL_CATEGORIES.map((cat) => ({
              value: cat,
              label: cat
            }))}
            helperText="Select official disaster response capability category."
          />

          {/* Experience */}
          <Input
            label="Experience"
            id="skill-experience-input"
            value={formData.experience}
            onChange={(e) => handleFieldChange('experience', e.target.value)}
            placeholder="e.g. 4 years frontline field triage, licensed ham operator"
            required
            error={formErrors.experience}
            helperText="Describe field tenure, operational deployment, or relevant background."
          />

          {/* Proficiency */}
          <Select
            label="Proficiency"
            id="skill-proficiency-select"
            value={formData.proficiency}
            onChange={(e) => handleFieldChange('proficiency', e.target.value)}
            required
            error={formErrors.proficiency}
            options={PROFICIENCY_LEVELS.map((level) => ({
              value: level,
              label: level
            }))}
            helperText="Strict master levels: Beginner, Intermediate, Advanced, Expert."
          />
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Emergency Skill"
        message={
          skillToDelete
            ? `Are you sure you want to remove "${skillToDelete.name}" from your disaster response skills profile? This action will remove the skill from your local frontend profile.`
            : 'Are you sure you want to remove this skill?'
        }
        confirmText="Delete Skill"
        cancelText="Cancel"
        isDanger
        isLoading={isDeleting}
      />
    </div>
  );
};

export default SkillsPage;
