import { TrainingSession, IntervalSet } from '../types';
import { minutesToKm, estimateRecoveryPace, estimateEasyPace } from './paceConverter';

// Helper function to calculate warm-up and cool-down distances
function calculateWarmUpCoolDownKm(
  warmUp: number | undefined,
  warmUpUnit: 'km' | 'min' | undefined,
  coolDown: number | undefined,
  coolDownUnit: 'km' | 'min' | undefined,
  estimatedPace: number = 6.0 // Default easy pace for estimation (6 min/km)
): { warmUpKm: number; coolDownKm: number } {
  let warmUpKm = 0;
  if (warmUp) {
    if (warmUpUnit === 'km') {
      warmUpKm = warmUp;
    } else if (warmUpUnit === 'min' && estimatedPace > 0) {
      warmUpKm = minutesToKm(warmUp, estimatedPace);
    }
  }

  let coolDownKm = 0;
  if (coolDown) {
    if (coolDownUnit === 'km') {
      coolDownKm = coolDown;
    } else if (coolDownUnit === 'min' && estimatedPace > 0) {
      coolDownKm = minutesToKm(coolDown, estimatedPace);
    }
  }

  return { warmUpKm, coolDownKm };
}

export function calculateSessionDistance(session: TrainingSession): number {
  // For interval sessions, calculate the full workout including intervals
  if (session.intervals && session.intervals.length > 0) {
    // Get the work pace from the first interval to estimate conversion
    const firstInterval = session.intervals[0];
    const workPace = firstInterval?.pace || '';
    const easyPace = estimateEasyPace(workPace);

    // Calculate warm-up and cool-down
    const { warmUpKm, coolDownKm } = calculateWarmUpCoolDownKm(
      session.warmUp,
      session.warmUpUnit,
      session.coolDown,
      session.coolDownUnit,
      easyPace
    );

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

  // For sessions with distance field (tempo, easy, long, etc.)
  if (session.distance) {
    let totalDistance = session.distance;

    // Add warm-up and cool-down if present
    if (session.warmUp || session.coolDown) {
      const { warmUpKm, coolDownKm } = calculateWarmUpCoolDownKm(
        session.warmUp,
        session.warmUpUnit,
        session.coolDown,
        session.coolDownUnit
      );
      totalDistance += warmUpKm + coolDownKm;
    }

    return totalDistance;
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
