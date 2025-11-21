import React from 'react';
import {
  getCardClasses,
  cn,
  type CardVariant,
} from '../../lib/designSystem';

export interface CardProps {
  variant?: CardVariant;
  clickable?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Card({
  variant = 'default',
  clickable = false,
  onClick,
  children,
  className
}: CardProps) {
  const Component = clickable || onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        getCardClasses(variant, clickable || !!onClick),
        className
      )}
    >
      {children}
    </Component>
  );
}
