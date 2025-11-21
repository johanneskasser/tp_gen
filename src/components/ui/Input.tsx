import React from 'react';
import {
  getInputClasses,
  cn,
  spacing,
  type InputState,
} from '../../lib/designSystem';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
  state?: InputState;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  helperText,
  errorText,
  state = 'default',
  required = false,
  leftIcon,
  rightIcon,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const finalState = errorText ? 'error' : state;

  return (
    <div className={spacing.tight}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium text-text-secondary mb-1.5',
            required && "after:content-['*'] after:ml-0.5 after:text-error-text"
          )}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          className={cn(
            getInputClasses(finalState),
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          {...props}
        />

        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-tertiary">
            {rightIcon}
          </div>
        )}
      </div>

      {errorText && (
        <p className="text-sm text-error-text mt-1.5">{errorText}</p>
      )}

      {helperText && !errorText && (
        <p className="text-sm text-text-tertiary mt-1.5">{helperText}</p>
      )}
    </div>
  );
}
