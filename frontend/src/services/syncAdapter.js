/**
 * Development Synchronization Adapter (Stage 11)
 * 
 * Simulates the synchronization boundary between the frontend mutation queue
 * and the future backend endpoints (to be integrated in Stage 17).
 * 
 * Architecture:
 * UI -> Domain Service -> Offline Sync Service -> Mutation Queue -> Development Sync Adapter
 * 
 * Future Production:
 * UI -> Domain Service -> Offline Sync Service -> Mutation Queue -> FastAPI / PostgreSQL
 * 
 * DO NOT connect to real backend or create HTTP endpoints.
 */

import { CONFLICT_TYPES } from '../data/devSync.js';

export const syncAdapter = {
  /**
   * Process and synchronize a single queued mutation
   * @param {Object} mutation - Queued mutation descriptor
   * @returns {Promise<Object>} Sync resolution result
   */
  async processMutation(mutation) {
    // Artificial latency for realistic async feel in browser; 0ms in test environment
    const latency = typeof window !== 'undefined' ? 80 : 0;
    if (latency > 0) {
      await new Promise((resolve) => setTimeout(resolve, latency));
    }

    const { entityType, entityId, operation, payload } = mutation;

    // Check for simulated conflict trigger
    if (payload && payload._simulateConflict) {
      return {
        success: false,
        conflict: true,
        conflictInfo: {
          conflictType: CONFLICT_TYPES.CONCURRENT_UPDATE,
          localVersion: { ...payload },
          remoteVersion: {
            ...payload,
            updatedBy: 'Incident Commander Sarah Vance',
            remoteNote: 'Remote record modified on server placeholder during offline window.',
            remoteTimestamp: new Date().toISOString()
          },
          entity: { entityType, entityId },
          resolutionStatus: 'pending_resolution'
        },
        error: 'Conflict detected: Concurrent modification occurred on remote server placeholder.'
      };
    }

    // Check for simulated transient failure trigger
    if (payload && payload._simulateFailure) {
      return {
        success: false,
        conflict: false,
        retryable: true,
        error: 'Simulated Network Disruption: Gateway timeout during development sync adapter processing.'
      };
    }

    // Standard successful sync processing
    return {
      success: true,
      syncedAt: new Date().toISOString(),
      entityType,
      entityId,
      operation
    };
  }
};

export default syncAdapter;
