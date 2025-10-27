import { TrainingSession, TrainingWeek, IntervalSet } from '../types';
import { minutesToKm, estimateRecoveryPace, estimateEasyPace, paceToMinPerKm } from './paceConverter';

export function calculateSessionDistance(session: TrainingSession): number {
  if (session.distance) {
    return session.distance;
  }

  if (session.intervals && session.intervals.length > 0) {
    // Get the work pace from the first interval to estimate conversion
    const firstInterval = session.intervals[0];
    const workPace = firstInterval?.pace || '';
    const easyPace = estimateEasyPace(workPace);

    // Calculate warm-up distance
    let warmUpKm = 0;
    if (session.warmUp) {
      if (session.warmUpUnit === 'km') {
        warmUpKm = session.warmUp;
      } else if (session.warmUpUnit === 'min' && easyPace > 0) {
        warmUpKm = minutesToKm(session.warmUp, easyPace);
      }
    }

    // Calculate cool-down distance
    let coolDownKm = 0;
    if (session.coolDown) {
      if (session.coolDownUnit === 'km') {
        coolDownKm = session.coolDown;
      } else if (session.coolDownUnit === 'min' && easyPace > 0) {
        coolDownKm = minutesToKm(session.coolDown, easyPace);
      }
    }

    // Calculate interval distances
    const intervalKm = session.intervals.reduce((total, interval) => {
      const workDistance = interval.distance * interval.repetitions;

      // Calculate recovery distance
      let recoveryDistance = 0;
      if (interval.recovery) {
        if (interval.recoveryUnit === 'km') {
          recoveryDistance = parseFloat(interval.recovery) * interval.repetitions;
        } else if (interval.recoveryUnit === 'min') {
          // Estimate recovery pace from work pace
          const intervalPace = interval.pace || workPace;
          const recoveryPace = estimateRecoveryPace(intervalPace);
          if (recoveryPace > 0) {
            const recoveryMin = parseFloat(interval.recovery);
            recoveryDistance = minutesToKm(recoveryMin, recoveryPace) * interval.repetitions;
          }
        }
      }

      return total + workDistance + recoveryDistance;
    }, 0);

    return warmUpKm + intervalKm + coolDownKm;
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
