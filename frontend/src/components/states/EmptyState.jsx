import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * EmptyState Component
 */
export const EmptyState = ({
  icon = <Inbox size={32} color="var(--color-primary)" />,
  title = 'No Records Found',
  description = 'There are no active records in this section at this time.',
  action = null,
  minHeight = '280px'
}) => {
  return (
    <div className="state-container" style={{ minHeight }}>
      <div className="state-icon-wrapper">{icon}</div>
      <h4 className="state-title">{title}</h4>
      <p className="state-description">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
