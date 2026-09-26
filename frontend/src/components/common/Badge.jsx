import React from 'react';

/**
 * Reusable Badge Component
 * @param {string} variant - 'primary' | 'critical' | 'warning' | 'success' | 'info' | 'neutral'
 */
export const Badge = ({
  children,
  variant = 'neutral',
  className = '',
  ...props
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
};

export default Badge;
