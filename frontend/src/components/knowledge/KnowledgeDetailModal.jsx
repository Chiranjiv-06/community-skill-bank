import React from 'react';
import { BookOpen, Clock, Calendar, ShieldCheck, Tag, X, FileText, CheckCircle2 } from 'lucide-react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';

export const KnowledgeDetailModal = ({ document, isOpen, onClose }) => {
  if (!document) return null;

  const {
    title,
    summary,
    content,
    category,
    disasterType,
    tags = [],
    source,
    lastUpdated,
    readingTime,
    priority
  } = document;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={18} style={{ color: 'var(--color-orange-500)' }} />
          <span>{title}</span>
        </div>
      }
      maxWidth="780px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
            Source: <strong style={{ color: 'var(--text-secondary)' }}>{source || 'FEMA Field Reference'}</strong>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Protocol
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Badges & Meta Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            background: 'var(--bg-surface)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Badge variant="primary">{category}</Badge>
            <Badge variant="neutral">{disasterType}</Badge>
            {priority === 'critical' && <Badge variant="critical">Critical</Badge>}
            {priority === 'high' && <Badge variant="warning">High Priority</Badge>}
          </div>

          <div style={{ display: 'flex', gap: '14px', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} />
              {readingTime || '4 min read'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} />
              {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'Updated 2026'}
            </span>
          </div>
        </div>

        {/* Executive Summary Callout */}
        <div
          style={{
            background: 'rgba(255, 107, 0, 0.08)',
            borderLeft: '4px solid var(--color-orange-500)',
            padding: '12px 16px',
            borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
            fontSize: 'var(--font-sm)',
            color: 'var(--text-primary)',
            lineHeight: 1.6
          }}
        >
          <strong>Summary: </strong>
          {summary}
        </div>

        {/* Main Body Content */}
        <div
          className="knowledge-content-body"
          style={{
            fontSize: 'var(--font-sm)',
            lineHeight: 1.7,
            color: 'var(--text-secondary)',
            maxHeight: '440px',
            overflowY: 'auto',
            paddingRight: '8px'
          }}
        >
          {content.split('\n\n').map((paragraph, idx) => {
            if (paragraph.startsWith('### ')) {
              return (
                <h4
                  key={idx}
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: 'var(--font-base)',
                    fontWeight: 700,
                    margin: '18px 0 8px 0'
                  }}
                >
                  {paragraph.replace('### ', '')}
                </h4>
              );
            }
            if (paragraph.startsWith('- ')) {
              const items = paragraph.split('\n- ');
              return (
                <ul key={idx} style={{ paddingLeft: '20px', margin: '8px 0' }}>
                  {items.map((it, itemIdx) => (
                    <li key={itemIdx} style={{ marginBottom: '4px' }}>
                      {it.replace('- ', '')}
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={idx} style={{ margin: '0 0 12px 0' }}>
                {paragraph}
              </p>
            );
          })}
        </div>

        {/* Tags Footer */}
        {tags && tags.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Tag size={12} /> Tags:
            </span>
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '11px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-muted)',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default KnowledgeDetailModal;
