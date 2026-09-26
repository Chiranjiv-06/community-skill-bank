/**
 * Offline Data Cache Service (Stage 11)
 * 
 * Provides unified inspection and validation of locally cached domain data
 * to ensure robust offline read/write capability across disaster response modules.
 * 
 * Reuses existing domain storage keys:
 * - csb_dev_user
 * - csb_dev_skills
 * - csb_dev_emergencies
 * - csb_dev_assignments
 * - csb_dev_certifications
 * - csb_dev_activities
 * - csb_dev_notifications
 * - csb_offline_mutation_queue
 */

const CACHE_STORES = {
  USER: 'csb_dev_user',
  SKILLS: 'csb_dev_skills',
  EMERGENCIES: 'csb_dev_emergencies',
  ASSIGNMENTS: 'csb_dev_assignments',
  CERTIFICATIONS: 'csb_dev_certifications',
  ACTIVITIES: 'csb_dev_activities',
  NOTIFICATIONS: 'csb_dev_notifications',
  MUTATIONS: 'csb_offline_mutation_queue',
  KNOWLEDGE: 'csb_dev_knowledge',
  ANALYTICS: 'csb_dev_analytics',
  SIMULATIONS: 'csb_dev_simulations',
  AUDIT_LOGS: 'csb_dev_audit_logs',
  METRICS: 'csb_dev_metrics'
};

export const offlineCacheService = {
  /**
   * Return telemetry summary of all cached entities in localStorage
   */
  getCacheSummary() {
    const summary = {};
    let totalBytes = 0;

    Object.entries(CACHE_STORES).forEach(([domain, key]) => {
      try {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
        if (raw) {
          const parsed = JSON.parse(raw);
          const count = Array.isArray(parsed) ? parsed.length : 1;
          const bytes = raw.length * 2; // approx UTF-16
          totalBytes += bytes;
          summary[domain.toLowerCase()] = {
            key,
            count,
            bytes,
            isCached: true
          };
        } else {
          summary[domain.toLowerCase()] = {
            key,
            count: 0,
            bytes: 0,
            isCached: false
          };
        }
      } catch (_) {
        summary[domain.toLowerCase()] = {
          key,
          count: 0,
          bytes: 0,
          isCached: false
        };
      }
    });

    return {
      stores: summary,
      totalBytes,
      isCacheAvailable: true,
      lastInspected: new Date().toISOString()
    };
  },

  /**
   * Verify if a specific entity is cached locally
   */
  hasCachedData(storeKey) {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(storeKey) : null;
      return Boolean(raw);
    } catch (_) {
      return false;
    }
  },

  /**
   * Read raw cache value for a store
   */
  readCache(storeKey) {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(storeKey) : null;
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }
};

export default offlineCacheService;
