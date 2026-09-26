import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Play,
  Layers,
  Database,
  Clock,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import { useSync } from '../../context/SyncContext';

export const OfflineSyncPage = () => {
  const {
    isOnline,
    isSimulatedOffline,
    connectivityState,
    toggleSimulatedOffline,
    queue,
    pendingCount,
    isSyncing,
    lastSyncTimestamp,
    cacheSummary,
    syncNow,
    retryMutation,
    retryAll,
    resolveConflict,
    clearQueue,
    enqueueMutation
  } = useSync();

  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resolutionNote, setResolutionNote] = useState(null);

  const conflicts = queue.filter((m) => m.status === 'conflict');
  const failedItems = queue.filter((m) => m.status === 'failed');

  const filteredQueue = queue.filter((item) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'PENDING') return item.status === 'pending';
    if (filterStatus === 'FAILED') return item.status === 'failed';
    if (filterStatus === 'CONFLICT') return item.status === 'conflict';
    if (filterStatus === 'SYNCED') return item.status === 'synced';
    return true;
  });

  const handleManualSync = async () => {
    setIsProcessing(true);
    try {
      await syncNow();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetryItem = async (id) => {
    setIsProcessing(true);
    try {
      await retryMutation(id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResolveConflict = async (id, choice) => {
    setIsProcessing(true);
    try {
      await resolveConflict(id, choice);
      setResolutionNote(`Conflict resolved: ${choice === 'local' ? 'Local changes retained' : 'Remote placeholder accepted'}`);
      setTimeout(() => setResolutionNote(null), 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateConflict = async () => {
    await enqueueMutation({
      entityType: 'emergency',
      entityId: 'emg-501',
      operation: 'UPDATE',
      description: 'Tactical Perimeter Revision (Simulated Conflict)',
      payload: {
        stagingArea: 'Sector 4 Levee Crest',
        _simulateConflict: true
      }
    });
    if (isOnline) await syncNow();
  };

  const handleSimulateFailure = async () => {
    await enqueueMutation({
      entityType: 'skill',
      entityId: 'skl-003',
      operation: 'UPDATE',
      description: 'Swiftwater Technician Clearance (Simulated Timeout)',
      payload: {
        proficiency: 'Advanced',
        _simulateFailure: true
      }
    });
    if (isOnline) await syncNow();
  };

  const handleSimulateStandardAction = async () => {
    await enqueueMutation({
      entityType: 'community',
      entityId: 'act-901',
      operation: 'RSVP',
      description: 'Volunteer RSVP Confirmed (Offline Action)',
      payload: {
        role: 'Field Logistics'
      }
    });
    if (isOnline) await syncNow();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'synced':
        return <Badge variant="success">Synced</Badge>;
      case 'syncing':
        return <Badge variant="info">Syncing</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending Sync</Badge>;
      case 'conflict':
        return <Badge variant="critical">Conflict</Badge>;
      case 'failed':
        return <Badge variant="critical">Failed (Max Retries)</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="page-container" style={{ padding: '24px 32px' }}>
      <PageHeader
        title="Offline Synchronization & Resilience"
        description="Inspect queued field mutations, resolve data conflicts, and monitor mock synchronization state across the local disaster response network."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant={isSimulatedOffline ? 'secondary' : 'warning'}
              size="sm"
              onClick={toggleSimulatedOffline}
            >
              {isSimulatedOffline ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{isSimulatedOffline ? 'Simulate Reconnection' : 'Simulate Offline Mode'}</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!isOnline || isSyncing || isProcessing}
              onClick={handleManualSync}
            >
              <RefreshCw size={14} className={isSyncing || isProcessing ? 'spin-icon' : ''} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <Card>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Connection Status</div>
          <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700, margin: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isOnline ? <Wifi size={20} style={{ color: 'var(--color-success)' }} /> : <WifiOff size={20} style={{ color: 'var(--color-warning)' }} />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{connectivityState.label}</div>
        </Card>

        <Card>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Pending Mutations</div>
          <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--color-warning)', margin: '6px 0' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Awaiting synchronization</div>
        </Card>

        <Card>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Active Conflicts</div>
          <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: conflicts.length > 0 ? 'var(--color-critical)' : 'var(--color-success)', margin: '6px 0' }}>
            {conflicts.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Concurrent update discrepancies</div>
        </Card>

        <Card>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Cached Stores</div>
          <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--color-orange-500)', margin: '6px 0' }}>
            {Object.keys(cacheSummary.stores || {}).length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{(cacheSummary.totalBytes / 1024).toFixed(1)} KB offline cache</div>
        </Card>
      </div>

      {/* Resolution Toast */}
      {resolutionNote && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--color-success)',
            fontSize: 'var(--font-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}
        >
          <CheckCircle2 size={16} />
          <span>{resolutionNote}</span>
        </div>
      )}

      {/* Conflicts Resolution Box if conflicts exist */}
      {conflicts.length > 0 && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid var(--color-critical-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-critical)', fontWeight: 600 }}>
            <AlertTriangle size={20} />
            <span>Action Required: Concurrent Conflict Resolution ({conflicts.length})</span>
          </div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
            The following actions were modified concurrently on the remote placeholder while your device was offline:
          </div>

          {conflicts.map((item) => (
            <div
              key={item.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>{item.description}</span>
                <Badge variant="critical">Conflict Detected</Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'rgba(255, 107, 0, 0.05)', border: '1px solid rgba(255, 107, 0, 0.2)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-orange-500)', fontSize: 'var(--font-xs)', marginBottom: '4px' }}>
                    Local Device Changes
                  </div>
                  <pre style={{ margin: 0, fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(item.conflictInfo?.localVersion || item.payload, null, 2)}
                  </pre>
                </div>

                <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-info)', fontSize: 'var(--font-xs)', marginBottom: '4px' }}>
                    Remote Server Placeholder Version
                  </div>
                  <pre style={{ margin: 0, fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(item.conflictInfo?.remoteVersion || { note: 'Remote edit' }, null, 2)}
                  </pre>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <Button variant="secondary" size="sm" onClick={() => handleResolveConflict(item.id, 'remote')}>
                  Accept Remote Version
                </Button>
                <Button variant="primary" size="sm" onClick={() => handleResolveConflict(item.id, 'local')}>
                  Keep Local Changes
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Queue Management Section */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '20px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['ALL', 'PENDING', 'CONFLICT', 'FAILED', 'SYNCED'].map((st) => (
              <button
                key={st}
                type="button"
                className={`btn btn-xs ${filterStatus === st ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilterStatus(st)}
              >
                {st}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" size="xs" onClick={() => clearQueue()}>
              <Trash2 size={12} />
              <span>Clear Queue</span>
            </Button>
            {failedItems.length > 0 && (
              <Button variant="warning" size="xs" onClick={() => retryAll()}>
                <RefreshCw size={12} />
                <span>Retry All Failed</span>
              </Button>
            )}
          </div>
        </div>

        {filteredQueue.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}
          >
            <CheckCircle2 size={40} style={{ color: 'var(--color-success)', marginBottom: '12px' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              No Mutations Found
            </div>
            <div style={{ fontSize: 'var(--font-xs)', maxWidth: '420px', margin: '0 auto' }}>
              {filterStatus === 'ALL'
                ? 'Your offline mutation queue is empty. Actions performed while offline will queue here.'
                : `No mutations matching filter "${filterStatus}".`}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredQueue.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{item.description}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.id}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getStatusBadge(item.status)}
                    {item.status === 'failed' && (
                      <Button variant="secondary" size="xs" onClick={() => handleRetryItem(item.id)}>
                        <RefreshCw size={12} />
                        <span>Retry</span>
                      </Button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <span>Entity: <strong style={{ color: 'var(--text-secondary)' }}>{item.entityType}</strong></span>
                    <span>Operation: <strong style={{ color: 'var(--text-secondary)' }}>{item.operation}</strong></span>
                    <span>Retries: <strong style={{ color: 'var(--text-secondary)' }}>{item.retryCount || 0}/{item.maxRetries || 3}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {item.error && (
                  <div style={{ fontSize: '11px', color: 'var(--color-critical)', background: 'rgba(239, 68, 68, 0.08)', padding: '6px 10px', borderRadius: '4px' }}>
                    {item.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dev Testing Bar */}
      <div style={{ marginTop: '24px' }}>
        <SectionHeader title="Development Simulation Tools" />
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
          <Button variant="secondary" size="sm" onClick={handleSimulateStandardAction}>
            Simulate Activity RSVP
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSimulateConflict}>
            Simulate Emergency Conflict
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSimulateFailure}>
            Simulate Skill Sync Failure
          </Button>
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ title }) => (
  <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
    <h4 style={{ margin: 0, fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</h4>
  </div>
);

export default OfflineSyncPage;
