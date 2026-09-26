import React from 'react';

/**
 * LoadingState Component
 */
export const LoadingState = ({ message = 'Loading emergency response data...', minHeight = '280px' }) => {
  return (
    <div className="state-container" style={{ minHeight }}>
      <div className="spinner" aria-hidden="true" style={{ marginBottom: 'var(--space-4)' }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', fontWeight: 500 }}>
        {message}
      </p>
    </div>
  );
};

export default LoadingState;
