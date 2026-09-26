/**
 * Offline Sync Service Boundary (Stage 11)
 * 
 * Provides unified interface for connectivity checks, queued mutations,
 * and background synchronization.
 */

import { connectivityService } from './connectivityService.js';
import { offlineSyncService } from './offlineSyncService.js';
import { syncAdapter } from './syncAdapter.js';

export const syncService = {
  isOnline() {
    return connectivityService.isOnline();
  },

  getConnectionState() {
    return connectivityService.getConnectionState();
  },

  async getSyncQueue(options = {}) {
    return offlineSyncService.getQueue(options);
  },

  async getPendingCount(options = {}) {
    return offlineSyncService.getPendingCount(options);
  },

  async syncPendingActions() {
    return offlineSyncService.processQueue();
  },

  async enqueueAction(data) {
    return offlineSyncService.enqueueMutation(data);
  },

  async retryAction(id) {
    return offlineSyncService.retryMutation(id);
  },

  async resolveConflict(id, choice) {
    return offlineSyncService.resolveConflict(id, choice);
  },

  async clearQueue() {
    return offlineSyncService.clearQueue();
  }
};

export { connectivityService, offlineSyncService, syncAdapter };
export default syncService;
