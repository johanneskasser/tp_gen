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
  strides: {
    labelKey: 'sessionTypes.strides',
    color: 'bg-yellow-100 text-yellow-800',
    chartColor: '#eab308', // yellow-500
  },
  hill_repeats: {
    labelKey: 'sessionTypes.hill_repeats',
    color: 'bg-amber-100 text-amber-800',
    chartColor: '#f59e0b', // amber-500
  },
  progression: {
    labelKey: 'sessionTypes.progression',
    color: 'bg-cyan-100 text-cyan-800',
    chartColor: '#06b6d4', // cyan-500
  },
  fartlek: {
    labelKey: 'sessionTypes.fartlek',
    color: 'bg-pink-100 text-pink-800',
    chartColor: '#ec4899', // pink-500
  },
  strength: {
    labelKey: 'sessionTypes.strength',
    color: 'bg-gray-100 text-gray-800',
    chartColor: '#6b7280', // gray-500
  },
  plyometrics: {
    labelKey: 'sessionTypes.plyometrics',
    color: 'bg-indigo-100 text-indigo-800',
    chartColor: '#6366f1', // indigo-500
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
