import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Play,
  ArrowRight,
  Clock,
  Database,
  Layers,
  HelpCircle,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { useSync } from '../../context/SyncContext';

export const OfflineSyncModal = ({ isOpen, onClose }) => {
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

  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'cache' | 'sim'
  const [isProcessing, setIsProcessing] = useState(false);
  const [resolutionNote, setResolutionNote] = useState(null);

  const conflicts = queue.filter((m) => m.status === 'conflict');
  const failedItems = queue.filter((m) => m.status === 'failed');

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
      setResolutionNote(`Conflict resolved by choosing: ${choice === 'local' ? 'Local Changes' : 'Remote Version'}`);
      setTimeout(() => setResolutionNote(null), 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper simulation triggers
  const handleSimulateConflict = async () => {
    await enqueueMutation({
      entityType: 'emergency',
      entityId: 'emg-501',
      operation: 'UPDATE',
      description: 'Tactical Perimeter Revision (Conflict Simulation)',
      payload: {
        stagingArea: 'Sector 4 North Levee Command',
        accessRoadOpen: false,
        _simulateConflict: true
      }
    });
    if (isOnline) {
      await syncNow();
    }
  };

  const handleSimulateFailure = async () => {
    await enqueueMutation({
      entityType: 'skill',
      entityId: 'skl-003',
      operation: 'UPDATE',
      description: 'Emergency Medical Technician Clearance (Failure Simulation)',
      payload: {
        proficiency: 'Advanced',
        _simulateFailure: true
      }
    });
    if (isOnline) {
      await syncNow();
    }
  };

  const handleSimulateStandardAction = async () => {
    await enqueueMutation({
      entityType: 'community',
      entityId: 'act-901',
      operation: 'RSVP',
      description: 'Volunteer RSVP Confirmed (Offline Action)',
      payload: {
        volunteerId: 'dev-skl-002',
        role: 'Field Rescue'
      }
    });
    if (isOnline) {
      await syncNow();
    }
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Offline Synchronization & Resilience Center"
      maxWidth="720px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
            {lastSyncTimestamp ? `Last sync: ${new Date(lastSyncTimestamp).toLocaleTimeString()}` : 'No sync recorded yet'}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" size="sm" onClick={() => clearQueue()}>
              <Trash2 size={14} />
              <span>Clear Queue</span>
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
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Connectivity Control Bar */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: isOnline ? 'var(--color-success)' : 'var(--color-warning)'
              }}
            >
              {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{connectivityState.label}</span>
                <Badge variant={isOnline ? 'success' : 'warning'}>
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </Badge>
              </div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                {isSimulatedOffline
                  ? 'Dev offline mode active. Mutations will queue locally until reconnection.'
                  : 'Ready to synchronize local optimistic actions with mock development adapter.'}
              </div>
            </div>
          </div>

          <Button
            variant={isSimulatedOffline ? 'secondary' : 'warning'}
            size="sm"
            onClick={toggleSimulatedOffline}
          >
            {isSimulatedOffline ? (
              <>
                <Wifi size={14} />
                <span>Simulate Reconnection</span>
              </>
            ) : (
              <>
                <WifiOff size={14} />
                <span>Simulate Offline Mode</span>
              </>
            )}
          </Button>
        </div>

        {/* Resolution notification */}
        {resolutionNote && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--color-success)',
              fontSize: 'var(--font-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={16} />
            <span>{resolutionNote}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'queue' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('queue')}
          >
            <Layers size={14} />
            <span>Mutation Queue ({queue.length})</span>
            {pendingCount > 0 && (
              <span
                style={{
                  background: 'var(--color-warning)',
                  color: '#000',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontSize: '10px',
                  fontWeight: 700
                }}
              >
                {pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'cache' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('cache')}
          >
            <Database size={14} />
            <span>Offline Cache</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'sim' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('sim')}
          >
            <Play size={14} />
            <span>Dev Simulation Tools</span>
          </button>
        </div>

        {/* TAB 1: MUTATION QUEUE */}
        {activeTab === 'queue' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Conflict Alert Box if any conflict exists */}
            {conflicts.length > 0 && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid var(--color-critical-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-critical)', fontWeight: 600 }}>
                  <AlertTriangle size={18} />
                  <span>Conflict Resolution Required ({conflicts.length})</span>
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                  A concurrent edit was detected between your local offline mutation and the remote server placeholder. Select which version to commit:
                </div>

                {conflicts.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{item.description}</span>
                      <Badge variant="critical">Conflict Detected</Badge>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div
                        style={{
                          background: 'rgba(255, 107, 0, 0.05)',
                          border: '1px solid rgba(255, 107, 0, 0.2)',
                          padding: '10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--font-xs)'
                        }}
                      >
                        <div style={{ fontWeight: 600, color: 'var(--color-orange-500)', marginBottom: '4px' }}>
                          Local Version (Your Device)
                        </div>
                        <pre style={{ margin: 0, fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                          {JSON.stringify(item.conflictInfo?.localVersion || item.payload, null, 2)}
                        </pre>
                      </div>

                      <div
                        style={{
                          background: 'rgba(59, 130, 246, 0.05)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          padding: '10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--font-xs)'
                        }}
                      >
                        <div style={{ fontWeight: 600, color: 'var(--color-info)', marginBottom: '4px' }}>
                          Remote Version (Server Placeholder)
                        </div>
                        <pre style={{ margin: 0, fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                          {JSON.stringify(item.conflictInfo?.remoteVersion || { note: 'Remote update' }, null, 2)}
                        </pre>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleResolveConflict(item.id, 'remote')}
                      >
                        Accept Remote Version
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleResolveConflict(item.id, 'local')}
                      >
                        Keep Local Changes
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Failed Items Banner */}
            {failedItems.length > 0 && (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid var(--color-warning-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-xs)', color: 'var(--color-warning)' }}>
                  <AlertCircle size={16} />
                  <span>{failedItems.length} mutation(s) failed after maximum retry attempts.</span>
                </div>
                <Button variant="warning" size="xs" onClick={() => retryAll()}>
                  Retry All Failed
                </Button>
              </div>
            )}

            {/* Queue Item List */}
            {queue.length === 0 ? (
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: 'var(--bg-card)',
                  border: '1px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)'
                }}
              >
                <CheckCircle2 size={36} style={{ color: 'var(--color-success)', marginBottom: '8px' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Offline Queue is Clean
                </div>
                <div style={{ fontSize: 'var(--font-xs)', maxWidth: '380px', margin: '0 auto' }}>
                  All actions have been synchronized with the local development store. Actions taken while offline will be placed here automatically.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
                {queue.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>
                          {item.description || `${item.operation} ${item.entityType}`}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {item.id}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getStatusBadge(item.status)}
                        {item.status === 'failed' && (
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => handleRetryItem(item.id)}
                          >
                            <RefreshCw size={12} />
                            <span>Retry</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <span>Entity: <strong style={{ color: 'var(--text-secondary)' }}>{item.entityType}</strong></span>
                        <span>Operation: <strong style={{ color: 'var(--text-secondary)' }}>{item.operation}</strong></span>
                        <span>Retries: <strong style={{ color: 'var(--text-secondary)' }}>{item.retryCount || 0}/{item.maxRetries || 3}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        <span>{new Date(item.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {item.error && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--color-critical)',
                          background: 'rgba(239, 68, 68, 0.08)',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        {item.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: OFFLINE CACHE INSPECTOR */}
        {activeTab === 'cache' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
              Locally cached stores available offline across Community Skill Bank domains:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {Object.entries(cacheSummary.stores || {}).map(([name, store]) => (
                <div
                  key={name}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', textTransform: 'capitalize' }}>
                      {name} Store
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {store.key}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--font-base)', color: 'var(--color-orange-500)' }}>
                      {store.count}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {(store.bytes / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                fontSize: 'var(--font-xs)',
                color: 'var(--color-success)',
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FileCheck size={16} />
              <span>All disaster response stores cached. Full offline reading and editing operational.</span>
            </div>
          </div>
        )}

        {/* TAB 3: DEV SIMULATION TOOLS */}
        {activeTab === 'sim' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
              Use these development triggers to test offline queueing, conflict resolution, and automatic retries:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>
                    Simulate Standard Offline Action
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                    Enqueues a community activity RSVP mutation to test optimistic queueing.
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={handleSimulateStandardAction}>
                  Enqueue RSVP
                </Button>
              </div>

              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--color-critical)' }}>
                    Simulate Synchronization Conflict
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                    Enqueues an emergency update that triggers a concurrent edit conflict.
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={handleSimulateConflict}>
                  Trigger Conflict
                </Button>
              </div>

              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--color-warning)' }}>
                    Simulate Network Failure & Retry
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                    Enqueues an action that fails during sync to test retry counter and failure state.
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={handleSimulateFailure}>
                  Trigger Failure
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default OfflineSyncModal;
