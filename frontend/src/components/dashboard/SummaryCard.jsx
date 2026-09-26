import React from 'react';
import Card from '../common/Card';

export const SummaryCard = ({
  title,
  value,
  subtitle = null,
  icon = null,
  badge = null,
  className = ''
}) => {
  return (
    <Card hover className={`summary-card ${className}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
        <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        {icon && (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(249, 115, 22, 0.12)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, color: 'var(--text-primary)' }}>
          {value}
        </span>
        {badge}
      </div>

      {subtitle && (
        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
          {subtitle}
        </div>
      )}
    </Card>
  );
};

export default SummaryCard;
