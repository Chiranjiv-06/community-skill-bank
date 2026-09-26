import React from 'react';

/**
 * Reusable PageHeader Component
 */
export const PageHeader = ({
  title,
  subtitle,
  icon = null,
  actions = null,
  badge = null,
  className = ''
}) => {
  return (
    <div className={`page-header ${className}`.trim()}>
      <div>
        <div className="page-title">
          {icon && <span style={{ color: 'var(--color-primary)', display: 'inline-flex' }}>{icon}</span>}
          <span>{title}</span>
          {badge}
        </div>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
};

export default PageHeader;
