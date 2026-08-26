import React from 'react';

/**
 * Reusable Badge Component
 *
 * Usage:
 * <Badge variant="primary">New</Badge>
 * <Badge variant="unread">3</Badge>
 */
const Badge = ({
  variant = 'default',
  className = '',
  children,
  ...props
}) => {
  const variantClass = `ui-badge-${variant}`;
  const combinedClasses = `ui-badge ${variantClass} ${className}`.trim();

  return (
    <span className={combinedClasses} {...props}>
      {children}
    </span>
  );
};

export default Badge;
