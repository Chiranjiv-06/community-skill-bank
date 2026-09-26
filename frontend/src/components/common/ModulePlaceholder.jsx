import React from 'react';
import PageHeader from './PageHeader';
import Card from './Card';
import Badge from './Badge';
import { Layers, ShieldCheck, Clock } from 'lucide-react';

/**
 * Clean, standard foundation placeholder for future phases
 */
export const ModulePlaceholder = ({
  title,
  description,
  phaseNumber = 'Phase 4+',
  category = 'Emergency Module',
  icon = <Layers size={22} />,
  actions = null,
  children = null
}) => {
  return (
    <div>
      <PageHeader
        title={title}
        subtitle={description}
        icon={icon}
        badge={<Badge variant="primary">{category}</Badge>}
        actions={actions}
      />

      <Card style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <ShieldCheck size={20} color="var(--color-primary)" />
              <h3 style={{ fontSize: 'var(--font-lg)' }}>Frontend Foundation Established</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', maxWidth: '640px' }}>
              {description}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Scheduled Delivery:</span>
            <Badge variant="neutral">
              <Clock size={12} />
              <span>{phaseNumber}</span>
            </Badge>
          </div>
        </div>

        <div
          style={{
            marginTop: 'var(--space-6)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            fontSize: 'var(--font-xs)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-2)'
          }}
        >
          <span>Status: <strong>Frontend module foundation ready for future implementation.</strong></span>
          <span>Service Layer: <strong>Bound in src/services/</strong></span>
        </div>
      </Card>

      {children}
    </div>
  );
};

export default ModulePlaceholder;
