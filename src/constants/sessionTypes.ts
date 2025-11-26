import { SessionType } from '../types';
import i18n from '../i18n/config';

export const SESSION_TYPE_CONFIG: Record<
  SessionType,
  { labelKey: string; color: string; chartColor: string }
> = {
  easy: {
    labelKey: 'sessionTypes.easy',
    color: 'bg-green-100 text-green-800',
    chartColor: '#10b981', // green-500
  },
  long: {
    labelKey: 'sessionTypes.long',
    color: 'bg-blue-100 text-blue-800',
    chartColor: '#3b82f6', // blue-500
  },
  intervals: {
    labelKey: 'sessionTypes.intervals',
    color: 'bg-red-100 text-red-800',
    chartColor: '#ef4444', // red-500
  },
  tempo: {
    labelKey: 'sessionTypes.tempo',
    color: 'bg-orange-100 text-orange-800',
    chartColor: '#f97316', // orange-500
  },
  recovery: {
    labelKey: 'sessionTypes.recovery',
    color: 'bg-slate-100 text-slate-800',
    chartColor: '#94a3b8', // slate-400
  },
  race: {
    labelKey: 'sessionTypes.race',
    color: 'bg-purple-100 text-purple-800',
    chartColor: '#a855f7', // purple-500
  },
};

export function getSessionTypeLabel(type: SessionType): string {
  const config = SESSION_TYPE_CONFIG[type];
  return config ? i18n.t(config.labelKey) : type;
}

export function getSessionTypeColor(type: SessionType): string {
  return SESSION_TYPE_CONFIG[type]?.color || 'bg-slate-100 text-slate-800';
}

export function getSessionTypeChartColor(type: SessionType): string {
  return SESSION_TYPE_CONFIG[type]?.chartColor || '#94a3b8';
}
