import React from 'react';
import {
  CheckCircle2,
  Clock,
  Navigation,
  CheckCircle,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

const STEPS = [
  { key: 'assigned', label: '1. Assigned', icon: Clock },
  { key: 'accepted', label: '2. Accepted', icon: CheckCircle2 },
  { key: 'in_progress', label: '3. In Progress', icon: Navigation },
  { key: 'completed', label: '4. Completed', icon: CheckCircle }
];

const STEP_ORDER = {
  assigned: 1,
  accepted: 2,
  in_progress: 3,
  completed: 4,
  declined: -1
};

export const AssignmentLifecycleTracker = ({ assignment, style = {} }) => {
  if (!assignment) return null;

  const currentStepNum = STEP_ORDER[assignment.status] || 1;
  const isDeclined = assignment.status === 'declined';

  if (isDeclined) {
    return (
      <div
        style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-critical-bg)',
          border: '1px solid var(--color-critical-border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-critical)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          fontSize: 'var(--font-xs)',
          ...style
        }}
      >
        <AlertTriangle size={15} />
        <span>
          <strong>Deployment Declined:</strong> Volunteer was unable to accept this assignment.
          {assignment.responseInfo?.notes ? ` Reason: "${assignment.responseInfo.notes}"` : ''}
        </span>
      </div>
    );
  }

  const getStepTime = (stepKey) => {
    if (stepKey === 'assigned') return assignment.createdTime;
    if (stepKey === 'accepted') return assignment.responseInfo?.respondedAt;
    if (stepKey === 'in_progress') return assignment.inProgressInfo?.startedAt;
    if (stepKey === 'completed') return assignment.completionInfo?.completedAt;
    return null;
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--bg-surface-elevated)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        gap: 'var(--space-2)',
        flexWrap: 'wrap',
        ...style
      }}
    >
      {STEPS.map((step, idx) => {
        const stepNum = idx + 1;
        const isDone = currentStepNum > stepNum;
        const isCurrent = currentStepNum === stepNum;
        const time = getStepTime(step.key);
        const Icon = step.icon;

        const textColor = isCurrent
          ? 'var(--color-primary)'
          : isDone
          ? 'var(--color-success)'
          : 'var(--text-muted)';

        const borderColor = isCurrent
          ? 'var(--color-primary)'
          : isDone
          ? 'var(--color-success)'
          : 'var(--border-default)';

        const bg = isCurrent
          ? 'rgba(249, 115, 22, 0.12)'
          : isDone
          ? 'var(--color-success-bg)'
          : 'transparent';

        return (
          <React.Fragment key={step.key}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                background: bg,
                border: `1px solid ${borderColor}`,
                fontSize: 'var(--font-xs)',
                color: textColor,
                fontWeight: isCurrent || isDone ? 600 : 400
              }}
            >
              <Icon size={14} color={textColor} />
              <div>
                <span>{step.label}</span>
                {time && (
                  <span
                    style={{
                      display: 'block',
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      fontWeight: 400
                    }}
                  >
                    {new Date(time).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                )}
              </div>
            </div>

            {idx < STEPS.length - 1 && (
              <ArrowRight
                size={14}
                color={isDone ? 'var(--color-success)' : 'var(--text-muted)'}
                style={{ opacity: isDone ? 1 : 0.4 }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default AssignmentLifecycleTracker;
