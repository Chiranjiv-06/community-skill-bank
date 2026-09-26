import React from 'react';
import Badge from '../common/Badge';
import {
  TrendingUp,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
  Gauge,
  Layers,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

/**
 * Simulation Results View (Sections 11–16)
 * Displays KPI cards, demand vs capacity chart, skill gap breakdown,
 * fulfillment progress, response pressure, and timeline progression.
 */
export const SimulationResultsView = ({
  results,
  timeline = [],
  scenarioName,
  demandMultiplier = 1.0,
  executedAt
}) => {
  if (!results) {
    return (
      <div className="analytics-empty-panel">
        <AlertTriangle size={32} style={{ color: 'var(--color-warning)' }} />
        <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>
          No Simulation Results Available
        </h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-xs)', margin: 0 }}>
          Click "Run Simulation" to execute the hypothetical model and generate capacity, gap, and pressure projections.
        </p>
      </div>
    );
  }

  const {
    totalDemand,
    availableCapacity,
    fulfilledDemand,
    unfulfilledDemand,
    fulfillmentRate,
    responsePressureScore,
    responsePressureTier,
    skillGaps = []
  } = results;

  // Max value for comparative bar chart
  const maxBarValue = Math.max(totalDemand, availableCapacity, 1);

  const getPressureBadgeVariant = (tier) => {
    switch (tier) {
      case 'Critical':
        return 'danger';
      case 'Severe':
        return 'danger';
      case 'High':
        return 'warning';
      case 'Moderate':
        return 'warning';
      default:
        return 'success';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Simulation Disclaimer Banner */}
      <div className="sim-banner warning">
        <div className="sim-banner-content">
          <ShieldAlert size={18} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
          <span>
            <strong>SIMULATION DATA — NOT A LIVE EMERGENCY:</strong> Projections derived from hypothetical parameters and simulated regional rosters ({demandMultiplier}x multiplier).
          </span>
        </div>
        {executedAt && (
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
            Simulated At: {new Date(executedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* =========================================================
          SECTION 11: EXECUTIVE SIMULATION KPIS
          ========================================================= */}
      <div className="analytics-kpi-grid">
        <div className="kpi-card" style={{ '--kpi-accent-color': 'var(--color-critical)' }}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Simulated Demand</span>
            <div className="kpi-card-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-critical)' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-card-value">{totalDemand}</span>
            <span className="kpi-card-unit">responders</span>
          </div>
          <div className="kpi-card-footer">
            <span>Configured need ({demandMultiplier}x)</span>
            <span className="kpi-trend-pill warning">Projected</span>
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent-color': 'var(--color-info)' }}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Available Volunteers</span>
            <div className="kpi-card-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--color-info)' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-card-value">{availableCapacity}</span>
            <span className="kpi-card-unit">in radius</span>
          </div>
          <div className="kpi-card-footer">
            <span>Simulated regional pool</span>
            <span className="kpi-trend-pill neutral">Capacity</span>
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent-color': 'var(--color-success)' }}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Fulfilled Responders</span>
            <div className="kpi-card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-card-value">{fulfilledDemand}</span>
            <span className="kpi-card-unit">matched</span>
          </div>
          <div className="kpi-card-footer">
            <span>Deployable capacity</span>
            <span className="kpi-trend-pill positive">Available</span>
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent-color': 'var(--color-warning)' }}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Skill Gaps (Deficit)</span>
            <div className="kpi-card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-card-value">{unfulfilledDemand}</span>
            <span className="kpi-card-unit">unmet</span>
          </div>
          <div className="kpi-card-footer">
            <span>Specialty bottlenecks</span>
            <span className="kpi-trend-pill warning">Deficit</span>
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent-color': 'var(--color-orange-500)' }}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Fulfillment Rate</span>
            <div className="kpi-card-icon" style={{ background: 'rgba(249, 115, 22, 0.15)', color: 'var(--color-orange-500)' }}>
              <Gauge size={18} />
            </div>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-card-value">{fulfillmentRate}%</span>
          </div>
          <div className="kpi-card-footer">
            <span>Target ratio &ge; 85%</span>
            <span className={`kpi-trend-pill ${fulfillmentRate >= 80 ? 'positive' : 'warning'}`}>
              {fulfillmentRate >= 80 ? 'Optimal' : 'Shortfall'}
            </span>
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent-color': responsePressureScore >= 70 ? 'var(--color-critical)' : 'var(--color-warning)' }}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Response Pressure</span>
            <div className="kpi-card-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-critical)' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-card-value">{responsePressureScore}</span>
            <span className="kpi-card-unit">/100</span>
          </div>
          <div className="kpi-card-footer">
            <span>Tier: {responsePressureTier}</span>
            <span className={`kpi-trend-pill ${responsePressureScore >= 75 ? 'warning' : 'neutral'}`}>
              {responsePressureTier}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================
          SECTION 12 & 14: DEMAND VS CAPACITY & FULFILLMENT PROGRESS
          ========================================================= */}
      <div className="analytics-grid-2">
        {/* Demand vs Capacity Comparison Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title-group">
              <h3>Demand vs. Capacity Comparison</h3>
              <p>Simulated required positions compared against deployable volunteer pool</p>
            </div>
          </div>
          <div className="chart-content">
            <div className="bar-chart-container">
              {/* Demand Bar */}
              <div className="bar-row">
                <div className="bar-row-header">
                  <span className="bar-row-label">Projected Demand ({demandMultiplier}x)</span>
                  <span className="bar-row-value">{totalDemand}</span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${Math.round((totalDemand / maxBarValue) * 100)}%`,
                      backgroundColor: 'var(--color-critical)'
                    }}
                  />
                </div>
              </div>

              {/* Available Capacity Bar */}
              <div className="bar-row">
                <div className="bar-row-header">
                  <span className="bar-row-label">Simulated Available Capacity</span>
                  <span className="bar-row-value">{availableCapacity}</span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${Math.round((availableCapacity / maxBarValue) * 100)}%`,
                      backgroundColor: 'var(--color-info)'
                    }}
                  />
                </div>
              </div>

              {/* Fulfilled Bar */}
              <div className="bar-row">
                <div className="bar-row-header">
                  <span className="bar-row-label">Fulfilled Deployments</span>
                  <span className="bar-row-value" style={{ color: 'var(--color-success)' }}>
                    {fulfilledDemand}
                  </span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${Math.round((fulfilledDemand / maxBarValue) * 100)}%`,
                      backgroundColor: 'var(--color-success)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 14 & 15: Fulfillment Analysis & Response Pressure */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title-group">
              <h3>Fulfillment & Pressure Gauge</h3>
              <p>Overall surge readiness and operational bottleneck quotient</p>
            </div>
          </div>
          <div className="chart-content" style={{ gap: 'var(--space-4)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Overall Demand Fulfillment</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-orange-400)' }}>
                  {fulfillmentRate}%
                </span>
              </div>
              <div className="bar-track" style={{ height: '14px' }}>
                <div
                  className="bar-fill"
                  style={{
                    width: `${fulfillmentRate}%`,
                    backgroundColor: fulfillmentRate >= 80 ? 'var(--color-success)' : 'var(--color-warning)'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>Fulfilled: {fulfilledDemand}</span>
                <span>Deficit: {unfulfilledDemand}</span>
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Response Pressure Status
                </span>
                <Badge variant={getPressureBadgeVariant(responsePressureTier)}>
                  {responsePressureTier.toUpperCase()} ({responsePressureScore}/100)
                </Badge>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                {responsePressureScore >= 75
                  ? 'Severe operational strain. Critical skill deficits require activating mutual-aid compacts or secondary ward volunteer surges.'
                  : responsePressureScore >= 50
                  ? 'Moderate surge strain. Key specialty roles face shortfalls while baseline logistics remain viable.'
                  : 'Manageable readiness level. Local rosters comfortably absorb simulated demand.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          SECTION 13: SIMULATED SKILL GAPS
          ========================================================= */}
      <div className="sim-table-card">
        <div className="chart-header" style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border-default)' }}>
          <div className="chart-title-group">
            <h3>Simulated Skill Gaps & Deficit Breakdown</h3>
            <p>Required capability counts vs. simulated available regional volunteer pool</p>
          </div>
        </div>

        {skillGaps.length === 0 ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>
            No skill requirements configured for this scenario.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="sim-table">
              <thead>
                <tr>
                  <th>Required Capability</th>
                  <th>Category</th>
                  <th>Min Proficiency</th>
                  <th style={{ textAlign: 'center' }}>Required</th>
                  <th style={{ textAlign: 'center' }}>Available</th>
                  <th style={{ textAlign: 'center' }}>Deficit / Gap</th>
                  <th style={{ textAlign: 'right' }}>Priority</th>
                </tr>
              </thead>
              <tbody>
                {skillGaps.map((item, idx) => {
                  const hasGap = item.gap > 0;
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.skill}
                      </td>
                      <td>{item.category}</td>
                      <td>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {item.minProficiency}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {item.required}
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                        {item.available}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`sim-gap-pill ${hasGap ? 'has-gap' : 'no-gap'}`}>
                          {hasGap ? `-${item.gap}` : '0 (Met)'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Badge variant={item.urgency === 'Critical' ? 'danger' : item.urgency === 'High' ? 'warning' : 'default'}>
                          {item.urgency}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================
          SECTION 16: SIMULATION TIMELINE PROGRESSION
          ========================================================= */}
      {timeline && timeline.length > 0 && (
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title-group">
              <h3>Mobilization Timeline Progression</h3>
              <p>Simulated demand, capacity, and pressure progression across scenario duration</p>
            </div>
          </div>
          <div className="chart-content">
            <div className="sim-timeline-grid">
              {timeline.map((step, idx) => (
                <div key={idx} className="sim-timeline-step-card">
                  <div className="sim-step-header">
                    <span className="sim-step-badge">{step.step}</span>
                    <Badge variant={step.pressure >= 75 ? 'danger' : step.pressure >= 50 ? 'warning' : 'success'}>
                      P: {step.pressure}
                    </Badge>
                  </div>

                  <div style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {step.label}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Demand:</span>
                      <strong style={{ color: 'var(--color-critical)' }}>{step.demand}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Capacity:</span>
                      <strong style={{ color: 'var(--color-info)' }}>{step.capacity}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Fulfilled:</span>
                      <strong style={{ color: 'var(--color-success)' }}>{step.fulfilled}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationResultsView;
