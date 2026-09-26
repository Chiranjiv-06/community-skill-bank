import React, { useState } from 'react';
import { WifiOff, RefreshCw, Layers } from 'lucide-react';
import { useSync } from '../../context/SyncContext';
import OfflineSyncModal from './OfflineSyncModal';

export const OfflineBanner = () => {
  const { isOnline, isSimulatedOffline, toggleSimulatedOffline, pendingCount } = useSync();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isOnline && !isSimulatedOffline) return null;

  return (
    <>
      <div
        style={{
          background: 'linear-gradient(90deg, #9A3412 0%, #EA580C 100%)',
          color: '#FFFFFF',
          padding: '8px 16px',
          fontSize: 'var(--font-xs)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          zIndex: 90,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
          <WifiOff size={16} />
          <span>
            <strong>Working Offline:</strong> All changes are saved locally to device storage and queued for automatic synchronization upon reconnection.
          </span>
          {pendingCount > 0 && (
            <span
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              {pendingCount} Pending Action{pendingCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-xs"
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              color: '#FFF',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '2px 10px',
              fontSize: '11px'
            }}
            onClick={() => setIsModalOpen(true)}
          >
            <Layers size={12} />
            <span>Inspect Queue</span>
          </button>
          <button
            type="button"
            className="btn btn-xs"
            style={{
              background: '#FFFFFF',
              color: '#9A3412',
              fontWeight: 700,
              border: 'none',
              padding: '2px 10px',
              fontSize: '11px'
            }}
            onClick={toggleSimulatedOffline}
          >
            <RefreshCw size={12} />
            <span>Reconnect & Sync</span>
          </button>
        </div>
      </div>

      {isModalOpen && (
        <OfflineSyncModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
};

export default OfflineBanner;
