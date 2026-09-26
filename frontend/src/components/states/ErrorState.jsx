import React from 'react';
import { AlertCircle } from 'lucide-react';
import Button from '../common/Button';

/**
 * ErrorState Component
 */
export const ErrorState = ({
  title = 'Unable to Load Data',
  message = 'An unexpected error occurred while fetching information.',
  onRetry = null,
  minHeight = '280px'
}) => {
  return (
    <div className="state-container" style={{ minHeight, borderColor: 'var(--badge-critical-border)' }}>
      <div className="state-icon-wrapper" style={{ background: 'var(--badge-critical-bg)' }}>
        <AlertCircle size={32} color="var(--color-critical)" />
      </div>
      <h4 className="state-title">{title}</h4>
      <p className="state-description">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
