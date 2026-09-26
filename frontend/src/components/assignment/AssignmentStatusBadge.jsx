import React from 'react';
import Badge from '../common/Badge';
import {
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_VARIANTS
} from '../../data/devAssignments';

/**
 * Reusable Assignment Status Badge
 * @param {'assigned' | 'accepted' | 'in_progress' | 'completed' | 'declined'} status
 */
export const AssignmentStatusBadge = ({ status, className = '', style = {} }) => {
  const label = ASSIGNMENT_STATUS_LABELS[status] || status;
  const variant = ASSIGNMENT_STATUS_VARIANTS[status] || 'neutral';

  return (
    <Badge variant={variant} className={className} style={style}>
      <span className="status-dot" />
      {label}
    </Badge>
  );
};

export default AssignmentStatusBadge;
