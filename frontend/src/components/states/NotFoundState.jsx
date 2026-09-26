import React from 'react';
import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';

/**
 * NotFoundState Component
 */
export const NotFoundState = ({
  title = '404 - Page Not Found',
  message = 'The emergency module or sector page you requested does not exist or has been relocated.',
  homePath = '/'
}) => {
  return (
    <div className="state-container" style={{ minHeight: '400px', border: 'none', background: 'transparent' }}>
      <div className="state-icon-wrapper" style={{ width: '80px', height: '80px' }}>
        <Compass size={44} color="var(--color-primary)" />
      </div>
      <h2 style={{ fontSize: 'var(--font-3xl)', marginBottom: 'var(--space-2)' }}>{title}</h2>
      <p className="state-description">{message}</p>
      <Link to={homePath}>
        <Button variant="primary" size="lg">
          Return to Platform Home
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundState;
