import React from 'react';
import {
  MapPin,
  Clock,
  Users2,
  CheckCircle2,
  Navigation,
  CheckCircle,
  FileText,
  AlertTriangle,
  Flame,
  ShieldCheck,
  ChevronRight,
  Trash2
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import AssignmentStatusBadge from './AssignmentStatusBadge';
import AssignmentLifecycleTracker from './AssignmentLifecycleTracker';
import EmergencySeverityBadge from '../emergency/EmergencySeverityBadge';

export const AssignmentCard = ({
  assignment,
  isAdmin = false,
  isVolunteer = false,
  onRespond = null, // (assignment) => void
  onStart = null,   // (assignment) => void
  onComplete = null,// (assignment) => void
  onDelete = null   // (assignment) => void
}) => {
  if (!assignment) return null;

  const formattedCreated = new Date(assignment.createdTime).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Card
      hoverable
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'var(--space-5)',
        borderLeft: `4px solid ${
          assignment.status === 'completed'
            ? 'var(--color-success)'
            : assignment.status === 'in_progress'
            ? 'var(--color-primary)'
            : assignment.status === 'accepted'
            ? 'var(--color-info)'
            : assignment.status === 'declined'
            ? 'var(--color-critical)'
            : 'var(--color-warning)'
        }`
      }}
    >
      <div>
        {/* Top Header: Emergency & Status Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-3)',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <EmergencySeverityBadge severity={assignment.emergencySeverity} />
            <AssignmentStatusBadge status={assignment.status} />
            <Badge variant="neutral" style={{ fontSize: '11px' }}>
              {assignment.priority}
            </Badge>
          </div>

          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} />
            <span>Assigned: {formattedCreated}</span>
          </div>
        </div>

        {/* Emergency Incident Name */}
        <h3
          style={{
            fontSize: 'var(--font-lg)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-2)',
            lineHeight: 1.3
          }}
        >
          {assignment.emergencyTitle}
        </h3>

        {/* Assigned Responder & Skill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-3)',
            background: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: 'var(--space-3)',
            flexWrap: 'wrap',
            gap: 'var(--space-2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users2 size={16} color="var(--color-primary)" />
            <div>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>
                Assigned Responder
              </span>
              <strong style={{ color: 'var(--text-primary)', fontSize: 'var(--font-sm)' }}>
                {assignment.volunteerName}
              </strong>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>
              Allocated Skill
            </span>
            <Badge variant="info">
              {assignment.skill} ({assignment.proficiency})
            </Badge>
          </div>
        </div>

        {/* Staging Area & Location */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: 'var(--font-sm)',
            color: 'var(--color-primary)',
            marginBottom: 'var(--space-3)'
          }}
        >
          <MapPin size={15} style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 600 }}>Staging: {assignment.stagingArea}</span>
        </div>

        {/* Instructions / Briefing */}
        <p
          style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            marginBottom: 'var(--space-4)',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border-default)'
          }}
        >
          <strong>Instructions:</strong> {assignment.instructions}
        </p>

        {/* Lifecycle Tracker */}
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <AssignmentLifecycleTracker assignment={assignment} />
        </div>

        {/* Status-specific Response Logs */}
        {assignment.responseInfo?.notes && (
          <div
            style={{
              padding: 'var(--space-2) var(--space-3)',
              background: 'rgba(59, 130, 246, 0.08)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              fontSize: 'var(--font-xs)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-3)'
            }}
          >
            <strong style={{ color: 'var(--color-info)' }}>Volunteer Response Notes:</strong> {assignment.responseInfo.notes}
          </div>
        )}

        {assignment.inProgressInfo?.notes && (
          <div
            style={{
              padding: 'var(--space-2) var(--space-3)',
              background: 'rgba(249, 115, 22, 0.08)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(249, 115, 22, 0.25)',
              fontSize: 'var(--font-xs)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-3)'
            }}
          >
            <strong style={{ color: 'var(--color-primary)' }}>Field Progress Update:</strong> {assignment.inProgressInfo.notes}
          </div>
        )}

        {assignment.completionInfo?.completionNotes && (
          <div
            style={{
              padding: 'var(--space-2) var(--space-3)',
              background: 'var(--color-success-bg)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-success-border)',
              fontSize: 'var(--font-xs)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-3)'
            }}
          >
            <strong style={{ color: 'var(--color-success)' }}>Mission Completion Log:</strong> {assignment.completionInfo.completionNotes}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 'var(--space-3)',
          marginTop: 'var(--space-3)',
          flexWrap: 'wrap',
          gap: 'var(--space-2)'
        }}
      >
        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
          Assigned by: <strong>{assignment.assignedBy}</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {/* Volunteer Actions */}
          {isVolunteer && assignment.status === 'assigned' && onRespond && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onRespond(assignment)}
              icon={<CheckCircle2 size={14} />}
            >
              Respond / Accept
            </Button>
          )}

          {isVolunteer && assignment.status === 'accepted' && onStart && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onStart(assignment)}
              icon={<Navigation size={14} />}
            >
              Start Deployment (In Progress)
            </Button>
          )}

          {isVolunteer && assignment.status === 'in_progress' && onComplete && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onComplete(assignment)}
              icon={<CheckCircle size={14} />}
              style={{ color: 'var(--color-success)', borderColor: 'var(--color-success)' }}
            >
              Complete Assignment
            </Button>
          )}

          {isVolunteer && assignment.status === 'completed' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: 'var(--font-xs)',
                color: 'var(--color-success)',
                fontWeight: 600
              }}
            >
              <CheckCircle size={14} />
              Mission Concluded
            </span>
          )}

          {/* Admin Actions */}
          {isAdmin && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(assignment)}
              icon={<Trash2 size={14} color="var(--color-critical)" />}
              style={{ color: 'var(--color-critical)' }}
              title="Delete or revoke assignment"
            >
              Cancel Assignment
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AssignmentCard;
