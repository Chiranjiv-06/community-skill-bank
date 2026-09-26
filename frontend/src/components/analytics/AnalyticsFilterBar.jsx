import React from 'react';
import { Filter, RotateCcw, RefreshCw, Calendar, AlertTriangle, Flame } from 'lucide-react';
import { TIME_PERIODS } from '../../data/devAnalytics';

/**
 * Filter Bar for Stage 13 — Admin Analytics Dashboard
 * Supports Time Period, Severity, and Disaster Type filtering.
 */
export const AnalyticsFilterBar = ({
  filters = {
    timePeriod: TIME_PERIODS.DAYS_7,
    severity: 'ALL',
    disasterType: 'ALL'
  },
  onFilterChange = () => {},
  onResetFilters = () => {},
  onRefresh = () => {},
  isRefreshing = false,
  lastUpdated
}) => {
  const periods = [
    { id: TIME_PERIODS.DAYS_7, label: 'Last 7 Days' },
    { id: TIME_PERIODS.DAYS_30, label: 'Last 30 Days' },
    { id: TIME_PERIODS.DAYS_90, label: 'Last 90 Days' }
  ];

  const severities = [
    { id: 'ALL', label: 'All Severities' },
    { id: 'critical', label: 'Critical' },
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' }
  ];

  const disasterTypes = [
    { id: 'ALL', label: 'All Disaster Types' },
    { id: 'flood', label: 'Flood' },
    { id: 'wildfire', label: 'Wildfire' },
    { id: 'earthquake', label: 'Earthquake' },
    { id: 'industrial accident', label: 'Industrial Accident' }
  ];

  const hasActiveFilters =
    filters.timePeriod !== TIME_PERIODS.DAYS_7 ||
    filters.severity !== 'ALL' ||
    filters.disasterType !== 'ALL';

  return (
    <div className="analytics-filter-card">
      <div className="analytics-filter-controls">
        {/* Time Period Selector */}
        <div className="analytics-period-selector" role="group" aria-label="Time Period Selector">
          {periods.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`analytics-period-btn ${filters.timePeriod === p.id ? 'active' : ''}`}
              onClick={() => onFilterChange({ ...filters, timePeriod: p.id })}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Severity Selector */}
        <select
          className="analytics-filter-select"
          value={filters.severity}
          aria-label="Filter by Severity"
          onChange={(e) => onFilterChange({ ...filters, severity: e.target.value })}
        >
          {severities.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Disaster Type Selector */}
        <select
          className="analytics-filter-select"
          value={filters.disasterType}
          aria-label="Filter by Disaster Type"
          onChange={(e) => onFilterChange({ ...filters, disasterType: e.target.value })}
        >
          {disasterTypes.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>

        {/* Clear Filters Action */}
        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onResetFilters}
            title="Reset Filters to Default"
          >
            <RotateCcw size={14} />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      <div className="analytics-filter-actions">
        {lastUpdated && (
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
            Updated: {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Analytics Telemetry"
        >
          <RefreshCw size={14} className={isRefreshing ? 'spinner' : ''} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
};

export default AnalyticsFilterBar;
