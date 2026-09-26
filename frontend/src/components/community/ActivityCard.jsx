import React from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import ActivityStatusBadge from './ActivityStatusBadge';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  UserCheck,
  Edit,
  Trash2
} from 'lucide-react';

/**
 * Reusable Community Activity Card Component
 */
export const ActivityCard = ({
  activity,
  isRegistered = false,
  isAdmin = false,
  onViewDetails,
  onJoin,
  onLeave,
  onEdit,
  onStatusChange,
  onDelete
}) => {
  if (!activity) return null;

  const currentCount = activity.currentParticipantsCount || 0;
  const capacity = activity.capacity || 30;
  const percentFilled = Math.min(100, Math.round((currentCount / capacity) * 100));
  const spotsLeft = Math.max(0, capacity - currentCount);

  const isCompleted = activity.status === 'completed';
  const isCancelled = activity.status === 'cancelled';
  const isFull = spotsLeft === 0 && !isRegistered;

  return (
    <Card
      className="community-activity-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
        borderLeft: isRegistered
          ? '4px solid var(--color-success)'
          : isCompleted
          ? '4px solid var(--color-border-subtle)'
          : '4px solid var(--color-primary)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Badge variant="primary" style={{ fontSize: '11px' }}>
              {activity.category}
            </Badge>
            {isRegistered && (
              <Badge variant="success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                <CheckCircle2 size={12} />
                <span>You're Attending</span>
              </Badge>
            )}
          </div>
          <h3 style={{ margin: 0, fontSize: '1.18rem', color: 'var(--color-text-primary)' }}>
            {activity.title}
          </h3>
        </div>

        <ActivityStatusBadge status={activity.status} />
      </div>

      {/* Meta Specs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '8px',
          fontSize: '0.86rem',
          color: 'var(--color-text-secondary)',
          background: 'var(--color-surface-hover)',
          padding: '10px 12px',
          borderRadius: 'var(--radius-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={14} color="var(--color-primary)" />
          <span>{activity.date}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={14} color="var(--color-primary)" />
          <span>{activity.startTime} - {activity.endTime}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', gridColumn: 'span 2' }}>
          <MapPin size={14} color="var(--color-primary)" />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activity.location}
          </span>
        </div>
      </div>

      {/* Description Snippet */}
      <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
        {activity.description}
      </p>

      {/* Capacity & Participation Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
          <span>Volunteer Participation</span>
          <span style={{ fontWeight: 600, color: isFull ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>
            {currentCount} / {capacity} Enrolled {spotsLeft > 0 ? `(${spotsLeft} spots left)` : '(Full)'}
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '6px',
            background: 'var(--color-surface-hover)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: `${percentFilled}%`,
              height: '100%',
              background: isFull
                ? 'var(--color-warning)'
                : isRegistered
                ? 'var(--color-success)'
                : 'linear-gradient(90deg, var(--color-primary), #ff9800)',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>

      {/* Skills Required Tags */}
      {activity.requiredSkills && activity.requiredSkills.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Skills:</span>
          {activity.requiredSkills.map((sk) => (
            <Badge key={sk} variant="neutral" style={{ fontSize: '10px' }}>
              {sk}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer Actions */}
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
          onClick={() => onViewDetails && onViewDetails(activity)}
        >
          View Details & Briefing
        </Button>

        {/* Volunteer RSVP Actions */}
        {!isAdmin && (
          <div>
            {isRegistered ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onLeave && onLeave(activity)}
                style={{ color: 'var(--color-critical)' }}
              >
                Cancel RSVP
              </Button>
            ) : isCompleted || isCancelled ? (
              <Badge variant="neutral">Concluded</Badge>
            ) : isFull ? (
              <Badge variant="warning">Event Full</Badge>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={() => onJoin && onJoin(activity)}
              >
                <UserCheck size={14} style={{ marginRight: '5px' }} />
                Join Activity (RSVP)
              </Button>
            )}
          </div>
        )}

        {/* Admin Management Controls */}
        {isAdmin && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(activity)}
              >
                <Edit size={13} style={{ marginRight: '4px' }} />
                Edit
              </Button>
            )}

            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(activity)}
                style={{ color: 'var(--color-critical)' }}
              >
                <Trash2 size={13} />
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ActivityCard;
