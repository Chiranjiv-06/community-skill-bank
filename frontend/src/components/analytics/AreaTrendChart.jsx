import React, { useId } from 'react';

/**
 * Responsive SVG Area / Line Trend Chart for Disaster Response Metrics
 * Provides clean operational time-series visualization with gradient fill.
 */
export const AreaTrendChart = ({
  data = [],
  title,
  subtitle,
  valueSuffix = '',
  strokeColor = 'var(--color-orange-500)',
  emptyMessage = 'No historical telemetry recorded for selected period.',
  className = ''
}) => {
  const gradientId = useId().replace(/:/g, '');
  const hasData = Array.isArray(data) && data.length > 0;

  // ViewBox geometry
  const width = 500;
  const height = 180;
  const paddingX = 40;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingTop - paddingBottom;

  const values = hasData ? data.map((d) => Number(d.value || 0)) : [0];
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const valRange = maxVal - minVal || 1;

  // Generate coordinate points
  const points = hasData
    ? data.map((d, i) => {
        const x = paddingX + (i / Math.max(data.length - 1, 1)) * chartWidth;
        const normalizedY = (Number(d.value || 0) - minVal) / valRange;
        const y = paddingTop + (1 - normalizedY) * chartHeight;
        return { x, y, label: d.label, value: d.value };
      })
    : [];

  const pointsString = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPointsString = points.length > 0
    ? `${points[0].x},${paddingTop + chartHeight} ${pointsString} ${points[points.length - 1].x},${paddingTop + chartHeight}`
    : '';

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
        {!hasData ? (
          <div className="analytics-empty-panel">
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>
              {emptyMessage}
            </span>
          </div>
        ) : (
          <div className="trend-chart-container">
            <svg
              className="trend-svg"
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id={`grad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line
                x1={paddingX}
                y1={paddingTop}
                x2={width - paddingX}
                y2={paddingTop}
                className="trend-grid-line"
              />
              <line
                x1={paddingX}
                y1={paddingTop + chartHeight / 2}
                x2={width - paddingX}
                y2={paddingTop + chartHeight / 2}
                className="trend-grid-line"
              />
              <line
                x1={paddingX}
                y1={paddingTop + chartHeight}
                x2={width - paddingX}
                y2={paddingTop + chartHeight}
                stroke="var(--border-default)"
                strokeWidth="1"
              />

              {/* Y-Axis Value Labels */}
              <text x={paddingX - 8} y={paddingTop + 4} textAnchor="end" className="trend-axis-text">
                {maxVal}
              </text>
              <text x={paddingX - 8} y={paddingTop + chartHeight} textAnchor="end" className="trend-axis-text">
                {minVal}
              </text>

              {/* Area Gradient Fill */}
              {areaPointsString && (
                <polygon
                  points={areaPointsString}
                  fill={`url(#grad-${gradientId})`}
                />
              )}

              {/* Line Stroke */}
              {pointsString && (
                <polyline
                  points={pointsString}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data Points and X-Axis Labels */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill={strokeColor}
                    stroke="var(--bg-surface)"
                    strokeWidth="2"
                    className="trend-data-point"
                  >
                    <title>{`${p.label}: ${p.value}${valueSuffix}`}</title>
                  </circle>

                  {/* X Axis Label */}
                  <text
                    x={p.x}
                    y={height - 12}
                    textAnchor="middle"
                    className="trend-axis-text"
                  >
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default AreaTrendChart;
