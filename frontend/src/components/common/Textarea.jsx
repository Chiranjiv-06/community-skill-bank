import React, { useId } from 'react';

/**
 * Reusable Textarea Component
 */
export const Textarea = ({
  label,
  id: customId,
  error = null,
  helperText = null,
  className = '',
  rows = 4,
  required = false,
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
      <textarea
        id={id}
        rows={rows}
        className={`form-textarea ${error ? 'has-error' : ''} ${className}`.trim()}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
        required={required}
        {...props}
      />
      {error && <span id={`${id}-error`} className="form-error">{error}</span>}
      {!error && helperText && <span id={`${id}-helper`} className="form-helper">{helperText}</span>}
    </div>
  );
};

export default Textarea;
