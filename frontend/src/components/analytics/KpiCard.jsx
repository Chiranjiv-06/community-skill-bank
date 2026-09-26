import React from 'react';

/**
 * KPI Metric Card for Emergency Incident Analytics
 * Displays aggregate values, status indicators, and operational trends.
 */
export const KpiCard = ({
  title,
  value,
  unit = '',
  subtext,
  icon,
  accentColor = 'var(--color-orange-500)',
  accentBg,
  trendText,
  trendType = 'positive',
  className = ''
}) => {
  const displayValue = value !== undefined && value !== null ? value : '—';

  return (
    <div
      className={`kpi-card ${className}`.trim()}
      style={{
        '--kpi-accent-color': accentColor,
        '--kpi-accent-bg': accentBg || `${accentColor}1F`
      }}
    >
      <div className="kpi-card-header">
        <span className="kpi-card-title">{title}</span>
        {icon && <div className="kpi-card-icon">{icon}</div>}
      </div>

      <div className="kpi-card-body">
        <span className="kpi-card-value">{displayValue}</span>
        {unit && <span className="kpi-card-unit">{unit}</span>}
      </div>

      {(subtext || trendText) && (
        <div className="kpi-card-footer">
          <span>{subtext}</span>
          {trendText && (
            <span className={`kpi-trend-pill ${trendType}`}>
              {trendText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default KpiCard;
