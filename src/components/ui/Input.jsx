import React from 'react';

/**
 * Reusable Form Input Component
 * Supports labels, error text, helper text, prefix/suffix icons, and clear buttons.
 *
 * Usage:
 * <Input label="Email" type="email" placeholder="enter your email..." error={emailError} />
 */
const Input = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  value,
  onChange,
  placeholder,
  type = 'text',
  isDisabled = false,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const hasLeftIcon = Boolean(leftIcon);
  const hasRightIcon = Boolean(rightIcon);

  const containerClasses = [
    'ui-input-container',
    hasLeftIcon ? 'ui-input-has-left-icon' : '',
    hasRightIcon ? 'ui-input-has-right-icon' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={`ui-input-wrapper ${error ? 'ui-input-error' : ''} ${className}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="ui-input-label">
          {label}
        </label>
      )}
      <div className={containerClasses}>
        {leftIcon && <span className="ui-input-icon-left">{leftIcon}</span>}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={isDisabled}
          className="ui-input-field"
          aria-invalid={Boolean(error)}
          {...props}
        />
        {rightIcon && <span className="ui-input-icon-right">{rightIcon}</span>}
      </div>
      {error && <span className="ui-input-error-text">{error}</span>}
      {!error && helperText && <span className="ui-input-helper-text">{helperText}</span>}
    </div>
  );
};

export default Input;
