import React from 'react';

/**
 * Reusable Icon-only Button Component
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {string} title - Accessible tooltip / title label (required)
 * @param {boolean} active - whether the button is active / pressed
 */
export const IconButton = ({
  children,
  size = 'md',
  title,
  active = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  return (
    <button
      type={type}
      className={`icon-btn icon-btn-${size} ${active ? 'icon-btn-active' : ''} ${className}`.trim()}
      title={title}
      aria-label={title}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default IconButton;
