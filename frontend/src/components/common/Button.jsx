import React from 'react';

/**
 * Reusable Button Component
 * @param {string} variant - 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} isLoading - shows spinner when true
 * @param {React.ReactNode} icon - optional leading icon
 * @param {React.ReactNode} endIcon - optional trailing icon
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon = null,
  endIcon = null,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <span
          className="spinner"
          style={{ width: '16px', height: '16px', borderWidth: '2px' }}
          aria-hidden="true"
        />
      ) : (
        icon && <span className="btn-icon-start">{icon}</span>
      )}
      <span>{children}</span>
      {!isLoading && endIcon && <span className="btn-icon-end">{endIcon}</span>}
    </button>
  );
};

export default Button;
