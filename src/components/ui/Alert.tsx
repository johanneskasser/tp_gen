import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn, typography, flex, hoverEffects, focusRing } from '../../lib/designSystem';

export interface AlertProps {
  variant: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const variantConfig = {
  success: {
    bg: 'bg-success-bg',
    border: 'border-success-border',
    text: 'text-success-text',
    icon: CheckCircle,
  },
  warning: {
    bg: 'bg-warning-bg',
    border: 'border-warning-border',
    text: 'text-warning-text',
    icon: AlertTriangle,
  },
  error: {
    bg: 'bg-error-bg',
    border: 'border-error-border',
    text: 'text-error-text',
    icon: XCircle,
  },
  info: {
    bg: 'bg-info-bg',
    border: 'border-info-border',
    text: 'text-info-text',
    icon: Info,
  },
};

export function Alert({
  variant,
  title,
  children,
  onClose,
  className,
}: AlertProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-lg p-4 border',
        config.bg,
        config.border,
        className
      )}
      role="alert"
    >
      <div className={flex.row}>
        <div className={cn(config.text, 'flex-shrink-0')}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 ml-3">
          {title && (
            <h3 className={cn(typography.h4, config.text, 'mb-1')}>
              {title}
            </h3>
          )}
          <div className={cn(typography.bodySmall, config.text)}>
            {children}
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className={cn(
              config.text,
              'flex-shrink-0 ml-3',
              hoverEffects.opacity,
              focusRing,
              'rounded'
            )}
            aria-label="Benachrichtigung schließen"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
