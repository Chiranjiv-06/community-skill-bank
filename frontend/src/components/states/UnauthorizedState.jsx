import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';

/**
 * UnauthorizedState Component
 */
export const UnauthorizedState = ({
  title = 'Access Restricted',
  message = 'You do not have the required permissions or role clearances to view this command console.',
  redirectPath = '/volunteer/dashboard',
  redirectLabel = 'Return to Dashboard'
}) => {
  return (
    <div className="state-container" style={{ minHeight: '340px' }}>
      <div className="state-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.12)' }}>
        <ShieldAlert size={36} color="var(--color-critical)" />
      </div>
      <h3 className="state-title">{title}</h3>
      <p className="state-description">{message}</p>
      <Link to={redirectPath}>
        <Button variant="secondary" size="md">
          {redirectLabel}
        </Button>
      </Link>
    </div>
  );
};

export default UnauthorizedState;
