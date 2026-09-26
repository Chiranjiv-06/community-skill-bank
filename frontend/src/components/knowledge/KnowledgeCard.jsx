import React from 'react';
import { BookOpen, Clock, Tag, ExternalLink, ShieldAlert, ArrowRight } from 'lucide-react';
import Badge from '../common/Badge';

export const KnowledgeCard = ({ document, onSelect }) => {
  const {
    title,
    summary,
    category,
    disasterType,
    tags = [],
    source,
    readingTime,
    priority
  } = document;

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'critical':
        return <Badge variant="critical">Critical Protocol</Badge>;
      case 'high':
        return <Badge variant="warning">High Priority</Badge>;
      default:
        return null;
    }
  };

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px',
        border: priority === 'critical' ? '1px solid var(--color-critical-border)' : '1px solid var(--border-subtle)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        transition: 'transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast)',
        cursor: 'pointer',
        position: 'relative'
      }}
      onClick={() => onSelect(document)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(document);
        }
      }}
      aria-label={`Open knowledge document: ${title}`}
    >
      <div>
        {/* Top Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <Badge variant="primary">{category}</Badge>
            <Badge variant="neutral">{disasterType}</Badge>
          </div>
          {getPriorityBadge(priority)}
        </div>

        {/* Title */}
        <h3
          style={{
            margin: '0 0 8px 0',
            fontSize: 'var(--font-base)',
            fontWeight: 700,
            lineHeight: 1.4,
            color: 'var(--text-primary)'
          }}
        >
          {title}
        </h3>

        {/* Summary */}
        <p
          style={{
            margin: '0 0 16px 0',
            fontSize: 'var(--font-xs)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {summary}
        </p>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {tags.slice(0, 4).map((t) => (
              <span
                key={t}
                style={{
                  fontSize: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-muted)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div
        style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 'var(--font-xs)',
          color: 'var(--text-muted)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} />
          <span>{readingTime || '4 min read'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-orange-500)', fontWeight: 600 }}>
          <span>Read Guide</span>
          <ArrowRight size={14} />
        </div>
      </div>
    </div>
  );
};

export default KnowledgeCard;
