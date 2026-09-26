import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Search,
  Filter,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { auditService } from '../../services/auditService';
import { AUDIT_EVENT_TYPES } from '../../data/devAuditLogs';
import AuditDetailModal from '../../components/audit/AuditDetailModal';

const ENTITY_OPTIONS = [
  'ALL',
  'Auth',
  'User',
  'Certification',
  'Training',
  'Emergency',
  'Assignment',
  'Notification',
  'Simulation',
  'Sync'
];

/**
 * Stage 15 — Admin Audit Logs Page
 * Provides searchable, filterable, sortable, and paginated compliance event history.
 */
export const AuditLogsPage = () => {
  const [data, setData] = useState({
    items: [],
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  // Filters & Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest'
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await auditService.queryAuditLogs({
        query: searchQuery,
        action: actionFilter,
        status: statusFilter,
        entity: entityFilter,
        sortBy,
        page,
        pageSize
      });
      setData(result);
    } catch (err) {
      console.error('[AuditLogsPage] Error loading audit logs:', err);
      setError('Audit logs could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, actionFilter, statusFilter, entityFilter, sortBy, page]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  // Reset to page 1 whenever filters or search change
  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleActionChange = (val) => {
    setActionFilter(val);
    setPage(1);
  };

  const handleStatusChange = (val) => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleEntityChange = (val) => {
    setEntityFilter(val);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActionFilter('ALL');
    setStatusFilter('ALL');
    setEntityFilter('ALL');
    setSortBy('newest');
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    actionFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    entityFilter !== 'ALL' ||
    sortBy !== 'newest';

  return (
    <div className="audit-page">
      {/* Header */}
      <PageHeader
        title="Security & Audit Logs"
        subtitle="Immutable operational trail of incident command dispatches, credential approvals, role shifts, and real-time broadcasts."
        icon={<History size={24} />}
        badge={
          <Badge variant="warning" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
            Compliance & Security
          </Badge>
        }
      />

      {/* Development Telemetry Banner */}
      <div className="sim-banner">
        <div className="sim-banner-content">
          <span className="sim-banner-badge">Dev Telemetry</span>
          <span>
            Development Audit Log Adapter Active. Future backend endpoint: <code>GET /api/admin/audit-logs</code>
          </span>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="audit-toolbar">
        {/* Search */}
        <div className="audit-search-input-wrapper">
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            className="audit-search-input"
            placeholder="Search by actor, action, entity, entity ID, or request ID..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Filter Controls */}
        <div className="audit-filters-group">
          {/* Action Filter */}
          <select
            className="analytics-filter-select"
            value={actionFilter}
            onChange={(e) => handleActionChange(e.target.value)}
            aria-label="Filter by Event Action"
          >
            <option value="ALL">All Actions</option>
            {Object.values(AUDIT_EVENT_TYPES).map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="analytics-filter-select"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            aria-label="Filter by Status"
          >
            <option value="ALL">All Statuses</option>
            <option value="Success">Success</option>
            <option value="Failure">Failure</option>
          </select>

          {/* Entity Filter */}
          <select
            className="analytics-filter-select"
            value={entityFilter}
            onChange={(e) => handleEntityChange(e.target.value)}
            aria-label="Filter by Entity"
          >
            {ENTITY_OPTIONS.map((ent) => (
              <option key={ent} value={ent}>
                {ent === 'ALL' ? 'All Entities' : ent}
              </option>
            ))}
          </select>

          {/* Sorting */}
          <select
            className="analytics-filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort by Timestamp"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          {/* Clear Filters Action */}
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleResetFilters}
              title="Reset all filters"
            >
              <RotateCcw size={14} />
              <span>Clear</span>
            </button>
          )}

          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={13} className={loading ? 'spinner' : ''} />}
            onClick={loadAuditLogs}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="state-container" aria-live="polite">
          <div className="spinner" />
          <h3 className="state-title" style={{ marginTop: 'var(--space-4)' }}>
            Loading audit logs...
          </h3>
          <p className="state-description">
            Querying immutable event history and administrative actions.
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="state-container" role="alert">
          <div className="state-icon-wrapper" style={{ color: 'var(--color-critical)' }}>
            <AlertTriangle size={32} />
          </div>
          <h3 className="state-title">{error}</h3>
          <p className="state-description">
            Unable to fetch security and compliance audit records.
          </p>
          <Button variant="primary" size="sm" onClick={loadAuditLogs}>
            Retry Audit Service
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && data.items.length === 0 && (
        <div className="analytics-empty-panel">
          <History size={36} style={{ color: 'var(--text-muted)' }} />
          <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>
            No audit events found.
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-xs)', margin: 0 }}>
            {hasActiveFilters
              ? 'No audit records match the current filter criteria.'
              : 'Audit history is currently clean with zero recorded events.'}
          </p>
          {hasActiveFilters && (
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCcw size={14} />}
              onClick={handleResetFilters}
              style={{ marginTop: 'var(--space-2)' }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Loaded Table */}
      {!loading && !error && data.items.length > 0 && (
        <div className="audit-table-card">
          <div className="audit-table-wrapper">
            <table className="audit-table" aria-label="Audit Event Log Table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Entity ID</th>
                  <th>Status</th>
                  <th>Request ID</th>
                  <th style={{ textAlign: 'right' }}>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((log) => {
                  const isSuccess = log.status === 'Success';
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      title="Click to inspect audit event details"
                    >
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {log.actor}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--color-orange-400)' }}>
                          {log.action}
                        </span>
                      </td>
                      <td>{log.entity}</td>
                      <td>
                        <span className="audit-code-pill" title={log.entityId}>
                          {log.entityId}
                        </span>
                      </td>
                      <td>
                        <Badge variant={isSuccess ? 'success' : 'danger'}>
                          {log.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td>
                        <span className="audit-code-pill" title={log.requestId}>
                          {log.requestId}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          icon={<Eye size={13} />}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="audit-pagination-bar">
            <span>
              Showing records {(data.currentPage - 1) * pageSize + 1}–
              {Math.min(data.currentPage * pageSize, data.totalRecords)} of{' '}
              <strong>{data.totalRecords}</strong> events
            </span>

            <div className="audit-pagination-actions">
              <Button
                variant="outline"
                size="sm"
                icon={<ChevronLeft size={14} />}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.currentPage <= 1}
              >
                Previous
              </Button>

              <span style={{ padding: '0 var(--space-2)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                Page {data.currentPage} of {data.totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                icon={<ChevronRight size={14} />}
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={data.currentPage >= data.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <AuditDetailModal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        log={selectedLog}
      />
    </div>
  );
};

export default AuditLogsPage;
