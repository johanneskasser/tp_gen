import React from 'react';
import {
  getSessionTypeConfig,
  cn,
  type SessionType,
} from '../../lib/designSystem';

export interface SessionTypeBadgeProps {
  type: SessionType;
  className?: string;
}

export function SessionTypeBadge({ type, className }: SessionTypeBadgeProps) {
  const config = getSessionTypeConfig(type);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
        config.bgColor,
        config.textColor,
        className
      )}
    >
      {config.label}
    </span>
  );
}
