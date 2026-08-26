import React from 'react';

/**
 * Reusable Text Component
 * Renders body copy, captions, lead text, or code with semantic typography styles.
 *
 * Usage:
 * <Text variant="body">Standard message body text</Text>
 * <Text variant="caption" color="secondary">10:45 AM</Text>
 * <Text variant="code">console.log("hello")</Text>
 */
const Text = ({
  as,
  variant = 'body',
  color = 'default',
  align = 'left',
  className = '',
  style = {},
  weight,
  children,
  ...props
}) => {
  // Determine HTML Tag
  const Tag = as || (variant === 'code' ? 'code' : 'p');

  const variantClass = `ui-text-${variant}`;
  const colorClass = color !== 'default' ? `ui-color-${color}` : '';
  const alignClass = align !== 'left' ? `ui-align-${align}` : '';
  const combinedClasses = `ui-text ${variantClass} ${colorClass} ${alignClass} ${className}`.trim();

  const customStyle = {
    ...(weight ? { fontWeight: weight } : {}),
    ...style
  };

  return (
    <Tag className={combinedClasses} style={customStyle} {...props}>
      {children}
    </Tag>
  );
};

export default Text;
