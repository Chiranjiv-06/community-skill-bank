import React from 'react';
import Badge from '../common/Badge';
import { STATUS_LABELS, STATUS_BADGE_VARIANTS } from '../../data/devEmergencies';

/**
 * Reusable Emergency Status Badge
 * @param {'open' | 'in_progress' | 'resolved' | 'cancelled'} status
 */
export const EmergencyStatusBadge = ({ status, className = '' }) => {
  const label = STATUS_LABELS[status] || status;
  const variant = STATUS_BADGE_VARIANTS[status] || 'neutral';

  return (
    <Badge variant={variant} className={className}>
      <span className="status-dot" />
      {label}
    </Badge>
  );
};

export default EmergencyStatusBadge;
