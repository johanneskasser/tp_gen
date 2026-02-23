// Beispiel-Komponenten für das Design System
// Diese Komponenten zeigen die praktische Anwendung des Design Systems

import React from 'react';
import {
    getButtonClasses,
    getInputClasses,
    getBadgeClasses,
    getCardClasses,
    getSessionTypeConfig,
    cn,
    typography,
    spacing,
    flex,
    focusRing,
    hoverEffects,
    type SessionType,
    type ButtonVariant,
    type ButtonSize,
    type InputState,
    type BadgeVariant,
    type CardVariant,
} from './designSystem';

/**
 * Button Component
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
            {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            )}
            {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
        </button>
    );
}

/**
 * Input Component
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
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
                        'block text-sm font-medium text-text-secondary',
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

/**
 * Badge Component
 */
interface BadgeProps {
    variant?: BadgeVariant;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export function Badge({
                          variant = 'default',
                          icon,
                          children,
                          className
                      }: BadgeProps) {
    return (
        <span className={cn(getBadgeClasses(variant), className)}>
      {icon && <span className="mr-1">{icon}</span>}
            {children}
    </span>
    );
}

/**
 * SessionTypeBadge Component
 */
interface SessionTypeBadgeProps {
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

/**
 * Card Component
 */
interface CardProps {
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
    const Component = clickable ? 'button' : 'div';

    return (
        <Component
            onClick={onClick}
            className={cn(
                getCardClasses(variant, clickable),
                className
            )}
        >
            {children}
        </Component>
    );
}

/**
 * SessionCard Component - Beispiel für eine spezialisierte Card
 */
interface SessionCardProps {
    sessionType: SessionType;
    distance?: number;
    duration?: number;
    pace?: string;
    notes?: string;
    onClick?: () => void;
}

export function SessionCard({
                                sessionType,
                                distance,
                                duration,
                                pace,
                                notes,
                                onClick,
                            }: SessionCardProps) {
    const config = getSessionTypeConfig(sessionType);

    return (
        <div
            onClick={onClick}
            className={cn(
                'bg-white rounded-lg p-4 border-l-4 transition-all duration-base',
                `border-l-[${config.chartColor}]`,
                onClick && 'cursor-pointer hover:shadow-md'
            )}
        >
            <div className={flex.rowJustified}>
                <div className={flex.col}>
                    <SessionTypeBadge type={sessionType} />

                    {distance && (
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className={typography.numberLarge}>{distance}</span>
                            <span className={cn(typography.bodySmall, 'text-text-tertiary')}>km</span>
                        </div>
                    )}

                    {duration && (
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className={typography.number}>{duration}</span>
                            <span className={cn(typography.bodySmall, 'text-text-tertiary')}>min</span>
                        </div>
                    )}
                </div>

                {pace && (
                    <div className="text-right">
                        <p className={cn(typography.caption, 'text-text-tertiary')}>Pace</p>
                        <p className={cn(typography.number, 'text-text-secondary')}>{pace}</p>
                        <p className={cn(typography.caption, 'text-text-tertiary')}>min/km</p>
                    </div>
                )}
            </div>

            {notes && (
                <p className={cn(typography.bodySmall, 'text-text-secondary mt-3 pt-3 border-t border-border-light')}>
                    {notes}
                </p>
            )}
        </div>
    );
}

/**
 * WeekHeader Component - Beispiel für eine zusammengesetzte Komponente
 */
interface WeekHeaderProps {
    weekNumber: number;
    startDate: string;
    endDate: string;
    totalKm: number;
    isExpanded: boolean;
    onToggle: () => void;
}

export function WeekHeader({
                               weekNumber,
                               startDate,
                               endDate,
                               totalKm,
                               isExpanded,
                               onToggle,
                           }: WeekHeaderProps) {
    return (
        <button
            onClick={onToggle}
            className={cn(
                'w-full px-6 py-4',
                'border-b border-border-light',
                'bg-background-primary',
                'hover:bg-background-secondary',
                'transition-colors duration-base',
                flex.rowJustified,
                focusRing
            )}
        >
            <div className={flex.row}>
        <span className={cn(typography.h3, 'text-text-primary')}>
          Woche {weekNumber}
        </span>
                <span className={cn(typography.body, 'text-text-tertiary')}>
          {startDate} - {endDate}
        </span>
            </div>

            <div className={flex.row}>
                <div className="text-right mr-4">
                    <p className={cn(typography.caption, 'text-text-tertiary')}>Gesamt</p>
                    <p className={cn(typography.number, 'text-text-primary')}>
                        {totalKm.toFixed(1)} km
                    </p>
                </div>

                <svg
                    className={cn(
                        'w-5 h-5 text-text-tertiary transition-transform duration-base',
                        isExpanded && 'transform rotate-180'
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </button>
    );
}

/**
 * Modal Component
 */
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({
                          isOpen,
                          onClose,
                          title,
                          children,
                          footer,
                          size = 'md',
                      }: ModalProps) {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className={cn(
                        'relative bg-white rounded-2xl shadow-2xl w-full animate-scale-in',
                        sizeClasses[size]
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
                        <h2 className={typography.h2}>{title}</h2>
                        <button
                            onClick={onClose}
                            className={cn(
                                'text-text-tertiary hover:text-text-primary',
                                'transition-colors duration-fast',
                                focusRing,
                                'rounded-lg p-1'
                            )}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 max-h-[70vh] overflow-y-auto">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border-light">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Alert Component
 */
interface AlertProps {
    variant: 'success' | 'warning' | 'error' | 'info';
    title?: string;
    children: React.ReactNode;
    onClose?: () => void;
    className?: string;
}

export function Alert({
                          variant,
                          title,
                          children,
                          onClose,
                          className,
                      }: AlertProps) {
    const variantStyles = {
        success: {
            bg: 'bg-success-bg',
            border: 'border-success-border',
            text: 'text-success-text',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            ),
        },
        warning: {
            bg: 'bg-warning-bg',
            border: 'border-warning-border',
            text: 'text-warning-text',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            ),
        },
        error: {
            bg: 'bg-error-bg',
            border: 'border-error-border',
            text: 'text-error-text',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
            ),
        },
        info: {
            bg: 'bg-info-bg',
            border: 'border-info-border',
            text: 'text-info-text',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
            ),
        },
    };

    const styles = variantStyles[variant];

    return (
        <div
            className={cn(
                'rounded-lg p-4 border',
                styles.bg,
                styles.border,
                className
            )}
        >
            <div className={flex.row}>
                <div className={cn(styles.text, 'flex-shrink-0')}>
                    {styles.icon}
                </div>

                <div className="flex-1 ml-3">
                    {title && (
                        <h3 className={cn(typography.h4, styles.text, 'mb-1')}>
                            {title}
                        </h3>
                    )}
                    <div className={cn(typography.bodySmall, styles.text)}>
                        {children}
                    </div>
                </div>

                {onClose && (
                    <button
                        onClick={onClose}
                        className={cn(
                            styles.text,
                            'flex-shrink-0 ml-3',
                            hoverEffects.opacity,
                            focusRing
                        )}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * Skeleton Loader Component
 */
interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string;
    height?: string;
}

export function Skeleton({
                             className,
                             variant = 'text',
                             width,
                             height,
                         }: SkeletonProps) {
    const variantClasses = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    };

    return (
        <div
            className={cn(
                'animate-pulse bg-primary-100',
                variantClasses[variant],
                className
            )}
            style={{ width, height }}
        />
    );
}