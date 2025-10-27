import { SessionType } from '../types';

export const SESSION_TYPE_CONFIG: Record<
  SessionType,
  { label: string; color: string; chartColor: string }
> = {
  easy: {
    label: 'Locker',
    color: 'bg-green-100 text-green-800',
    chartColor: '#10b981', // green-500
  },
  long: {
    label: 'Lang',
    color: 'bg-blue-100 text-blue-800',
    chartColor: '#3b82f6', // blue-500
  },
  intervals: {
    label: 'Intervall',
    color: 'bg-red-100 text-red-800',
    chartColor: '#ef4444', // red-500
  },
  tempo: {
    label: 'Tempo',
    color: 'bg-orange-100 text-orange-800',
    chartColor: '#f97316', // orange-500
  },
  recovery: {
    label: 'Regeneration',
    color: 'bg-slate-100 text-slate-800',
    chartColor: '#94a3b8', // slate-400
  },
  race: {
    label: 'Wettkampf',
    color: 'bg-purple-100 text-purple-800',
    chartColor: '#a855f7', // purple-500
  },
};

export function getSessionTypeLabel(type: SessionType): string {
  return SESSION_TYPE_CONFIG[type]?.label || type;
}

export function getSessionTypeColor(type: SessionType): string {
  return SESSION_TYPE_CONFIG[type]?.color || 'bg-slate-100 text-slate-800';
}

export function getSessionTypeChartColor(type: SessionType): string {
  return SESSION_TYPE_CONFIG[type]?.chartColor || '#94a3b8';
}
