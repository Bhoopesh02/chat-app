import React from 'react';

/**
 * Reusable Heading Component
 * Renders semantic headings (h1 - h6) with customizable color, alignment, and styling rules.
 *
 * Usage:
 * <Heading level={1}>Main App Title</Heading>
 * <Heading level={2} color="primary">Modal Header</Heading>
 */
const Heading = ({
  level = 2,
  color = 'default',
  align = 'left',
  className = '',
  children,
  ...props
}) => {
  const safeLevel = Math.min(Math.max(Number(level) || 2, 1), 6);
  const Tag = `h${safeLevel}`;

  const colorClass = color !== 'default' ? `ui-color-${color}` : '';
  const alignClass = align !== 'left' ? `ui-align-${align}` : '';
  const combinedClasses = `ui-heading ui-heading-h${safeLevel} ${colorClass} ${alignClass} ${className}`.trim();

  return (
    <Tag className={combinedClasses} {...props}>
      {children}
    </Tag>
  );
};

export default Heading;
