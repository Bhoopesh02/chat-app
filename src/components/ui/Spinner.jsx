import React from 'react';

/**
 * Reusable Spinner Loader Component
 *
 * Usage:
 * <Spinner size="md" color="primary" />
 */
const Spinner = ({
  size = 'md',
  color = 'primary',
  className = '',
  ...props
}) => {
  const sizeClass = `ui-spinner-${size}`;
  const colorClass = `ui-spinner-${color}`;
  const combinedClasses = `ui-spinner ${sizeClass} ${colorClass} ${className}`.trim();

  return (
    <span
      className={combinedClasses}
      role="status"
      aria-label="Loading"
      {...props}
    />
  );
};

export default Spinner;
