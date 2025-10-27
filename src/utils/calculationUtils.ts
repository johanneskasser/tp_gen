import { TrainingSession, TrainingWeek, IntervalSet } from '../types';

export function calculateSessionDistance(session: TrainingSession): number {
  if (session.distance) {
    return session.distance;
  }

  if (session.intervals && session.intervals.length > 0) {
    const warmUp = session.warmUp || 0;
    const coolDown = session.coolDown || 0;
    const intervalKm = session.intervals.reduce((total, interval) => {
      const workDistance = interval.distance * interval.repetitions;
      const recoveryDistance = interval.recovery
        ? parseFloat(interval.recovery) * interval.repetitions
        : 0;
      return total + workDistance + recoveryDistance;
    }, 0);
    return warmUp + intervalKm + coolDown;
  }

  return 0;
}

export function calculateWeeklyKm(sessions: TrainingSession[]): number {
  return sessions.reduce((total, session) => {
    return total + calculateSessionDistance(session);
  }, 0);
}

export function estimateIntervalTotalKm(
  warmup: number,
  cooldown: number,
  intervals: IntervalSet[]
): number {
  const intervalKm = intervals.reduce((total, interval) => {
    const workDistance = interval.distance * interval.repetitions;
    const recoveryDistance = interval.recovery
      ? parseFloat(interval.recovery) * interval.repetitions
      : 0;
    return total + workDistance + recoveryDistance;
  }, 0);

  return warmup + intervalKm + cooldown;
}

export function getRaceDistanceKm(distance: string, customDistance?: number): number {
  const distances: Record<string, number> = {
    '5K': 5,
    '10K': 10,
    'HM': 21.1,
    'M': 42.2,
  };

  if (distance === 'CUSTOM' && customDistance) {
    return customDistance;
  }

  return distances[distance] || 0;
}
