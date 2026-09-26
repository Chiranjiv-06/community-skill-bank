import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import Button from '../common/Button';

/**
 * OfflineState Component
 */
export const OfflineState = ({
  title = 'Field Connection Offline',
  message = 'Operating in cached offline mode. Emergency data will sync automatically once connectivity is restored.',
  onRetry = () => window.location.reload()
}) => {
  return (
    <div className="state-container" style={{ minHeight: '300px', borderColor: 'var(--badge-warning-border)' }}>
      <div className="state-icon-wrapper" style={{ background: 'var(--badge-warning-bg)' }}>
        <WifiOff size={32} color="var(--color-warning)" />
      </div>
      <h4 className="state-title">{title}</h4>
      <p className="state-description">{message}</p>
      <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={onRetry}>
        Check Network Status
      </Button>
    </div>
  );
};

export default OfflineState;
