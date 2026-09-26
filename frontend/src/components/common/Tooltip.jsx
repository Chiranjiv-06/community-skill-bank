import React, { useState } from 'react';

/**
 * Reusable Tooltip Component
 */
export const Tooltip = ({
  content,
  children,
  position = 'top',
  delay = 100
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  const show = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hide = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {isVisible && content && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            ...(position === 'top' && { bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' }),
            ...(position === 'bottom' && { top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' }),
            ...(position === 'right' && { left: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' }),
            ...(position === 'left' && { right: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' }),
            background: 'var(--bg-surface-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--font-xs)',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 300,
            boxShadow: 'var(--shadow-md)'
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
