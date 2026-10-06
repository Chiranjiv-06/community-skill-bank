import React from 'react';
import PageHeader from './PageHeader';
import Card from './Card';
import Badge from './Badge';
import { Layers, ShieldCheck, Activity } from 'lucide-react';

/**
 * Clean standard incident command module view
 */
export const ModulePlaceholder = ({
  title,
  description,
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
              <h3 style={{ fontSize: 'var(--font-lg)', margin: 0 }}>Incident Command Operational Module</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', maxWidth: '640px', margin: 0 }}>
              {description}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge variant="success">
              <Activity size={12} />
              <span>Operational</span>
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
          <span>Status: <strong>Active Incident Response Coordination</strong></span>
          <span>Security Clearance: <strong>Authorized Incident Personnel</strong></span>
        </div>
      </Card>

      {children}
    </div>
  );
};

export default ModulePlaceholder;
