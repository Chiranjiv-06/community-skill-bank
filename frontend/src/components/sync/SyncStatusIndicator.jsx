import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useSync } from '../../context/SyncContext';
import OfflineSyncModal from './OfflineSyncModal';

/**
 * Topbar Connectivity & Sync Status Indicator
 * Seamlessly integrates into existing Topbar layout without redesigning it.
 */
export const SyncStatusIndicator = () => {
  const {
    isOnline,
    isSimulatedOffline,
    isSyncing,
    pendingCount,
    queue
  } = useSync();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if any item has conflict or failed
  const hasConflict = queue.some((m) => m.status === 'conflict');
  const hasFailure = queue.some((m) => m.status === 'failed');

  let pillClass = 'badge-success';
  let Icon = Wifi;
  let label = 'Online';

  if (!isOnline || isSimulatedOffline) {
    pillClass = 'badge-warning';
    Icon = WifiOff;
    label = pendingCount > 0 ? `Offline (${pendingCount})` : 'Offline';
  } else if (isSyncing) {
    pillClass = 'badge-info';
    Icon = RefreshCw;
    label = 'Syncing...';
  } else if (hasConflict) {
    pillClass = 'badge-critical';
    Icon = AlertTriangle;
    label = 'Conflict';
  } else if (hasFailure) {
    pillClass = 'badge-critical';
    Icon = AlertTriangle;
    label = 'Sync Error';
  } else if (pendingCount > 0) {
    pillClass = 'badge-warning';
    Icon = RefreshCw;
    label = `${pendingCount} Queued`;
  }

  return (
    <>
      <button
        type="button"
        className={`badge ${pillClass}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          cursor: 'pointer',
          border: '1px solid currentColor',
          background: 'rgba(255, 255, 255, 0.05)',
          fontSize: 'var(--font-xs)',
          fontWeight: 600,
          borderRadius: 'var(--radius-full)',
          transition: 'all var(--transition-fast)'
        }}
        onClick={() => setIsModalOpen(true)}
        title="Offline Synchronization & Connectivity Center"
      >
        <Icon size={14} className={isSyncing ? 'spin-icon' : ''} />
        <span>{label}</span>
      </button>

      {/* Sync Management Modal */}
      {isModalOpen && (
        <OfflineSyncModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
};

export default SyncStatusIndicator;
