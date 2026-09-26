import React from 'react';

/**
 * Responsive Bar Chart for Emergency Incident Analytics
 * Displays operational telemetry bars with percentage tracking.
 */
export const BarChart = ({
  data = [],
  title,
  subtitle,
  valueSuffix = '',
  emptyMessage = 'No telemetry data available for current selection.',
  className = ''
}) => {
  const hasData = Array.isArray(data) && data.length > 0;
  const maxValue = hasData ? Math.max(...data.map((item) => Number(item.value || item.count || 0)), 1) : 1;

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
          <div className="bar-chart-container" role="list">
            {data.map((item, idx) => {
              const label = item.label || item.name || item.type || item.category || item.status || item.skill;
              const rawVal = Number(item.value !== undefined ? item.value : item.count !== undefined ? item.count : 0);
              const percentage = Math.round((rawVal / maxValue) * 100);
              const barColor = item.color || 'var(--color-orange-500)';

              return (
                <div key={item.id || label || idx} className="bar-row" role="listitem">
                  <div className="bar-row-header">
                    <span className="bar-row-label">{label}</span>
                    <span className="bar-row-value">
                      {rawVal.toLocaleString()}{valueSuffix}
                      {item.percent !== undefined && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                          ({item.percent}%)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="bar-track" title={`${label}: ${rawVal}${valueSuffix}`}>
                    <div
                      className="bar-fill"
                      style={{
                        width: `${Math.max(percentage, 2)}%`,
                        backgroundColor: barColor
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BarChart;
