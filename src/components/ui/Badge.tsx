import React from 'react';
import {
  getBadgeClasses,
  cn,
  type BadgeVariant,
} from '../../lib/designSystem';

export interface BadgeProps {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Badge({
  variant = 'default',
  icon,
  children,
  className,
  onClick
}: BadgeProps) {
  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      className={cn(getBadgeClasses(variant), className)}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </Component>
  );
}
