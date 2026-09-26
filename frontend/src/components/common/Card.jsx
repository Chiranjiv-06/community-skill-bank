import React from 'react';

/**
 * Reusable Card Component
 * @param {boolean} hover - whether to apply interactive hover lift & border highlight
 */
export const Card = ({
  children,
  hover = false,
  className = '',
  style = {},
  ...props
}) => {
  return (
    <div
      className={`card ${hover ? 'card-hover' : ''} ${className}`.trim()}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
