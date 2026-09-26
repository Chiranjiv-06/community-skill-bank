/**
 * Connectivity Service (Stage 11 — Offline Sync)
 * 
 * Manages browser connectivity detection, mock offline simulation,
 * and connection lifecycle states (online, offline, reconnecting, syncing, sync_completed, sync_failed).
 * 
 * IMPORTANT:
 * Distinguishes native browser network availability (navigator.onLine)
 * from future backend synchronization connectivity (Stage 17 final integration).
 */

import { CONNECTIVITY_STATUSES } from '../data/devSync.js';

let isSimulatedOffline = false;
let currentStatus = CONNECTIVITY_STATUSES.ONLINE;
let lastStateChange = new Date().toISOString();
const subscribers = new Set();

/**
 * Determine if the application should behave as online
 */
const checkIsOnline = () => {
  if (isSimulatedOffline) return false;
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine;
  }
  return true;
};

// Initialize listeners if in browser environment
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (!isSimulatedOffline) {
      connectivityService.setConnectivityStatus(CONNECTIVITY_STATUSES.RECONNECTING);
      setTimeout(() => {
        connectivityService.setConnectivityStatus(CONNECTIVITY_STATUSES.ONLINE);
      }, 600);
    }
  });

  window.addEventListener('offline', () => {
    connectivityService.setConnectivityStatus(CONNECTIVITY_STATUSES.OFFLINE);
  });
}

export const connectivityService = {
  /**
   * Check if online (combining browser state and dev simulation)
   */
  isOnline() {
    return checkIsOnline();
  },

  /**
   * Check if dev offline simulation is active
   */
  isSimulated() {
    return isSimulatedOffline;
  },

  /**
   * Read full connectivity telemetry
   */
  getConnectionState() {
    const online = checkIsOnline();
    const browserOnline =
      typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
        ? navigator.onLine
        : true;

    let label = 'Online (Development Mode)';
    if (currentStatus === CONNECTIVITY_STATUSES.OFFLINE) {
      label = isSimulatedOffline ? 'Simulated Offline Mode' : 'Network Disconnected';
    } else if (currentStatus === CONNECTIVITY_STATUSES.RECONNECTING) {
      label = 'Reconnecting to Local Mesh...';
    } else if (currentStatus === CONNECTIVITY_STATUSES.SYNCING) {
      label = 'Synchronizing Queued Actions...';
    } else if (currentStatus === CONNECTIVITY_STATUSES.SYNC_COMPLETED) {
      label = 'Sync Completed Successfully';
    } else if (currentStatus === CONNECTIVITY_STATUSES.SYNC_FAILED) {
      label = 'Sync Failed (Pending Retry)';
    }

    return {
      status: online ? (currentStatus === CONNECTIVITY_STATUSES.OFFLINE ? CONNECTIVITY_STATUSES.ONLINE : currentStatus) : CONNECTIVITY_STATUSES.OFFLINE,
      isOnline: online,
      browserOnline,
      isSimulatedOffline,
      isDevelopment: true,
      lastStateChange,
      label
    };
  },

  /**
   * Update connectivity state and notify listeners
   */
  setConnectivityStatus(status) {
    currentStatus = status;
    lastStateChange = new Date().toISOString();
    this.notifySubscribers();
    return this.getConnectionState();
  },

  /**
   * Enable/disable simulated offline mode for testing
   */
  setSimulatedOffline(offline) {
    isSimulatedOffline = Boolean(offline);
    if (isSimulatedOffline) {
      this.setConnectivityStatus(CONNECTIVITY_STATUSES.OFFLINE);
    } else {
      this.setConnectivityStatus(CONNECTIVITY_STATUSES.RECONNECTING);
      setTimeout(() => {
        this.setConnectivityStatus(CONNECTIVITY_STATUSES.ONLINE);
      }, 400);
    }
    return this.getConnectionState();
  },

  /**
   * Toggle simulated offline state
   */
  toggleSimulatedOffline() {
    return this.setSimulatedOffline(!isSimulatedOffline);
  },

  /**
   * Subscribe to connectivity updates
   * @param {Function} callback
   * @returns {Function} unsubscribe function
   */
  subscribe(callback) {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  },

  notifySubscribers() {
    const state = this.getConnectionState();
    subscribers.forEach((cb) => {
      try {
        cb(state);
      } catch (err) {
        console.error('[connectivityService] Error in subscriber:', err);
      }
    });
  }
};

export default connectivityService;
