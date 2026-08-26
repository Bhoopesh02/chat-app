import React from 'react';
import Spinner from './Spinner';

/**
 * Reusable Button Component
 * Supports variants (primary, secondary, danger, outline, ghost, icon), loading states, and icons.
 *
 * Usage:
 * <Button variant="primary" onClick={handleClick}>Save Changes</Button>
 * <Button variant="danger" isLoading={isDeleting}>Delete</Button>
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  icon,
  type = 'button',
  className = '',
  children,
  ...props
}) => {
  const isIconButton = variant === 'icon' || (icon && !children);
  const disabled = isDisabled || isLoading;

  const variantClass = `ui-btn-${variant}`;
  const sizeClass = `ui-btn-${size}`;
  const fullWidthClass = fullWidth ? 'ui-btn-full' : '';
  const combinedClasses = `ui-btn ${variantClass} ${sizeClass} ${fullWidthClass} ${className}`.trim();

  // Color theme for spinner inside button
  const spinnerColor = variant === 'primary' || variant === 'danger' ? 'white' : 'primary';

  return (
    <button
      type={type}
      className={combinedClasses}
      disabled={disabled}
      aria-disabled={disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size="sm" color={spinnerColor} />
          {!isIconButton && <span>{children || 'Loading...'}</span>}
        </>
      ) : isIconButton ? (
        icon || children
      ) : (
        <>
          {leftIcon && <span className="ui-btn-icon-left">{leftIcon}</span>}
          {children && <span>{children}</span>}
          {rightIcon && <span className="ui-btn-icon-right">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
