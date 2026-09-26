import React from 'react';
import PublicNavbar from '../../components/navigation/PublicNavbar';
import NotFoundState from '../../components/states/NotFoundState';

export const NotFoundPage = () => {
  return (
    <div className="landing-wrapper">
      <PublicNavbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)' }}>
        <NotFoundState />
      </div>
    </div>
  );
};

export default NotFoundPage;
