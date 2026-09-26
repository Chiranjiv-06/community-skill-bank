import React from 'react';
import Badge from '../common/Badge';
import { SEVERITY_LABELS, SEVERITY_BADGE_VARIANTS } from '../../data/devEmergencies';

/**
 * Reusable Emergency Severity Badge
 * @param {'critical' | 'high' | 'medium' | 'low'} severity
 */
export const EmergencySeverityBadge = ({ severity, className = '' }) => {
  const label = SEVERITY_LABELS[severity] || severity;
  const variant = SEVERITY_BADGE_VARIANTS[severity] || 'neutral';

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
};

export default EmergencySeverityBadge;
