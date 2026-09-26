import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { connectivityService } from '../services/connectivityService.js';
import { offlineSyncService } from '../services/offlineSyncService.js';
import { offlineCacheService } from '../services/offlineCacheService.js';
import { useAuth } from './AuthContext.jsx';

const SyncContext = createContext(null);

export const SyncProvider = ({ children }) => {
  const { currentUser, role } = useAuth();

  const [connectivityState, setConnectivityState] = useState(() =>
    connectivityService.getConnectionState()
  );
  const [queue, setQueue] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState(null);
  const [cacheSummary, setCacheSummary] = useState(() =>
    offlineCacheService.getCacheSummary()
  );

  const refreshQueue = useCallback(async () => {
    try {
      const q = await offlineSyncService.getQueue({
        userId: currentUser?.id || currentUser?.email,
        role
      });
      setQueue(q);
      const count = await offlineSyncService.getPendingCount({
        userId: currentUser?.id || currentUser?.email,
        role
      });
      setPendingCount(count);
      setCacheSummary(offlineCacheService.getCacheSummary());
    } catch (err) {
      console.error('[SyncContext] Error refreshing queue:', err);
    }
  }, [currentUser, role]);

  // Subscribe to connectivity changes
  useEffect(() => {
    const unsubConnectivity = connectivityService.subscribe((state) => {
      setConnectivityState(state);
    });

    const unsubSync = offlineSyncService.subscribe(({ isSyncing: syncing, lastSyncTimestamp: lastSync }) => {
      setIsSyncing(syncing);
      if (lastSync) setLastSyncTimestamp(lastSync);
      refreshQueue();
    });

    refreshQueue();

    return () => {
      unsubConnectivity();
      unsubSync();
    };
  }, [refreshQueue]);

  const toggleSimulatedOffline = useCallback(() => {
    const nextState = connectivityService.toggleSimulatedOffline();
    setConnectivityState(nextState);
  }, []);

  const setSimulatedOffline = useCallback((offline) => {
    const nextState = connectivityService.setSimulatedOffline(offline);
    setConnectivityState(nextState);
  }, []);

  const syncNow = useCallback(async () => {
    return offlineSyncService.processQueue();
  }, []);

  const retryMutation = useCallback(async (id) => {
    return offlineSyncService.retryMutation(id);
  }, []);

  const retryAll = useCallback(async () => {
    return offlineSyncService.retryAllFailed();
  }, []);

  const resolveConflict = useCallback(async (id, choice) => {
    const res = await offlineSyncService.resolveConflict(id, choice);
    await refreshQueue();
    return res;
  }, [refreshQueue]);

  const clearQueue = useCallback(async () => {
    const res = await offlineSyncService.clearQueue();
    await refreshQueue();
    return res;
  }, [refreshQueue]);

  const enqueueMutation = useCallback(async (data) => {
    const res = await offlineSyncService.enqueueMutation({
      ...data,
      userId: data.userId || currentUser?.id || currentUser?.email || 'dev-skl-002',
      role: data.role || role || 'volunteer'
    });
    await refreshQueue();
    return res;
  }, [currentUser, role, refreshQueue]);

  const value = {
    connectivityState,
    isOnline: connectivityState.isOnline,
    browserOnline: connectivityState.browserOnline,
    isSimulatedOffline: connectivityState.isSimulatedOffline,
    connectivityStatus: connectivityState.status,
    queue,
    pendingCount,
    isSyncing,
    lastSyncTimestamp,
    cacheSummary,
    toggleSimulatedOffline,
    setSimulatedOffline,
    syncNow,
    retryMutation,
    retryAll,
    resolveConflict,
    clearQueue,
    enqueueMutation,
    refreshQueue
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};

export default SyncContext;
