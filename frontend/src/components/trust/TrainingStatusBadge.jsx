import React from 'react';
import Badge from '../common/Badge';
import { CheckCircle2, PlayCircle, CircleDashed } from 'lucide-react';

/**
 * Training status badge component
 * @param {string} status - 'not_started' | 'in_progress' | 'completed'
 */
export const TrainingStatusBadge = ({ status = 'not_started' }) => {
  switch (status) {
    case 'completed':
      return (
        <Badge variant="success" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <CheckCircle2 size={13} />
          <span>Completed</span>
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge variant="primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <PlayCircle size={13} />
          <span>In Progress</span>
        </Badge>
      );
    case 'not_started':
    default:
      return (
        <Badge variant="neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <CircleDashed size={13} />
          <span>Not Started</span>
        </Badge>
      );
  }
};

export default TrainingStatusBadge;
