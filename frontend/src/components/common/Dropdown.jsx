import React, { useState, useRef, useEffect } from 'react';

/**
 * Reusable Dropdown Menu Component
 */
export const Dropdown = ({
  trigger,
  children,
  align = 'right',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`dropdown-container ${className}`}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <div onClick={() => setIsOpen((prev) => !prev)} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className="glass-panel-elevated"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            [align]: 0,
            minWidth: '200px',
            zIndex: 150,
            padding: 'var(--space-2)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)'
          }}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
