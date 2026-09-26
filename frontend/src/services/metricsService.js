/**
 * System Metrics Service (Stage 15 — Audit & Observability)
 * 
 * Provides isolated system performance, error tracking, latency distribution,
 * WebSocket observability, sync conflict telemetry, and simulation metrics.
 * 
 * Future Backend Architecture:
 * GET /api/admin/metrics/health
 * /ready
 */

import { INITIAL_DEV_METRICS } from '../data/devMetrics.js';

const STORAGE_KEY = 'csb_dev_metrics';

const getStoredMetrics = () => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_METRICS));
      }
      return JSON.parse(JSON.stringify(INITIAL_DEV_METRICS));
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[metricsService] Error reading cached metrics, using fallback:', err);
    return JSON.parse(JSON.stringify(INITIAL_DEV_METRICS));
  }
};

export const metricsService = {
  /**
   * Retrieve all system observability metrics
   */
  async getMetrics() {
    const data = getStoredMetrics();
    return JSON.parse(JSON.stringify(data));
  },

  /**
   * Retrieve health status
   */
  async getHealth() {
    const data = getStoredMetrics();
    return JSON.parse(JSON.stringify(data.health));
  },

  /**
   * Retrieve request telemetry
   */
  async getRequestMetrics() {
    const data = getStoredMetrics();
    return JSON.parse(JSON.stringify(data.requests));
  },

  /**
   * Retrieve error metrics
   */
  async getErrorMetrics() {
    const data = getStoredMetrics();
    return JSON.parse(JSON.stringify(data.errors));
  },

  /**
   * Retrieve latency metrics
   */
  async getLatencyMetrics() {
    const data = getStoredMetrics();
    return JSON.parse(JSON.stringify(data.latency));
  },

  /**
   * Retrieve WebSocket metrics
   */
  async getWebSocketMetrics() {
    const data = getStoredMetrics();
    return JSON.parse(JSON.stringify(data.webSockets));
  },

  /**
   * Retrieve sync conflict metrics
   */
  async getSyncConflictMetrics() {
    const data = getStoredMetrics();
    return JSON.parse(JSON.stringify(data.syncConflicts));
  },

  /**
   * Retrieve simulation run metrics
   */
  async getSimulationMetrics() {
    const data = getStoredMetrics();
    return JSON.parse(JSON.stringify(data.simulationRuns));
  },

  /**
   * Reset metrics to initial seed
   */
  resetDevelopmentMetrics() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_METRICS));
    }
    return JSON.parse(JSON.stringify(INITIAL_DEV_METRICS));
  }
};

export default metricsService;
