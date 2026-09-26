import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import TrainingStatusBadge from './TrainingStatusBadge';
import {
  GraduationCap,
  Clock,
  Layers,
  Award,
  CheckCircle2,
  Play,
  Check
} from 'lucide-react';

/**
 * Detailed modal for inspecting training curriculum, syllabus modules,
 * and progressing through drills
 */
export const TrainingDetailModal = ({
  isOpen,
  onClose,
  course,
  onProgressUpdate,
  onEnroll
}) => {
  if (!isOpen || !course) return null;

  const isCompleted = course.status === 'completed';
  const isInProgress = course.status === 'in_progress';
  const isNotStarted = course.status === 'not_started' || !course.status;
  const progress = course.progressPercentage || 0;

  // Generate simulated syllabus modules
  const modulesCount = course.modulesCount || 4;
  const syllabus = Array.from({ length: modulesCount }, (_, i) => {
    const moduleNumber = i + 1;
    const moduleThreshold = (moduleNumber / modulesCount) * 100;
    const isModuleDone = progress >= moduleThreshold;
    return {
      num: moduleNumber,
      title: `Drill Module ${moduleNumber}: Practical Scenario & Procedures`,
      isDone: isModuleDone
    };
  });

  const handleAdvanceModule = () => {
    const nextPercent = Math.min(100, progress + Math.ceil(100 / modulesCount));
    onProgressUpdate(course.id, nextPercent);
  };

  const handleCompleteAll = () => {
    onProgressUpdate(course.id, 100);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={course.title}
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {/* Header Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Badge variant="primary">{course.category}</Badge>
            <Badge variant="neutral">{course.level}</Badge>
          </div>
          <TrainingStatusBadge status={course.status} />
        </div>

        {/* Course Description */}
        <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          {course.description}
        </p>

        {/* Specs Table */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '8px',
            background: 'var(--color-surface-hover)',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem'
          }}
        >
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Estimated Time:</span>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{course.durationHours} Hours</div>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Total Modules:</span>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{modulesCount} Drills</div>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Prerequisite:</span>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{course.prerequisite || 'None'}</div>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Current Progress:</span>
            <div style={{ fontWeight: 600, color: isCompleted ? 'var(--color-success)' : 'var(--color-primary)' }}>
              {progress}%
            </div>
          </div>
        </div>

        {/* Certification Relationship */}
        {course.certificationRelationship && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 107, 0, 0.08)',
              border: '1px solid rgba(255, 107, 0, 0.2)',
              fontSize: '0.85rem',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Award size={16} />
            <span><strong>Credential Alignment:</strong> {course.certificationRelationship}</span>
          </div>
        )}

        {/* Syllabus Checklist */}
        <div>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
            Curriculum Drill Modules
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {syllabus.map((m) => (
              <div
                key={m.num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: m.isDone ? 'rgba(16, 185, 129, 0.08)' : 'var(--color-surface)',
                  border: m.isDone ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--color-border-subtle)',
                  fontSize: '0.86rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {m.isDone ? (
                    <CheckCircle2 size={16} color="var(--color-success)" />
                  ) : (
                    <span
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: '2px solid var(--color-text-muted)',
                        display: 'inline-block'
                      }}
                    />
                  )}
                  <span style={{ color: m.isDone ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontWeight: m.isDone ? 600 : 400 }}>
                    {m.title}
                  </span>
                </div>
                <Badge variant={m.isDone ? 'success' : 'neutral'} style={{ fontSize: '10px' }}>
                  {m.isDone ? 'Mastered' : 'Pending'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: 'var(--spacing-sm)' }}>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          {isNotStarted && (
            <Button
              variant="primary"
              onClick={() => {
                onEnroll(course);
              }}
            >
              <Play size={16} style={{ marginRight: '6px' }} />
              Enroll in Training Track
            </Button>
          )}

          {isInProgress && (
            <>
              <Button
                variant="outline"
                onClick={handleAdvanceModule}
              >
                <Check size={16} style={{ marginRight: '6px' }} />
                Complete Next Drill
              </Button>
              <Button
                variant="success"
                onClick={handleCompleteAll}
              >
                <CheckCircle2 size={16} style={{ marginRight: '6px' }} />
                Pass Final Evaluation (100%)
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default TrainingDetailModal;
