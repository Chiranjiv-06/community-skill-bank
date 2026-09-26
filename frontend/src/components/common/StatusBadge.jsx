import React from 'react';
import { getSeverityBadgeVariant } from '../../utils/formatters';

/**
 * Reusable StatusBadge Component with status dot / pulse
 * @param {string} status - e.g. 'critical', 'high', 'active', 'warning', 'resolved'
 * @param {boolean} pulse - whether to show pulsing dot for active critical emergencies
 */
export const StatusBadge = ({
  status,
  label = null,
  pulse = false,
  className = '',
  ...props
}) => {
  const variant = getSeverityBadgeVariant(status);
  const displayLabel = label || status;

  return (
    <span className={`badge badge-${variant} ${className}`.trim()} {...props}>
      <span className={pulse ? 'badge-pulse' : 'status-dot'} aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  );
};

export default StatusBadge;
