/**
 * Audit Log Service (Stage 15 — Audit & Observability)
 * 
 * Provides isolated event history access, search, filtering, and detail inspection.
 * Decoupled from backend API (future: GET /api/admin/audit-logs).
 * 
 * NEVER returns passwords, JWT tokens, secrets, or sensitive credentials.
 */

import { INITIAL_DEV_AUDIT_LOGS, AUDIT_EVENT_TYPES } from '../data/devAuditLogs.js';

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

export const auditService = {
  /**
   * Retrieve all audit event records
   */
  async getAuditLogs() {
    const logs = getStoredAuditLogs();
    return logs.map(sanitizeAuditRecord);
  },

  /**
   * Retrieve single audit log by ID
   */
  async getAuditLog(id) {
    const logs = getStoredAuditLogs();
    const match = logs.find((l) => l.id === id);
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
      const actorMatch = (log.actor || '').toLowerCase().includes(q);
      const actionMatch = (log.action || '').toLowerCase().includes(q);
      const entityMatch = (log.entity || '').toLowerCase().includes(q);
      const entityIdMatch = (log.entityId || '').toLowerCase().includes(q);
      const requestMatch = (log.requestId || '').toLowerCase().includes(q);

      return actorMatch || actionMatch || entityMatch || entityIdMatch || requestMatch;
    });
  },

  /**
   * Filter audit logs by action, status, and entity
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

    return logs;
  },

  /**
   * Query logs with search, filtering, sorting, and pagination
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

    // 5. Sort by Timestamp
    logs.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortBy === 'oldest' ? timeA - timeB : timeB - timeA;
    });

    // 6. Pagination
    const totalRecords = logs.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedItems = logs.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems,
      totalRecords,
      totalPages,
      currentPage,
      pageSize
    };
  },

  /**
   * Reset audit logs to initial seed dataset
   */
  resetDevelopmentAuditLogs() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_AUDIT_LOGS));
    }
    return JSON.parse(JSON.stringify(INITIAL_DEV_AUDIT_LOGS));
  }
};

export default auditService;
