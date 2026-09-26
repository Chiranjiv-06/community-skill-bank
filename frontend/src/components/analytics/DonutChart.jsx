import React from 'react';

/**
 * Responsive Donut / Ring Chart for Emergency Severity & Distribution
 * Uses SVG stroke dash offset calculations for crisp rendering without heavy libraries.
 */
export const DonutChart = ({
  data = [],
  title,
  subtitle,
  centerLabel = 'TOTAL',
  centerValue,
  emptyMessage = 'No category distribution available.',
  className = ''
}) => {
  const validData = Array.isArray(data) ? data.filter((d) => Number(d.count || d.value || 0) > 0) : [];
  const total = validData.reduce((acc, curr) => acc + Number(curr.count || curr.value || 0), 0);
  const displayTotal = centerValue !== undefined ? centerValue : total;

  // SVG circle calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76

  let accumulatedPercent = 0;

  return (
    <div className={`chart-card ${className}`.trim()}>
      {(title || subtitle) && (
        <div className="chart-header">
          <div className="chart-title-group">
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>
      )}

      <div className="chart-content">
        {total === 0 ? (
          <div className="analytics-empty-panel">
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>
              {emptyMessage}
            </span>
          </div>
        ) : (
          <div className="donut-chart-wrapper">
            {/* SVG Ring */}
            <div className="donut-svg-container">
              <svg className="donut-svg" viewBox="0 0 100 100">
                {/* Background Ring Track */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke="var(--bg-surface-elevated)"
                  strokeWidth="11"
                />

                {/* Colored Arcs */}
                {validData.map((item, idx) => {
                  const val = Number(item.count || item.value || 0);
                  const segmentPercent = val / total;
                  const strokeDasharray = `${segmentPercent * circumference} ${circumference}`;
                  const strokeDashoffset = -accumulatedPercent * circumference;
                  accumulatedPercent += segmentPercent;

                  const color = item.color || `hsl(${(idx * 65) % 360}, 85%, 55%)`;

                  return (
                    <circle
                      key={item.name || item.status || idx}
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      stroke={color}
                      strokeWidth="11"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>

              {/* Center Metrics Label */}
              <div className="donut-center-text">
                <div className="donut-center-value">{displayTotal}</div>
                <div className="donut-center-label">{centerLabel}</div>
              </div>
            </div>

            {/* Readout Legend */}
            <div className="donut-legend">
              {validData.map((item, idx) => {
                const label = item.name || item.status || item.role || item.tier || item.category;
                const val = Number(item.count || item.value || 0);
                const pct = Math.round((val / total) * 100);
                const color = item.color || `hsl(${(idx * 65) % 360}, 85%, 55%)`;

                return (
                  <div key={label || idx} className="donut-legend-row">
                    <div className="donut-legend-left">
                      <span className="donut-legend-dot" style={{ backgroundColor: color }} />
                      <span className="donut-legend-name">{label}</span>
                    </div>
                    <span className="donut-legend-value">
                      {val} <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonutChart;
