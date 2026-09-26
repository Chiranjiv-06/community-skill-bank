/**
 * Isolated Development Data for Stage 15 — System Metrics & Health
 * 
 * Provides operational observability telemetry across the 6 required categories:
 * - Requests
 * - Errors
 * - Latency
 * - WebSockets
 * - Sync Conflicts
 * - Simulation Runs
 * 
 * Future Backend Architecture:
 * GET /api/admin/metrics/health
 * /ready
 */

export const INITIAL_DEV_METRICS = {
  health: {
    status: 'Healthy', // 'Healthy' | 'Degraded' | 'Unavailable'
    uptimeSeconds: 345600, // 4 days
    uptimePercentage: 99.94,
    lastCheck: '2026-09-25T15:30:00.000Z',
    components: [
      { name: 'API Gateway & Routing', status: 'Healthy', latencyMs: 24 },
      { name: 'State Storage & Persistence', status: 'Healthy', latencyMs: 18 },
      { name: 'WebSocket Event Dispatcher', status: 'Healthy', latencyMs: 32 },
      { name: 'Offline Mutation Synchronization', status: 'Healthy', latencyMs: 45 },
      { name: 'Disaster Simulation Engine', status: 'Healthy', latencyMs: 55 }
    ]
  },

  // 1. Requests
  requests: {
    total: 14820,
    successful: 14562,
    failed: 258,
    successRate: 98.26,
    trend: [
      { label: '00:00', value: 820 },
      { label: '04:00', value: 450 },
      { label: '08:00', value: 2410 },
      { label: '12:00', value: 4120 },
      { label: '16:00', value: 3840 },
      { label: '20:00', value: 3180 }
    ]
  },

  // 2. Errors
  errors: {
    count: 258,
    errorRate: 1.74,
    byType: [
      { type: 'Client Validation (400)', count: 184, percent: 71.3 },
      { type: 'Unauthorized / Forbidden (401/403)', count: 48, percent: 18.6 },
      { type: 'Not Found (404)', count: 18, percent: 7.0 },
      { type: 'Gateway Timeout (504)', count: 8, percent: 3.1 }
    ]
  },

  // 3. Latency
  latency: {
    avgMs: 42.4,
    p50Ms: 28.0,
    p95Ms: 112.5,
    p99Ms: 185.0,
    minMs: 12.0,
    maxMs: 240.0,
    trend: [
      { label: '00:00', value: 38 },
      { label: '04:00', value: 32 },
      { label: '08:00', value: 46 },
      { label: '12:00', value: 58 },
      { label: '16:00', value: 44 },
      { label: '20:00', value: 42 }
    ]
  },

  // 4. WebSockets
  webSockets: {
    status: 'Active (Simulated)',
    activeConnections: 18,
    connectionEvents: 142,
    reconnectEvents: 3,
    messagesDispatched: 1840,
    connectionHealth: 'Stable'
  },

  // 5. Sync Conflicts
  syncConflicts: {
    total: 8,
    resolved: 7,
    pending: 1,
    resolutionRate: 87.5,
    lastConflictTime: '2026-09-25T12:15:33.000Z'
  },

  // 6. Simulation Runs
  simulationRuns: {
    total: 12,
    recentLast24h: 4,
    successful: 11,
    failed: 1,
    successRate: 91.7,
    avgDurationSec: 1.8
  }
};

export default INITIAL_DEV_METRICS;
