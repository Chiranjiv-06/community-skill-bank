/**
 * Audit Log Service (Stage 15 — Audit & Observability)
 * 
 * Provides isolated event history access, search, filtering, and detail inspection.
 * Backend API Integration:
 * - GET /api/admin/audit-logs
 * 
 * NEVER returns passwords, JWT tokens, secrets, or sensitive credentials.
 */

import { INITIAL_DEV_AUDIT_LOGS, AUDIT_EVENT_TYPES } from '../data/devAuditLogs.js';
import api from './api.js';

const STORAGE_KEY = 'csb_dev_audit_logs';

/**
 * Safely retrieve audit logs from storage
 */
const getStoredAuditLogs = () => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_AUDIT_LOGS));
      }
      return JSON.parse(JSON.stringify(INITIAL_DEV_AUDIT_LOGS));
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[auditService] Error reading cached audit logs, using fallback:', err);
    return JSON.parse(JSON.stringify(INITIAL_DEV_AUDIT_LOGS));
  }
};

/**
 * Sanitize an audit log to ensure no credentials or secrets are present
 */
const sanitizeAuditRecord = (record) => {
  if (!record) return null;
  const clone = JSON.parse(JSON.stringify(record));

  if (clone.metadata) {
    delete clone.metadata.password;
    delete clone.metadata.token;
    delete clone.metadata.jwt;
    delete clone.metadata.secret;
    delete clone.metadata.apiKey;
    delete clone.metadata.stackTrace;
  }

  return clone;
};

/**
 * Normalize backend audit log into frontend model
 */
const normalizeBackendAuditLog = (log) => {
  if (!log) return null;
  const entityMap = {
    simulation_scenario: 'Simulation',
    emergency: 'Emergency',
    assignment: 'Assignment',
    user: 'User',
    certification: 'Certification',
    training: 'Training',
    notification: 'Notification',
    sync: 'Sync',
    auth: 'Auth'
  };

  const entity = entityMap[log.entity_type] || 
    (log.entity_type ? log.entity_type.charAt(0).toUpperCase() + log.entity_type.slice(1) : 'System');

  const status = (log.outcome === 'success' || log.outcome === 'Success') ? 'Success' : 'Failed';

  return sanitizeAuditRecord({
    id: String(log.id),
    timestamp: log.timestamp || new Date().toISOString(),
    actor: log.actor_email || log.actor_name || (log.actor_user_id ? `User #${log.actor_user_id}` : 'System'),
    action: log.action || AUDIT_EVENT_TYPES.SYSTEM_HEARTBEAT,
    entity: entity,
    entityId: log.entity_id != null ? String(log.entity_id) : '-',
    status: status,
    requestId: log.request_id || `req-${log.id}`,
    metadata: log.metadata_json || {}
  });
};

export const auditService = {
  /**
   * Retrieve all audit event records
   */
  async getAuditLogs() {
    if (typeof api !== 'undefined' && api?.getToken?.()) {
      try {
        const res = await api.get('/api/admin/audit-logs?limit=100');
        if (res && Array.isArray(res.logs) && res.logs.length > 0) {
          const normalized = res.logs.map(normalizeBackendAuditLog);
          return normalized;
        }
      } catch (err) {
        console.warn('[auditService] Live /api/admin/audit-logs failed, fallback to local storage:', err?.message || err);
      }
    }

    const logs = getStoredAuditLogs();
    return logs.map(sanitizeAuditRecord);
  },

  /**
   * Retrieve single audit log by ID
   */
  async getAuditLog(id) {
    const logs = await this.getAuditLogs();
    const match = logs.find((l) => String(l.id) === String(id));
    if (!match) {
      throw new Error(`Audit record not found: ${id}`);
    }
    return sanitizeAuditRecord(match);
  },

  /**
   * Search audit logs across actor, action, entity, entityId, requestId
   */
  async searchAuditLogs(query = '') {
    const logs = await this.getAuditLogs();
    if (!query || !query.trim()) {
      return logs;
    }

    const q = query.trim().toLowerCase();
    return logs.filter((log) => {
      return (
        (log.actor || '').toLowerCase().includes(q) ||
        (log.action || '').toLowerCase().includes(q) ||
        (log.entity || '').toLowerCase().includes(q) ||
        (log.entityId || '').toLowerCase().includes(q) ||
        (log.requestId || '').toLowerCase().includes(q)
      );
    });
  },

  /**
   * Filter audit logs by criteria
   */
  async filterAuditLogs(filters = {}) {
    let logs = await this.getAuditLogs();

    if (filters.action && filters.action !== 'ALL') {
      logs = logs.filter((l) => l.action === filters.action);
    }

    if (filters.status && filters.status !== 'ALL') {
      logs = logs.filter((l) => l.status.toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.entity && filters.entity !== 'ALL') {
      logs = logs.filter((l) => l.entity.toLowerCase() === filters.entity.toLowerCase());
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      logs = logs.filter((l) => new Date(l.timestamp).getTime() >= start);
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime();
      logs = logs.filter((l) => new Date(l.timestamp).getTime() <= end);
    }

    return logs;
  },

  /**
   * Complex query: Search, Filter, Sort, Paginate
   */
  async queryAuditLogs({
    query = '',
    action = 'ALL',
    status = 'ALL',
    entity = 'ALL',
    sortBy = 'newest', // 'newest' | 'oldest'
    page = 1,
    pageSize = 8
  } = {}) {
    let logs = await this.getAuditLogs();

    // 1. Search
    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      logs = logs.filter((log) => {
        return (
          (log.actor || '').toLowerCase().includes(q) ||
          (log.action || '').toLowerCase().includes(q) ||
          (log.entity || '').toLowerCase().includes(q) ||
          (log.entityId || '').toLowerCase().includes(q) ||
          (log.requestId || '').toLowerCase().includes(q)
        );
      });
    }

    // 2. Filter Action
    if (action && action !== 'ALL') {
      logs = logs.filter((l) => l.action === action);
    }

    // 3. Filter Status
    if (status && status !== 'ALL') {
      logs = logs.filter((l) => l.status.toLowerCase() === status.toLowerCase());
    }

    // 4. Filter Entity
    if (entity && entity !== 'ALL') {
      logs = logs.filter((l) => l.entity.toLowerCase() === entity.toLowerCase());
    }

    // 5. Sort
    logs.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortBy === 'oldest' ? timeA - timeB : timeB - timeA;
    });

    // 6. Pagination
    const totalRecords = logs.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedRecords = logs.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedRecords,
      records: paginatedRecords,
      logs: paginatedRecords,
      totalRecords,
      totalPages,
      currentPage,
      pageSize
    };
  },

  /**
   * Reset audit log store to seed data
   */
  resetDevelopmentAuditLogs() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_AUDIT_LOGS));
    }
    return JSON.parse(JSON.stringify(INITIAL_DEV_AUDIT_LOGS));
  }
};

export default auditService;
