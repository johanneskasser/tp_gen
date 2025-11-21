/**
 * Design System Utilities
 * Zentrale Utility-Funktionen für das Design System
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { SessionType } from '../types';

/**
 * Kombiniert Tailwind-Klassen und merged sie intelligent
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Session Type Typen
 */
export type { SessionType };

/**
 * Button Varianten
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Input States
 */
export type InputState = 'default' | 'error' | 'success';

/**
 * Badge Varianten
 */
export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

/**
 * Card Varianten
 */
export type CardVariant = 'default' | 'elevated' | 'outlined';

/**
 * Session Type Konfiguration
 */
interface SessionTypeConfig {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  chartColor: string;
}

const sessionTypeConfigs: Record<SessionType, SessionTypeConfig> = {
  easy: {
    label: 'Locker',
    bgColor: 'bg-session-easy-bg',
    textColor: 'text-session-easy-text',
    borderColor: 'border-session-easy-border',
    chartColor: '#7dd3fc',
  },
  long: {
    label: 'Langer Lauf',
    bgColor: 'bg-session-long-bg',
    textColor: 'text-session-long-text',
    borderColor: 'border-session-long-border',
    chartColor: '#38bdf8',
  },
  intervals: {
    label: 'Intervall',
    bgColor: 'bg-session-intervals-bg',
    textColor: 'text-session-intervals-text',
    borderColor: 'border-session-intervals-border',
    chartColor: '#fb923c',
  },
  tempo: {
    label: 'Tempo',
    bgColor: 'bg-session-tempo-bg',
    textColor: 'text-session-tempo-text',
    borderColor: 'border-session-tempo-border',
    chartColor: '#fbbf24',
  },
  recovery: {
    label: 'Erholung',
    bgColor: 'bg-session-recovery-bg',
    textColor: 'text-session-recovery-text',
    borderColor: 'border-session-recovery-border',
    chartColor: '#4ade80',
  },
  race: {
    label: 'Wettkampf',
    bgColor: 'bg-session-race-bg',
    textColor: 'text-session-race-text',
    borderColor: 'border-session-race-border',
    chartColor: '#fb7185',
  },
};

export function getSessionTypeConfig(type: SessionType): SessionTypeConfig {
  return sessionTypeConfigs[type];
}

/**
 * Button-Klassen
 */
export function getButtonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  fullWidth = false
): string {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-fast focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-primary-700 text-white hover:bg-primary-800 active:bg-primary-900 focus:ring-primary-400',
    secondary: 'bg-primary-100 text-primary-800 border border-primary-300 hover:bg-primary-200 active:bg-primary-300 focus:ring-primary-400',
    ghost: 'bg-transparent text-primary-700 hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-400',
    danger: 'bg-error-bg text-error-text border border-error-border hover:bg-red-100 active:bg-red-200 focus:ring-error-text',
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'w-full'
  );
}

/**
 * Input-Klassen
 */
export function getInputClasses(state: InputState = 'default'): string {
  const baseClasses = 'block w-full rounded-lg border px-4 py-2.5 text-base text-text-primary placeholder:text-text-tertiary bg-white transition-all duration-fast focus:outline-none focus:ring-2 disabled:bg-disabled-bg disabled:text-disabled-text disabled:cursor-not-allowed';

  const stateClasses: Record<InputState, string> = {
    default: 'border-border-medium focus:border-primary-400 focus:ring-primary-400',
    error: 'border-error-border focus:border-error-text focus:ring-error-text',
    success: 'border-success-border focus:border-success-text focus:ring-success-text',
  };

  return cn(baseClasses, stateClasses[state]);
}

/**
 * Badge-Klassen
 */
export function getBadgeClasses(variant: BadgeVariant = 'default'): string {
  const baseClasses = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium';

  const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-primary-100 text-primary-700',
    success: 'bg-success-bg text-success-text',
    warning: 'bg-warning-bg text-warning-text',
    error: 'bg-error-bg text-error-text',
    info: 'bg-info-bg text-info-text',
  };

  return cn(baseClasses, variantClasses[variant]);
}

/**
 * Card-Klassen
 */
export function getCardClasses(variant: CardVariant = 'default', clickable = false): string {
  const baseClasses = 'bg-background-secondary rounded-xl transition-shadow duration-base';

  const variantClasses: Record<CardVariant, string> = {
    default: 'border border-border-light p-6 shadow-sm hover:shadow-md',
    elevated: 'p-6 shadow-md hover:shadow-lg',
    outlined: 'border-2 border-border-medium p-6',
  };

  return cn(
    baseClasses,
    variantClasses[variant],
    clickable && 'cursor-pointer hover:shadow-lg'
  );
}

/**
 * Typography-Klassen
 */
export const typography = {
  display: 'text-display font-bold text-text-primary',
  h1: 'text-h1 font-bold text-text-primary',
  h2: 'text-h2 font-semibold text-text-primary',
  h3: 'text-h3 font-semibold text-text-primary',
  h4: 'text-h4 font-semibold text-text-primary',
  bodyLarge: 'text-body-lg text-text-primary',
  body: 'text-body text-text-primary',
  bodySmall: 'text-body-sm text-text-secondary',
  caption: 'text-caption text-text-tertiary',
  overline: 'text-overline uppercase tracking-wider text-text-tertiary',
  numberLarge: 'text-number-lg font-bold font-mono tabular-nums',
  number: 'text-number font-semibold font-mono tabular-nums',
  numberSmall: 'text-number-sm font-medium font-mono tabular-nums',
};

/**
 * Spacing-Utilities
 */
export const spacing = {
  tight: 'space-y-1.5',
  normal: 'space-y-3',
  relaxed: 'space-y-4',
  loose: 'space-y-6',
};

/**
 * Flex-Utilities
 */
export const flex = {
  row: 'flex flex-row items-center gap-3',
  rowTight: 'flex flex-row items-center gap-2',
  rowJustified: 'flex flex-row items-center justify-between',
  col: 'flex flex-col',
  colTight: 'flex flex-col gap-2',
  colNormal: 'flex flex-col gap-3',
  colRelaxed: 'flex flex-col gap-4',
  center: 'flex items-center justify-center',
};

/**
 * Focus Ring
 */
export const focusRing = 'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2';

/**
 * Hover Effekte
 */
export const hoverEffects = {
  lift: 'hover:translate-y-[-2px] transition-transform duration-fast',
  shadow: 'hover:shadow-lg transition-shadow duration-base',
  scale: 'hover:scale-105 transition-transform duration-fast',
  opacity: 'hover:opacity-70 transition-opacity duration-fast',
};

/**
 * Chart-Farben für Recharts
 */
export const chartColors = {
  easy: '#7dd3fc',
  long: '#38bdf8',
  intervals: '#fb923c',
  tempo: '#fbbf24',
  recovery: '#4ade80',
  race: '#fb7185',
};

/**
 * Grid-Farben für Chart
 */
export const chartGridColor = '#e5edef';

/**
 * Axis-Farben für Chart
 */
export const chartAxisColors = {
  tick: '#6b7378',
  label: '#4a5155',
};
