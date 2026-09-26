import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import ActivityStatusBadge from './ActivityStatusBadge';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HardHat,
  Phone,
  UserCheck,
  Ban
} from 'lucide-react';

/**
 * Activity Detail Modal Component
 * Displays comprehensive briefing, venue location, required skills,
 * participant rosters, and RSVP actions
 */
export const ActivityDetailModal = ({
  isOpen,
  onClose,
  activity,
  isRegistered = false,
  isAdmin = false,
  onJoin = null,
  onLeave = null,
  onStatusChange = null
}) => {
  if (!isOpen || !activity) return null;

  const currentCount = activity.currentParticipantsCount || 0;
  const capacity = activity.capacity || 30;
  const spotsLeft = Math.max(0, capacity - currentCount);
  const isFull = spotsLeft === 0 && !isRegistered;
  const isCompleted = activity.status === 'completed';
  const isCancelled = activity.status === 'cancelled';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activity.title}
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {/* Header Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Badge variant="primary">{activity.category}</Badge>
            {isRegistered && (
              <Badge variant="success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} />
                <span>You're Registered</span>
              </Badge>
            )}
          </div>
          <ActivityStatusBadge status={activity.status} />
        </div>

        {/* Description */}
        <p style={{ margin: 0, fontSize: '0.94rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          {activity.description}
        </p>

        {/* Date, Location, Organizer Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            background: 'var(--color-surface-hover)',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-subtle)',
            fontSize: '0.88rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              <Calendar size={14} color="var(--color-primary)" />
              <span>DATE & TIME</span>
            </div>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {activity.date}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
              {activity.startTime} — {activity.endTime} ({activity.duration})
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              <MapPin size={14} color="var(--color-primary)" />
              <span>VENUE & MEETING POINT</span>
            </div>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {activity.location}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
              {activity.address || activity.location}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              <Users size={14} color="var(--color-primary)" />
              <span>ORGANIZER COORDINATION</span>
            </div>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {activity.organizer}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
              {activity.organizerContact}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              <ShieldCheck size={14} color="var(--color-primary)" />
              <span>MOBILIZATION CAPACITY</span>
            </div>
            <div style={{ fontWeight: 600, color: isFull ? 'var(--color-warning)' : 'var(--color-text-primary)', marginTop: '4px' }}>
              {currentCount} / {capacity} Enrolled
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
              {spotsLeft > 0 ? `${spotsLeft} open volunteer slots` : 'Roster at maximum capacity'}
            </div>
          </div>
        </div>

        {/* Requirements and Gear */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          {/* Required Skills */}
          <div
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-subtle)'
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>
              REQUIRED / RECOMMENDED SKILLS
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(activity.requiredSkills || []).map((sk) => (
                <Badge key={sk} variant="neutral" style={{ fontSize: '11px' }}>
                  {sk}
                </Badge>
              ))}
            </div>
          </div>

          {/* Recommended Gear */}
          <div
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
              <HardHat size={14} color="var(--color-primary)" />
              <span>SAFETY GEAR & PPE REQUIRED</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
              {activity.recommendedGear || 'Standard closed-toe shoes and weather-appropriate outdoor attire.'}
            </div>
          </div>
        </div>

        {/* Enrolled Participant Roster (Admin View) */}
        {isAdmin && activity.participants && activity.participants.length > 0 && (
          <div style={{ marginTop: 'var(--spacing-xs)' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
              Registered Volunteer Roster ({activity.participants.length})
            </h4>
            <div
              style={{
                maxHeight: '180px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px'
              }}
            >
              {activity.participants.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-surface-hover)',
                    fontSize: '0.85rem'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{p.volunteerName}</span>
                    <span style={{ color: 'var(--color-text-muted)', marginLeft: '8px' }}>({p.volunteerEmail})</span>
                    {p.notes && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        Note: "{p.notes}"
                      </div>
                    )}
                  </div>
                  <Badge variant="success" style={{ fontSize: '10px' }}>
                    Confirmed
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Quick Status Change Controls */}
        {isAdmin && onStatusChange && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-subtle)',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              Update Operational Lifecycle Status:
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                size="sm"
                variant={activity.status === 'scheduled' ? 'primary' : 'outline'}
                onClick={() => onStatusChange(activity.id, 'scheduled')}
              >
                Scheduled
              </Button>
              <Button
                size="sm"
                variant={activity.status === 'in_progress' ? 'primary' : 'outline'}
                onClick={() => onStatusChange(activity.id, 'in_progress')}
              >
                In Progress
              </Button>
              <Button
                size="sm"
                variant={activity.status === 'completed' ? 'success' : 'outline'}
                onClick={() => onStatusChange(activity.id, 'completed')}
              >
                Mark Completed
              </Button>
              <Button
                size="sm"
                variant={activity.status === 'cancelled' ? 'critical' : 'ghost'}
                onClick={() => onStatusChange(activity.id, 'cancelled')}
              >
                Cancel Activity
              </Button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: 'var(--spacing-sm)' }}>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          {/* Volunteer Actions */}
          {!isAdmin && (
            <>
              {isRegistered ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    onLeave && onLeave(activity);
                    onClose();
                  }}
                  style={{ color: 'var(--color-critical)' }}
                >
                  Cancel RSVP
                </Button>
              ) : isCompleted || isCancelled ? (
                <Button variant="outline" disabled>
                  Activity Concluded
                </Button>
              ) : isFull ? (
                <Button variant="outline" disabled>
                  Capacity Full
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => {
                    onJoin && onJoin(activity);
                    onClose();
                  }}
                >
                  <UserCheck size={16} style={{ marginRight: '6px' }} />
                  Join Activity & Confirm RSVP
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ActivityDetailModal;
