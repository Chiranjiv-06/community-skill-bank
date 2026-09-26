/**
 * Offline Synchronization Service (Stage 11 — Offline Sync)
 * 
 * Manages the offline mutation queue, optimistic local mutations,
 * controlled retries, conflict detection/resolution, and synchronization lifecycles.
 * 
 * PERSISTENCE:
 * - Uses localStorage key "csb_offline_mutation_queue"
 * - Survives browser refreshes and tab reloads
 * 
 * ARCHITECTURE:
 * UI -> Domain Services -> offlineSyncService -> syncAdapter -> (Mock Dev Endpoint)
 */

import {
  INITIAL_DEV_MUTATIONS,
  SYNC_STATUSES,
  CONNECTIVITY_STATUSES
} from '../data/devSync.js';
import { connectivityService } from './connectivityService.js';
import { syncAdapter } from './syncAdapter.js';

const STORAGE_KEY = 'csb_offline_mutation_queue';

let isSyncing = false;
let lastSyncTimestamp = null;
const subscribers = new Set();

/**
 * Safely read mutation queue from localStorage
 */
const getStoredQueue = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_MUTATIONS));
      return JSON.parse(JSON.stringify(INITIAL_DEV_MUTATIONS));
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[offlineSyncService] Error reading queue from storage, resetting:', err);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_MUTATIONS));
    return JSON.parse(JSON.stringify(INITIAL_DEV_MUTATIONS));
  }
};

/**
 * Safely persist mutation queue to localStorage
 */
const setStoredQueue = (queue) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('[offlineSyncService] Error persisting queue to storage:', err);
  }
};

const notifySubscribers = (event = {}) => {
  const queue = getStoredQueue();
  subscribers.forEach((cb) => {
    try {
      cb({ queue, event, isSyncing, lastSyncTimestamp });
    } catch (err) {
      console.error('[offlineSyncService] Error in subscriber:', err);
    }
  });
};

export const offlineSyncService = {
  /**
   * Subscribe to queue and synchronization changes
   * @param {Function} callback
   * @returns {Function} unsubscribe function
   */
  subscribe(callback) {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  },

  /**
   * Get the current mutation queue with optional role and status filters
   */
  async getQueue(options = {}) {
    const { status = null, entityType = null, userId = null, role = null } = options;
    let list = getStoredQueue();

    if (status) {
      list = list.filter((m) => m.status === status);
    }
    if (entityType) {
      list = list.filter((m) => m.entityType === entityType);
    }
    if (userId) {
      list = list.filter((m) => m.userId === userId || m.userId === 'all');
    }
    if (role && role !== 'all') {
      list = list.filter((m) => m.role === role || m.role === 'all');
    }

    return JSON.parse(JSON.stringify(list));
  },

  /**
   * Get pending mutation count
   */
  async getPendingCount(options = {}) {
    const queue = await this.getQueue(options);
    return queue.filter(
      (m) =>
        m.status === SYNC_STATUSES.PENDING ||
        m.status === SYNC_STATUSES.FAILED ||
        m.status === SYNC_STATUSES.CONFLICT
    ).length;
  },

  /**
   * Enqueue a new mutation
   */
  async enqueueMutation(data) {
    const {
      entityType,
      entityId,
      operation,
      description = null,
      payload = {},
      userId = 'dev-skl-002',
      role = 'volunteer',
      maxRetries = 3
    } = data;

    if (!entityType || !operation) {
      throw new Error('entityType and operation are required to enqueue a mutation.');
    }

    const queue = getStoredQueue();
    const newMutation = {
      id: `mut-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      entityType,
      entityId: entityId || null,
      operation,
      description: description || `${operation} ${entityType}${entityId ? ` (${entityId})` : ''}`,
      payload: JSON.parse(JSON.stringify(payload)),
      createdAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries,
      status: SYNC_STATUSES.PENDING,
      syncedAt: null,
      userId,
      role,
      error: null,
      conflictInfo: null
    };

    queue.unshift(newMutation);
    setStoredQueue(queue);
    notifySubscribers({ type: 'MUTATION_ENQUEUED', mutation: newMutation });

    // If online, trigger auto-sync
    if (connectivityService.isOnline() && !isSyncing) {
      this.processQueue().catch(() => {});
    }

    return JSON.parse(JSON.stringify(newMutation));
  },

  /**
   * Remove a mutation by ID
   */
  async removeMutation(id) {
    const queue = getStoredQueue();
    const filtered = queue.filter((m) => m.id !== id);
    if (filtered.length === queue.length) return false;

    setStoredQueue(filtered);
    notifySubscribers({ type: 'MUTATION_REMOVED', id });
    return true;
  },

  /**
   * Process the queued mutations through the development synchronization adapter
   */
  async processQueue() {
    if (!connectivityService.isOnline()) {
      return { success: false, reason: 'offline', processedCount: 0 };
    }
    if (isSyncing) {
      return { success: false, reason: 'already_syncing', processedCount: 0 };
    }

    isSyncing = true;
    connectivityService.setConnectivityStatus(CONNECTIVITY_STATUSES.SYNCING);
    notifySubscribers({ type: 'SYNC_STARTED' });

    const queue = getStoredQueue();
    let processedCount = 0;
    let failedCount = 0;
    let conflictCount = 0;

    for (let i = 0; i < queue.length; i++) {
      const mutation = queue[i];

      // Only process pending or retryable items
      if (mutation.status !== SYNC_STATUSES.PENDING && mutation.status !== SYNC_STATUSES.FAILED) {
        continue;
      }

      mutation.status = SYNC_STATUSES.SYNCING;
      setStoredQueue(queue);
      notifySubscribers({ type: 'MUTATION_SYNCING', mutationId: mutation.id });

      try {
        const result = await syncAdapter.processMutation(mutation);

        if (result.conflict) {
          // Conflict detected
          mutation.status = SYNC_STATUSES.CONFLICT;
          mutation.conflictInfo = result.conflictInfo;
          mutation.error = result.error;
          conflictCount++;
        } else if (result.success) {
          // Successfully synchronized
          mutation.status = SYNC_STATUSES.SYNCED;
          mutation.syncedAt = result.syncedAt || new Date().toISOString();
          mutation.error = null;
          processedCount++;
        } else {
          // Sync failure
          mutation.retryCount = (mutation.retryCount || 0) + 1;
          mutation.error = result.error || 'Synchronization failed.';
          if (mutation.retryCount >= (mutation.maxRetries || 3)) {
            mutation.status = SYNC_STATUSES.FAILED;
          } else {
            mutation.status = SYNC_STATUSES.PENDING;
          }
          failedCount++;
        }
      } catch (err) {
        mutation.retryCount = (mutation.retryCount || 0) + 1;
        mutation.error = err.message || 'Unknown synchronization error';
        if (mutation.retryCount >= (mutation.maxRetries || 3)) {
          mutation.status = SYNC_STATUSES.FAILED;
        } else {
          mutation.status = SYNC_STATUSES.PENDING;
        }
        failedCount++;
      }

      setStoredQueue(queue);
    }

    isSyncing = false;
    lastSyncTimestamp = new Date().toISOString();

    const finalStatus =
      failedCount > 0 || conflictCount > 0
        ? CONNECTIVITY_STATUSES.SYNC_FAILED
        : CONNECTIVITY_STATUSES.SYNC_COMPLETED;

    connectivityService.setConnectivityStatus(finalStatus);

    notifySubscribers({
      type: 'SYNC_FINISHED',
      processedCount,
      failedCount,
      conflictCount
    });

    return {
      success: failedCount === 0 && conflictCount === 0,
      processedCount,
      failedCount,
      conflictCount
    };
  },

  /**
   * Retry a specific failed mutation
   */
  async retryMutation(id) {
    const queue = getStoredQueue();
    const index = queue.findIndex((m) => m.id === id);
    if (index === -1) throw new Error(`Mutation with ID "${id}" not found.`);

    queue[index].status = SYNC_STATUSES.PENDING;
    queue[index].error = null;
    setStoredQueue(queue);

    notifySubscribers({ type: 'MUTATION_RETRIED', id });
    return this.processQueue();
  },

  /**
   * Retry all failed mutations in the queue
   */
  async retryAllFailed() {
    const queue = getStoredQueue();
    queue.forEach((m) => {
      if (m.status === SYNC_STATUSES.FAILED) {
        m.status = SYNC_STATUSES.PENDING;
        m.error = null;
      }
    });

    setStoredQueue(queue);
    notifySubscribers({ type: 'ALL_FAILED_RETRIED' });
    return this.processQueue();
  },

  /**
   * Resolve a mutation conflict
   * @param {string} id - Mutation ID
   * @param {string} resolutionChoice - 'local' | 'remote'
   */
  async resolveConflict(id, resolutionChoice) {
    const queue = getStoredQueue();
    const index = queue.findIndex((m) => m.id === id);
    if (index === -1) throw new Error(`Mutation with ID "${id}" not found.`);

    const mutation = queue[index];
    if (mutation.status !== SYNC_STATUSES.CONFLICT) {
      throw new Error(`Mutation "${id}" is not in conflict state.`);
    }

    if (resolutionChoice === 'local') {
      // Keep local version: clear simulation conflict flag and force synced
      if (mutation.payload && mutation.payload._simulateConflict) {
        delete mutation.payload._simulateConflict;
      }
      mutation.status = SYNC_STATUSES.SYNCED;
      mutation.syncedAt = new Date().toISOString();
      if (mutation.conflictInfo) {
        mutation.conflictInfo.resolutionStatus = 'resolved_local';
      }
      mutation.error = null;
    } else if (resolutionChoice === 'remote') {
      // Discard local version, accept remote placeholder
      mutation.status = SYNC_STATUSES.SYNCED;
      mutation.syncedAt = new Date().toISOString();
      if (mutation.conflictInfo) {
        mutation.conflictInfo.resolutionStatus = 'resolved_remote';
      }
      mutation.error = null;
    } else {
      throw new Error(`Invalid resolution choice: "${resolutionChoice}". Must be "local" or "remote".`);
    }

    setStoredQueue(queue);
    notifySubscribers({ type: 'CONFLICT_RESOLVED', id, choice: resolutionChoice });
    return JSON.parse(JSON.stringify(mutation));
  },

  /**
   * Clear all mutations or reset to clean development initial state
   */
  async clearQueue(includeSyncedOnly = false) {
    if (includeSyncedOnly) {
      const queue = getStoredQueue();
      const pending = queue.filter((m) => m.status !== SYNC_STATUSES.SYNCED);
      setStoredQueue(pending);
    } else {
      setStoredQueue([]);
    }
    notifySubscribers({ type: 'QUEUE_CLEARED' });
    return { success: true };
  },

  /**
   * Reset development mutation queue to initial seed
   */
  resetDevelopmentQueue() {
    setStoredQueue(INITIAL_DEV_MUTATIONS);
    notifySubscribers({ type: 'QUEUE_RESET' });
    return JSON.parse(JSON.stringify(INITIAL_DEV_MUTATIONS));
  }
};

// Automatic Reconnection Listener:
// When connectivity returns (offline -> online), automatically process queued mutations
if (typeof window !== 'undefined') {
  connectivityService.subscribe((state) => {
    if (state.isOnline) {
      offlineSyncService.processQueue().catch((err) => {
        console.warn('[offlineSyncService] Auto-sync on reconnection failed:', err);
      });
    }
  });
}

export default offlineSyncService;
