import React from 'react';

/**
 * Reusable SectionHeader Component
 */
export const SectionHeader = ({
  title,
  icon = null,
  action = null,
  className = ''
}) => {
  return (
    <div className={`section-header ${className}`.trim()}>
      <h3 className="section-title">
        {icon && <span style={{ color: 'var(--color-primary)' }}>{icon}</span>}
        <span>{title}</span>
      </h3>
      {action && <div>{action}</div>}
    </div>
  );
};

export default SectionHeader;
