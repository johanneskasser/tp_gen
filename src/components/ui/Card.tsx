import React from 'react';
import {
  getCardClasses,
  cn,
  type CardVariant,
} from '../../lib/designSystem';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  clickable?: boolean;
}

export function Card({
  variant = 'default',
  clickable = false,
  onClick,
  children,
  className,
  ...rest
}: CardProps) {
  const Component = clickable || onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        getCardClasses(variant, clickable || !!onClick),
        className
      )}
      {...(rest as React.HTMLAttributes<HTMLElement>)}
    >
      {children}
    </Component>
  );
}
