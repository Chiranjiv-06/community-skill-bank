import React from 'react';
import Badge from '../common/Badge';
import { Calendar, PlayCircle, CheckCircle2, Ban } from 'lucide-react';

/**
 * Community Activity Status Badge Component
 * @param {string} status - 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
 */
export const ActivityStatusBadge = ({ status = 'scheduled' }) => {
  switch (status) {
    case 'in_progress':
      return (
        <Badge variant="warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <PlayCircle size={13} />
          <span>In Progress</span>
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="success" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <CheckCircle2 size={13} />
          <span>Completed</span>
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <Ban size={13} />
          <span>Cancelled</span>
        </Badge>
      );
    case 'scheduled':
    default:
      return (
        <Badge variant="primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <Calendar size={13} />
          <span>Scheduled</span>
        </Badge>
      );
  }
};

export default ActivityStatusBadge;
