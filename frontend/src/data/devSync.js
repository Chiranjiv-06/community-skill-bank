/**
 * Isolated Development Data for Stage 11 — Offline Sync
 * 
 * Provides taxonomy, status enumerations, and seed mutation fixtures
 * for testing offline queueing, synchronization, conflict resolution, and retry loops.
 */

export const CONNECTIVITY_STATUSES = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  RECONNECTING: 'reconnecting',
  SYNCING: 'syncing',
  SYNC_COMPLETED: 'sync_completed',
  SYNC_FAILED: 'sync_failed'
};

export const SYNC_STATUSES = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  FAILED: 'failed',
  CONFLICT: 'conflict'
};

export const MUTATION_OPERATIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  RESPOND: 'RESPOND',
  RSVP: 'RSVP',
  VERIFY: 'VERIFY'
};

export const ENTITY_TYPES = {
  PROFILE: 'profile',
  SKILL: 'skill',
  EMERGENCY: 'emergency',
  ASSIGNMENT: 'assignment',
  COMMUNITY: 'community',
  CERTIFICATION: 'certification',
  NOTIFICATION: 'notification'
};

export const CONFLICT_TYPES = {
  CONCURRENT_UPDATE: 'CONCURRENT_UPDATE',
  STALE_DATA: 'STALE_DATA',
  VERSION_MISMATCH: 'VERSION_MISMATCH'
};

export const INITIAL_DEV_MUTATIONS = [
  {
    id: 'mut-101',
    entityType: 'emergency',
    entityId: 'emg-501',
    operation: 'UPDATE',
    description: 'Updated field staging notes for Urban Flash Flooding (Sector 4)',
    payload: {
      stagingArea: 'Sector 4 North Bridge - Staging Depot Delta',
      notes: 'Water levels steady. Additional sandbags deployed at levee crest.'
    },
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    retryCount: 0,
    maxRetries: 3,
    status: 'synced',
    syncedAt: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
    userId: 'admin@skillbank.org',
    role: 'admin',
    error: null,
    conflictInfo: null
  },
  {
    id: 'mut-102',
    entityType: 'skill',
    entityId: 'skl-002',
    operation: 'UPDATE',
    description: 'Updated proficiency for High-Angle Rope Rescue to Expert',
    payload: {
      proficiency: 'Expert',
      yearsExperience: 6
    },
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    retryCount: 0,
    maxRetries: 3,
    status: 'pending',
    syncedAt: null,
    userId: 'dev-skl-002',
    role: 'volunteer',
    error: null,
    conflictInfo: null
  }
];

export default {
  CONNECTIVITY_STATUSES,
  SYNC_STATUSES,
  MUTATION_OPERATIONS,
  ENTITY_TYPES,
  CONFLICT_TYPES,
  INITIAL_DEV_MUTATIONS
};
