import React from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import TrainingStatusBadge from './TrainingStatusBadge';
import {
  GraduationCap,
  Clock,
  Layers,
  Award,
  CheckCircle2,
  Play,
  ArrowRight,
  BookOpen
} from 'lucide-react';

/**
 * Reusable Training Course Card component
 */
export const TrainingCourseCard = ({
  course,
  onStartCourse = null,
  onContinueCourse = null,
  onViewDetails = null
}) => {
  if (!course) return null;

  const isCompleted = course.status === 'completed';
  const isInProgress = course.status === 'in_progress';
  const isNotStarted = course.status === 'not_started' || !course.status;

  const progress = course.progressPercentage || 0;

  return (
    <Card
      className="training-course-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
        borderLeft: isCompleted
          ? '4px solid var(--color-success)'
          : isInProgress
          ? '4px solid var(--color-primary)'
          : '4px solid var(--color-border-subtle)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Badge variant="primary" style={{ fontSize: '11px' }}>
            {course.category}
          </Badge>
          <Badge variant="neutral" style={{ fontSize: '11px' }}>
            {course.level}
          </Badge>
        </div>
        <TrainingStatusBadge status={course.status} />
      </div>

      {/* Title & Description */}
      <div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', color: 'var(--color-text-primary)' }}>
          {course.title}
        </h3>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          {course.description}
        </p>
      </div>

      {/* Meta Specs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '8px',
          fontSize: '0.84rem',
          color: 'var(--color-text-muted)',
          background: 'var(--color-surface-hover)',
          padding: '10px 12px',
          borderRadius: 'var(--radius-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={14} color="var(--color-primary)" />
          <span>{course.durationHours} Hours</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={14} color="var(--color-primary)" />
          <span>{course.modulesCount || 4} Drill Modules</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Award size={14} color="var(--color-primary)" />
          <span>Prereq: {course.prerequisite || 'None'}</span>
        </div>
      </div>

      {/* Certification Relationship */}
      {course.certificationRelationship && (
        <div
          style={{
            fontSize: '0.82rem',
            color: 'var(--color-primary)',
            background: 'rgba(255, 107, 0, 0.08)',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Award size={13} />
          <span>{course.certificationRelationship}</span>
        </div>
      )}

      {/* Progress Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
          <span>Curriculum Progress</span>
          <span style={{ fontWeight: 600, color: isCompleted ? 'var(--color-success)' : 'var(--color-primary)' }}>
            {progress}% {isCompleted && course.score ? `(Score: ${course.score})` : ''}
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '8px',
            background: 'var(--color-surface-hover)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: isCompleted
                ? 'var(--color-success)'
                : 'linear-gradient(90deg, var(--color-primary), #ff9800)',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          marginTop: 'auto',
          paddingTop: 'var(--spacing-sm)',
          borderTop: '1px solid var(--color-border-subtle)',
          flexWrap: 'wrap'
        }}
      >
        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewDetails && onViewDetails(course)}
        >
          <BookOpen size={14} style={{ marginRight: '5px' }} />
          Syllabus & Drills
        </Button>

        {isNotStarted && onStartCourse && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => onStartCourse(course)}
          >
            <Play size={14} style={{ marginRight: '5px' }} />
            Enroll & Begin
          </Button>
        )}

        {isInProgress && onContinueCourse && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => onContinueCourse(course)}
          >
            <ArrowRight size={14} style={{ marginRight: '5px' }} />
            Continue ({progress}%)
          </Button>
        )}

        {isCompleted && (
          <Badge variant="success" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
            <CheckCircle2 size={14} style={{ marginRight: '4px' }} />
            Completed & Accredited
          </Badge>
        )}
      </div>
    </Card>
  );
};

export default TrainingCourseCard;
