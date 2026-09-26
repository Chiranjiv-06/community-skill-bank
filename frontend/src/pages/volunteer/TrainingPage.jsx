import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import EmptyState from '../../components/states/EmptyState';
import LoadingState from '../../components/states/LoadingState';
import ErrorState from '../../components/states/ErrorState';
import TrainingCourseCard from '../../components/trust/TrainingCourseCard';
import TrainingDetailModal from '../../components/trust/TrainingDetailModal';
import { trainingService } from '../../services/trainingService';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, CheckCircle2, PlayCircle, Clock, BookOpen } from 'lucide-react';

export const TrainingPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected course for detail modal
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const volunteerId = user?.id || 'dev-skl-002';
      const data = await trainingService.getVolunteerTraining(volunteerId);
      setCourses(data);
    } catch (err) {
      console.error('[TrainingPage] Error loading training courses:', err);
      setError('Failed to load training curriculum.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [user]);

  const handleEnroll = async (course) => {
    const volunteerId = user?.id || 'dev-skl-002';
    await trainingService.enrollInTraining(volunteerId, course.id);
    await loadCourses();
    // Update active modal view
    const updated = await trainingService.getVolunteerTraining(volunteerId);
    const found = updated.find((c) => c.id === course.id);
    if (found) setSelectedCourse(found);
  };

  const handleProgressUpdate = async (courseId, nextPercentage) => {
    const volunteerId = user?.id || 'dev-skl-002';
    await trainingService.updateTrainingProgress(volunteerId, courseId, nextPercentage);
    await loadCourses();
    const updated = await trainingService.getVolunteerTraining(volunteerId);
    const found = updated.find((c) => c.id === courseId);
    if (found) setSelectedCourse(found);
  };

  const handleOpenDetails = (course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  // Filtered courses
  const filteredCourses = courses.filter((course) => {
    if (statusFilter !== 'ALL' && course.status !== statusFilter) {
      return false;
    }
    if (categoryFilter !== 'ALL' && course.category !== categoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = course.title?.toLowerCase().includes(q);
      const matchDesc = course.description?.toLowerCase().includes(q);
      const matchCategory = course.category?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCategory) return false;
    }
    return true;
  });

  const completedCount = courses.filter((c) => c.status === 'completed').length;
  const inProgressCount = courses.filter((c) => c.status === 'in_progress').length;
  const notStartedCount = courses.filter((c) => c.status === 'not_started' || !c.status).length;

  return (
    <div className="training-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Page Header */}
      <PageHeader
        title="Disaster Training & Drills"
        description="Master mass-casualty triage protocols, incident command logistics, tactical radio procedures, and practical search & rescue techniques."
      />

      {/* KPI Overview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--spacing-md)'
        }}
      >
        <div
          onClick={() => setStatusFilter('ALL')}
          style={{
            background: 'var(--color-surface)',
            border: statusFilter === 'ALL' ? '1px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Curriculum Drills</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>
            {courses.length}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('completed')}
          style={{
            background: 'var(--color-surface)',
            border: statusFilter === 'completed' ? '1px solid var(--color-success)' : '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-success)' }}>
            <CheckCircle2 size={15} />
            <span>Mastered & Completed</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>
            {completedCount}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('in_progress')}
          style={{
            background: 'var(--color-surface)',
            border: statusFilter === 'in_progress' ? '1px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-primary)' }}>
            <PlayCircle size={15} />
            <span>In Progress</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px' }}>
            {inProgressCount}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('not_started')}
          style={{
            background: 'var(--color-surface)',
            border: statusFilter === 'not_started' ? '1px solid var(--color-border-focus)' : '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
            <Clock size={15} />
            <span>Available to Start</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {notStartedCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-md)',
          alignItems: 'center',
          flexWrap: 'wrap',
          background: 'var(--color-surface)',
          padding: '14px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-subtle)'
        }}
      >
        <div style={{ flex: 1, minWidth: '220px' }}>
          <Input
            placeholder="Search drills by keyword, title, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ width: '200px' }}>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'not_started', label: 'Not Started' }
            ]}
          />
        </div>
      </div>

      {/* Content Area */}
      {loading && <LoadingState message="Loading training modules & drills..." />}

      {error && (
        <ErrorState
          title="Could Not Load Training"
          message={error}
          onRetry={loadCourses}
        />
      )}

      {!loading && !error && filteredCourses.length === 0 && (
        <EmptyState
          title="No Training Modules Found"
          message="No training drills matched your filter criteria."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('ALL');
                setCategoryFilter('ALL');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          }
        />
      )}

      {!loading && !error && filteredCourses.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 'var(--spacing-md)'
          }}
        >
          {filteredCourses.map((course) => (
            <TrainingCourseCard
              key={course.id}
              course={course}
              onStartCourse={(c) => {
                handleEnroll(c);
                handleOpenDetails(c);
              }}
              onContinueCourse={(c) => handleOpenDetails(c)}
              onViewDetails={(c) => handleOpenDetails(c)}
            />
          ))}
        </div>
      )}

      {/* Drill Detail Modal */}
      <TrainingDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        course={selectedCourse}
        onProgressUpdate={handleProgressUpdate}
        onEnroll={handleEnroll}
      />
    </div>
  );
};

export default TrainingPage;
