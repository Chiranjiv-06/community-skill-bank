import React, { useId } from 'react';

/**
 * Reusable Select Dropdown Component
 * @param {Array<{value: string, label: string}>} options
 */
export const Select = ({
  label,
  options = [],
  id: customId,
  error = null,
  helperText = null,
  className = '',
  required = false,
  children,
  ...props
}) => {
  const autoId = useId();
  const id = customId || autoId;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={id} className="form-label">
          <span>{label} {required && <span style={{ color: 'var(--color-critical)' }}>*</span>}</span>
        </label>
      )}
      <select
        id={id}
        className={`form-select ${error ? 'has-error' : ''} ${className}`.trim()}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
        required={required}
        {...props}
      >
        {children ? children : (
          options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))
        )}
      </select>
      {error && <span id={`${id}-error`} className="form-error">{error}</span>}
      {!error && helperText && <span id={`${id}-helper`} className="form-helper">{helperText}</span>}
    </div>
  );
};

export default Select;
