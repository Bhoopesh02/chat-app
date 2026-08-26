import React from 'react';
import Heading from './Heading';
import Text from './Text';

/**
 * Reusable Card Component Suite
 *
 * Usage:
 * <Card hoverable onClick={handleClick}>
 *   <CardHeader title="Group Settings" subtitle="Configure group chat" />
 *   <CardBody>Settings options...</CardBody>
 * </Card>
 */
export const Card = ({
  hoverable = false,
  className = '',
  children,
  onClick,
  ...props
}) => {
  const hoverClass = hoverable ? 'ui-card-hoverable' : '';
  const combinedClasses = `ui-card ${hoverClass} ${className}`.trim();

  return (
    <div className={combinedClasses} onClick={onClick} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({
  title,
  subtitle,
  action,
  className = '',
  children,
  ...props
}) => (
  <div className={`ui-card-header ${className}`.trim()} {...props}>
    {title && <Heading level={4}>{title}</Heading>}
    {subtitle && <Text variant="caption" color="secondary">{subtitle}</Text>}
    {children}
    {action && <div className="ui-card-action">{action}</div>}
  </div>
);

export const CardBody = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`ui-card-body ${className}`.trim()} {...props}>
    {children}
  </div>
);

export const CardFooter = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`ui-card-footer ${className}`.trim()} {...props}>
    {children}
  </div>
);

export default Card;
