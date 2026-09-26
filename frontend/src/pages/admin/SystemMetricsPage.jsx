import React, { useState, useEffect, useCallback } from 'react';
import {
  Gauge,
  Activity,
  AlertTriangle,
  Clock,
  Radio,
  RefreshCw,
  Cpu,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Server,
  Zap,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { metricsService } from '../../services/metricsService';
import AreaTrendChart from '../../components/analytics/AreaTrendChart';
import BarChart from '../../components/analytics/BarChart';

/**
 * Stage 15 — Admin System Metrics & Observability Dashboard
 * Displays operational telemetry across 6 required categories:
 * 1. Requests
 * 2. Errors
 * 3. Latency
 * 4. WebSockets
 * 5. Sync Conflicts
 * 6. Simulation Runs
 * plus overall development Health status.
 */
export const SystemMetricsPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadMetrics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await metricsService.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('[SystemMetricsPage] Error loading metrics:', err);
      setError('System metrics could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return (
    <div className="metrics-page">
      {/* Page Header */}
      <PageHeader
        title="System Metrics & Observability"
        subtitle="Infrastructure telemetry, API traffic, error rates, service latency, WebSocket events, and offline sync health."
        icon={<Gauge size={24} />}
        badge={
          <Badge variant="warning" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
            Infrastructure Health
          </Badge>
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} className={refreshing ? 'spinner' : ''} />}
            onClick={() => loadMetrics(true)}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Metrics'}
          </Button>
        }
      />

      {/* Observability Development Notice */}
      <div className="sim-banner">
        <div className="sim-banner-content">
          <span className="sim-banner-badge">Observability</span>
          <span>
            Development Telemetry Boundary Active — Mock metrics for testing and readiness modeling. Future endpoints: <code>GET /api/admin/metrics/health</code> and <code>/ready</code>.
          </span>
        </div>
        {metrics?.health?.lastCheck && (
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
            Sampled: {new Date(metrics.health.lastCheck).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="state-container" aria-live="polite">
          <div className="spinner" />
          <h3 className="state-title" style={{ marginTop: 'var(--space-4)' }}>
            Loading system metrics...
          </h3>
          <p className="state-description">
            Sampling operational service health, latency benchmarks, and error rates.
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
            Unable to sample system metrics from development telemetry provider.
          </p>
          <Button variant="primary" size="sm" onClick={() => loadMetrics(false)}>
            Retry System Metrics
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && !metrics && (
        <div className="analytics-empty-panel">
          <Gauge size={36} style={{ color: 'var(--text-muted)' }} />
          <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>
            No system metrics available.
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-xs)', margin: 0 }}>
            System metric telemetry is not emitting data at this time.
          </p>
        </div>
      )}

      {/* Loaded Metrics Dashboard */}
      {!loading && !error && metrics && (
        <>
          {/* =========================================================
              SECTION 21: OVERALL SYSTEM HEALTH STATUS
              ========================================================= */}
          <div className="health-status-card">
            <div className="health-status-top">
              <div className="health-status-title-row">
                <div
                  className={`health-status-dot ${
                    metrics.health.status === 'Degraded'
                      ? 'degraded'
                      : metrics.health.status === 'Unavailable'
                      ? 'unavailable'
                      : ''
                  }`}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 800, color: 'var(--text-primary)' }}>
                    System Status: {metrics.health.status}
                  </h3>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                    Uptime: {metrics.health.uptimePercentage}% ({(metrics.health.uptimeSeconds / 86400).toFixed(1)} days continuous operation)
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Badge variant={metrics.health.status === 'Healthy' ? 'success' : 'warning'}>
                  {metrics.health.status.toUpperCase()}
                </Badge>
                <span className="sim-chip">
                  Readiness: <strong>Ready</strong>
                </span>
              </div>
            </div>

            {/* Subsystem Health Pills */}
            <div className="health-components-grid">
              {metrics.health.components.map((comp, idx) => (
                <div key={idx} className="health-component-pill">
                  <span className="health-component-name">{comp.name}</span>
                  <span className="health-component-latency">{comp.latencyMs} ms</span>
                </div>
              ))}
            </div>
          </div>

          {/* =========================================================
              SECTION 13: 6 REQUIRED METRIC KPI CARDS
              ========================================================= */}
          <div className="analytics-kpi-grid">
            {/* 1. Requests */}
            <div className="kpi-card" style={{ '--kpi-accent-color': 'var(--color-info)' }}>
              <div className="kpi-card-header">
                <span className="kpi-card-title">API Requests</span>
                <div className="kpi-card-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--color-info)' }}>
                  <Activity size={18} />
                </div>
              </div>
              <div className="kpi-card-body">
                <span className="kpi-card-value">{metrics.requests.total.toLocaleString()}</span>
              </div>
              <div className="kpi-card-footer">
                <span>Success: {metrics.requests.successRate}%</span>
                <span className="kpi-trend-pill positive">{metrics.requests.successful.toLocaleString()} OK</span>
              </div>
            </div>

            {/* 2. Errors */}
            <div className="kpi-card" style={{ '--kpi-accent-color': 'var(--color-critical)' }}>
              <div className="kpi-card-header">
                <span className="kpi-card-title">Error Telemetry</span>
                <div className="kpi-card-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-critical)' }}>
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div className="kpi-card-body">
                <span className="kpi-card-value">{metrics.errors.count}</span>
                <span className="kpi-card-unit">({metrics.errors.errorRate}%)</span>
              </div>
              <div className="kpi-card-footer">
                <span>Client & Network</span>
                <span className="kpi-trend-pill warning">Low Rate</span>
              </div>
            </div>

            {/* 3. Latency */}
            <div className="kpi-card" style={{ '--kpi-accent-color': 'var(--color-orange-500)' }}>
              <div className="kpi-card-header">
                <span className="kpi-card-title">Average Latency</span>
                <div className="kpi-card-icon" style={{ background: 'rgba(249, 115, 22, 0.15)', color: 'var(--color-orange-500)' }}>
                  <Clock size={18} />
                </div>
              </div>
              <div className="kpi-card-body">
                <span className="kpi-card-value">{metrics.latency.avgMs}</span>
                <span className="kpi-card-unit">ms</span>
              </div>
              <div className="kpi-card-footer">
                <span>p95: {metrics.latency.p95Ms}ms</span>
                <span className="kpi-trend-pill positive">p99: {metrics.latency.p99Ms}ms</span>
              </div>
            </div>

            {/* 4. WebSockets */}
            <div className="kpi-card" style={{ '--kpi-accent-color': 'var(--color-success)' }}>
              <div className="kpi-card-header">
                <span className="kpi-card-title">WebSocket Nodes</span>
                <div className="kpi-card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>
                  <Radio size={18} />
                </div>
              </div>
              <div className="kpi-card-body">
                <span className="kpi-card-value">{metrics.webSockets.activeConnections}</span>
                <span className="kpi-card-unit">active</span>
              </div>
              <div className="kpi-card-footer">
                <span>{metrics.webSockets.messagesDispatched.toLocaleString()} msgs</span>
                <span className="kpi-trend-pill positive">Stable</span>
              </div>
            </div>

            {/* 5. Sync Conflicts */}
            <div className="kpi-card" style={{ '--kpi-accent-color': 'var(--color-warning)' }}>
              <div className="kpi-card-header">
                <span className="kpi-card-title">Sync Conflicts</span>
                <div className="kpi-card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)' }}>
                  <RotateCcw size={18} />
                </div>
              </div>
              <div className="kpi-card-body">
                <span className="kpi-card-value">{metrics.syncConflicts.total}</span>
                <span className="kpi-card-unit">total</span>
              </div>
              <div className="kpi-card-footer">
                <span>Resolved: {metrics.syncConflicts.resolved}</span>
                <span className="kpi-trend-pill positive">{metrics.syncConflicts.resolutionRate}% rate</span>
              </div>
            </div>

            {/* 6. Simulation Runs */}
            <div className="kpi-card" style={{ '--kpi-accent-color': 'var(--color-info)' }}>
              <div className="kpi-card-header">
                <span className="kpi-card-title">Simulation Runs</span>
                <div className="kpi-card-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--color-info)' }}>
                  <Cpu size={18} />
                </div>
              </div>
              <div className="kpi-card-body">
                <span className="kpi-card-value">{metrics.simulationRuns.total}</span>
                <span className="kpi-card-unit">executed</span>
              </div>
              <div className="kpi-card-footer">
                <span>{metrics.simulationRuns.recentLast24h} in last 24h</span>
                <span className="kpi-trend-pill positive">{metrics.simulationRuns.successRate}% Success</span>
              </div>
            </div>
          </div>

          {/* =========================================================
              SECTION 20: METRIC VISUALIZATIONS
              ========================================================= */}
          <div className="analytics-grid-2">
            {/* Request Traffic Trend */}
            <AreaTrendChart
              title="Request Volume Distribution (24-Hour Sample)"
              subtitle="Aggregated API throughput sampled across 4-hour intervals"
              data={metrics.requests.trend}
              strokeColor="var(--color-info)"
              valueSuffix=" reqs"
            />

            {/* Latency Trajectory */}
            <AreaTrendChart
              title="Service Response Latency Trajectory"
              subtitle="End-to-end gateway response time in milliseconds"
              data={metrics.latency.trend}
              strokeColor="var(--color-orange-500)"
              valueSuffix=" ms"
            />
          </div>

          <div className="analytics-grid-2" style={{ marginTop: 'var(--space-5)' }}>
            {/* Error Classification Breakdown */}
            <BarChart
              title="Error Classification Breakdown"
              subtitle="Categorized failure events across client validation, auth, and network"
              data={metrics.errors.byType.map((e) => ({
                label: e.type,
                count: e.count,
                percent: e.percent,
                color: 'var(--color-critical)'
              }))}
            />

            {/* Offline Sync & WebSocket Observability Panel */}
            <div className="chart-card">
              <div className="chart-header">
                <div className="chart-title-group">
                  <h3>Real-Time & Sync Observability Details</h3>
                  <p>Stage 10 Pub/Sub event bus and Stage 11 offline queue reconciliation state</p>
                </div>
              </div>
              <div className="chart-content">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
                  <div className="audit-detail-item">
                    <span className="audit-detail-label">Active WebSocket Nodes</span>
                    <span className="audit-detail-val">{metrics.webSockets.activeConnections} nodes</span>
                  </div>
                  <div className="audit-detail-item">
                    <span className="audit-detail-label">Messages Dispatched</span>
                    <span className="audit-detail-val">{metrics.webSockets.messagesDispatched.toLocaleString()}</span>
                  </div>
                  <div className="audit-detail-item">
                    <span className="audit-detail-label">Pending Sync Conflicts</span>
                    <span className="audit-detail-val" style={{ color: metrics.syncConflicts.pending > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                      {metrics.syncConflicts.pending} pending
                    </span>
                  </div>
                  <div className="audit-detail-item">
                    <span className="audit-detail-label">Simulation Success Rate</span>
                    <span className="audit-detail-val" style={{ color: 'var(--color-success)' }}>
                      {metrics.simulationRuns.successRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SystemMetricsPage;
