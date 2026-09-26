import React, { useState } from 'react';
import {
  Compass,
  Send,
  HelpCircle,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Shield,
  Clock,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { knowledgeService } from '../../services/knowledgeService.js';
import Badge from '../common/Badge';
import Button from '../common/Button';

const EXAMPLE_QUESTIONS = [
  'What should I do during a flood?',
  'How should basic first aid be performed?',
  'What should volunteers carry during emergency response?',
  'What should I do during an earthquake?'
];

export const KnowledgeAssistantPanel = ({ onOpenDocument }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleAsk = async (questionToAsk) => {
    const q = (questionToAsk || query).trim();
    if (!q) return;

    setQuery(q);
    setIsLoading(true);
    setError(null);

    try {
      // Deterministic answer synthesized from development knowledge base
      const result = await knowledgeService.askAssistant(q);
      setResponse(result);
    } catch (err) {
      setError(err.message || 'Unable to process assistant query.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div
      className="knowledge-assistant-panel"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 107, 0, 0.15)',
              color: 'var(--color-orange-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Compass size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
              Emergency Knowledge Assistant
            </h3>
            <p style={{ margin: 0, fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
              Instant deterministic guidance synthesized from verified Incident Command protocols.
            </p>
          </div>
        </div>
        <Badge variant="neutral">Deterministic Development Engine</Badge>
      </div>

      {/* Suggested Quick Questions */}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <HelpCircle size={12} /> Suggested Operational Queries:
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {EXAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              className="btn btn-ghost btn-xs"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                fontSize: '11px',
                textAlign: 'left'
              }}
              onClick={() => handleAsk(q)}
            >
              <span>{q}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Row */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <label htmlFor="assistant-query-input" className="sr-only">
            Ask Emergency Knowledge Assistant
          </label>
          <input
            id="assistant-query-input"
            type="text"
            className="input"
            placeholder="Ask a question about emergency preparedness, flood safety, triage, or field kits..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ width: '100%' }}
          />
        </div>
        <Button
          variant="primary"
          size="md"
          disabled={!query.trim() || isLoading}
          onClick={() => handleAsk()}
        >
          <Send size={15} />
          <span>{isLoading ? 'Searching...' : 'Ask Protocol'}</span>
        </Button>
      </div>

      {error && (
        <div
          style={{
            fontSize: 'var(--font-xs)',
            color: 'var(--color-critical)',
            background: 'rgba(239, 68, 68, 0.08)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          {error}
        </div>
      )}

      {/* Response Box */}
      {response && (
        <div
          className="assistant-response-card"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {/* Query Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>
              Q: "{response.question}"
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <Badge variant="primary">{response.category}</Badge>
              <Badge variant="neutral">{response.disasterType}</Badge>
            </div>
          </div>

          {/* Formatted Answer */}
          <div
            style={{
              fontSize: 'var(--font-sm)',
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-line'
            }}
          >
            {response.answer}
          </div>

          {/* Safety Notes Callout */}
          {response.safetyNotes && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                borderLeft: '3px solid var(--color-warning)',
                padding: '10px 14px',
                borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                fontSize: 'var(--font-xs)',
                color: 'var(--color-warning)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Safety Directive: </strong>
                {response.safetyNotes}
              </div>
            </div>
          )}

          {/* Referenced Official Documents */}
          {response.relevantDocs && response.relevantDocs.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
              <div style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={14} style={{ color: 'var(--color-orange-500)' }} />
                <span>Referenced Field Protocols & Guides:</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {response.relevantDocs.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{
                      justifyContent: 'space-between',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      padding: '8px 12px',
                      textAlign: 'left',
                      width: '100%'
                    }}
                    onClick={() => onOpenDocument(doc)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileCheck size={14} style={{ color: 'var(--color-success)' }} />
                      <span style={{ fontWeight: 600, fontSize: 'var(--font-xs)' }}>{doc.title}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({doc.category})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-orange-500)', fontSize: '11px' }}>
                      <span>View Full Guide</span>
                      <ArrowRight size={12} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FileCheck = ({ size = 14, style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="m9 15 2 2 4-4" />
  </svg>
);

export default KnowledgeAssistantPanel;
