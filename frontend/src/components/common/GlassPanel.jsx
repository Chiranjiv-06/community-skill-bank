import React from 'react';

/**
 * Reusable GlassPanel Component
 * @param {boolean} elevated - higher blur and stronger shadow
 */
export const GlassPanel = ({
  children,
  elevated = false,
  className = '',
  style = {},
  ...props
}) => {
  return (
    <div
      className={`${elevated ? 'glass-panel-elevated' : 'glass-panel'} ${className}`.trim()}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassPanel;
