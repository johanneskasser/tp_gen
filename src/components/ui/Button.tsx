import React from 'react';
import { Loader2 } from 'lucide-react';
import {
  getButtonClasses,
  cn,
  type ButtonVariant,
  type ButtonSize,
} from '../../lib/designSystem';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        getButtonClasses(variant, size, fullWidth),
        loading && 'cursor-wait opacity-70',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
}
