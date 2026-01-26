/**
 * VDOT Pace Calculator
 *
 * Based on Jack Daniels' Running Formula
 * Calculates training paces from VDOT or race performances
 *
 * Reference: "Daniels' Running Formula" by Jack Daniels
 * Mathematical formulas from: https://fellrnr.com/wiki/Jack_Daniels
 */

import { VDOTTrainingPaces, IntervalSuggestion } from './types';
import { TrainingZones } from '../types/userProfile';

// ============ VDOT Constants ============

/**
 * Standard race distances in km
 */
export const RACE_DISTANCES = {
  '1500m': 1.5,
  '1_mile': 1.609,
  '3k': 3,
  '2_mile': 3.218,
  '5k': 5,
  '10k': 10,
  '15k': 15,
  'half_marathon': 21.0975,
  'marathon': 42.195,
};

// ============ VDOT Calculations ============

/**
 * Calculate percent of VO2max from race duration (minutes)
 * Formula: %VO2max = 0.8 + 0.1894393 * e^(-0.012778*T) + 0.2989558 * e^(-0.1932605*T)
 */
export function percentVO2maxFromTime(timeMinutes: number): number {
  return (
    0.8 +
    0.1894393 * Math.exp(-0.012778 * timeMinutes) +
    0.2989558 * Math.exp(-0.1932605 * timeMinutes)
  );
}

/**
 * Calculate VO2 (oxygen cost) from velocity
 * Formula: VO2 = -4.60 + 0.182258 * V + 0.000104 * V²
 * Where V is velocity in meters per minute
 */
export function vo2FromVelocity(velocityMpm: number): number {
  return -4.6 + 0.182258 * velocityMpm + 0.000104 * Math.pow(velocityMpm, 2);
}

/**
 * Calculate velocity from VO2
 * Inverse of vo2FromVelocity using quadratic formula
 */
export function velocityFromVO2(vo2: number): number {
  // Solve: 0.000104 * V² + 0.182258 * V + (-4.60 - VO2) = 0
  const a = 0.000104;
  const b = 0.182258;
  const c = -4.6 - vo2;

  const discriminant = b * b - 4 * a * c;
  return (-b + Math.sqrt(discriminant)) / (2 * a);
}

/**
 * Calculate VDOT from race performance
 * VDOT = VO2 / %VO2max
 */
export function calculateVDOTFromRace(distanceKm: number, timeMinutes: number): number {
  const distanceMeters = distanceKm * 1000;
  const velocityMpm = distanceMeters / timeMinutes;

  const vo2 = vo2FromVelocity(velocityMpm);
  const percentVO2max = percentVO2maxFromTime(timeMinutes);

  return vo2 / percentVO2max;
}

/**
 * Project race time for a given VDOT and distance
 * Uses Newton-Raphson iteration to find time
 */
export function projectRaceTime(vdot: number, distanceKm: number): number {
  const distanceMeters = distanceKm * 1000;

  // Initial guess based on approximate pace
  let timeMinutes = distanceKm * 5; // ~5:00/km starting guess

  // Newton-Raphson iteration
  for (let i = 0; i < 20; i++) {
    const percentVO2max = percentVO2maxFromTime(timeMinutes);
    const vo2 = vdot * percentVO2max;
    const velocity = velocityFromVO2(vo2);
    const predictedTime = distanceMeters / velocity;

    if (Math.abs(predictedTime - timeMinutes) < 0.01) {
      return predictedTime;
    }

    timeMinutes = predictedTime;
  }

  return timeMinutes;
}

/**
 * Format time in minutes to HH:MM:SS or MM:SS
 */
export function formatTime(timeMinutes: number): string {
  const totalSeconds = Math.round(timeMinutes * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format pace in min/km
 */
export function formatPace(paceMinPerKm: number): string {
  const minutes = Math.floor(paceMinPerKm);
  const seconds = Math.round((paceMinPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// ============ Training Paces from VDOT ============

/**
 * Training pace percentages of vVO2max (velocity at VO2max)
 * Based on Jack Daniels' research
 *
 * These are percentages of VELOCITY at VO2max, not %VO2max
 */
const PACE_PERCENTAGES = {
  // Easy pace: 59-74% VO2max → ~65-79% vVO2max
  easy: { min: 0.65, max: 0.79 },

  // Marathon pace: ~75-84% VO2max → ~80-88% vVO2max
  // Actually calculated from predicted marathon time
  marathon: { target: 0.84 },

  // Threshold pace: 83-88% VO2max → ~88-92% vVO2max
  // Sustainable for ~60 minutes
  threshold: { target: 0.88 },

  // Interval pace: 95-100% VO2max → ~97-100% vVO2max
  // 3-5 minute efforts
  interval: { target: 0.98 },

  // Repetition pace: 105-110% VO2max → ~102-108% vVO2max
  // Fast, short efforts with full recovery
  repetition: { target: 1.05 },

  // Recovery: slower than easy
  recovery: { min: 0.6, max: 0.68 },
};

/**
 * Calculate training paces from VDOT
 */
export function calculateTrainingPacesFromVDOT(vdot: number): VDOTTrainingPaces {
  // Calculate vVO2max (velocity at VO2max) in m/min
  const vo2max = vdot; // VDOT ≈ VO2max for our purposes
  const vVO2max = velocityFromVO2(vo2max);

  // Helper to convert velocity to pace (min/km)
  const velocityToPace = (velocityMpm: number): number => {
    return 1000 / velocityMpm;
  };

  // Easy pace range
  const easyPaceMin = velocityToPace(vVO2max * PACE_PERCENTAGES.easy.max); // Faster
  const easyPaceMax = velocityToPace(vVO2max * PACE_PERCENTAGES.easy.min); // Slower

  // Marathon pace - calculate from projected marathon time
  const marathonTimeMin = projectRaceTime(vdot, 42.195);
  const marathonPace = marathonTimeMin / 42.195;

  // Threshold pace
  const thresholdPace = velocityToPace(vVO2max * PACE_PERCENTAGES.threshold.target);

  // Interval pace
  const intervalPace = velocityToPace(vVO2max * PACE_PERCENTAGES.interval.target);

  // Repetition pace
  const repetitionPace = velocityToPace(vVO2max * PACE_PERCENTAGES.repetition.target);

  // Recovery pace
  const recoveryPaceMin = velocityToPace(vVO2max * PACE_PERCENTAGES.recovery.max);
  const recoveryPaceMax = velocityToPace(vVO2max * PACE_PERCENTAGES.recovery.min);

  return {
    vdot,
    easyPace: { min: easyPaceMin, max: easyPaceMax },
    marathonPace,
    thresholdPace,
    intervalPace,
    repetitionPace,
    recoveryPace: { min: recoveryPaceMin, max: recoveryPaceMax },
  };
}

/**
 * Convert VDOTTrainingPaces to TrainingZones format
 */
export function vdotPacesToTrainingZones(paces: VDOTTrainingPaces): TrainingZones {
  return {
    vdot: paces.vdot,
    easy: paces.easyPace,
    marathon: paces.marathonPace,
    threshold: paces.thresholdPace,
    interval: paces.intervalPace,
    repetition: paces.repetitionPace,
    recovery: paces.recoveryPace,
    long: {
      min: paces.easyPace.min * 0.95, // Slightly faster than easy
      max: paces.easyPace.max, // Up to slow easy pace
    },
  };
}

// ============ Interval Workout Suggestions ============

/**
 * Suggest interval workouts based on VDOT and race distance
 * Based on Jack Daniels' recommendations
 */
export function suggestIntervalWorkout(
  vdot: number,
  raceDistanceKm: number,
  phase: 'base' | 'build' | 'peak'
): IntervalSuggestion[] {
  const paces = calculateTrainingPacesFromVDOT(vdot);

  // Different workouts based on race distance and phase
  if (raceDistanceKm >= 42) {
    // Marathon intervals
    return getMarathonIntervals(paces, phase);
  } else if (raceDistanceKm >= 21) {
    // Half marathon intervals
    return getHalfMarathonIntervals(paces, phase);
  } else if (raceDistanceKm >= 10) {
    // 10k intervals
    return get10kIntervals(paces, phase);
  } else {
    // 5k intervals
    return get5kIntervals(paces, phase);
  }
}

function getMarathonIntervals(paces: VDOTTrainingPaces, phase: string): IntervalSuggestion[] {
  if (phase === 'base') {
    // Hill repeats for strength
    return [
      {
        distance: 0.2, // 200m hill
        repetitions: 8,
        pace: paces.intervalPace,
        paceZone: 'interval',
        recovery: 90,
        recoveryUnit: 'min',
        recoveryType: 'jog',
      },
    ];
  } else if (phase === 'build') {
    // Threshold intervals (cruise intervals)
    return [
      {
        distance: 1.6, // 1 mile / 1600m
        repetitions: 4,
        pace: paces.thresholdPace,
        paceZone: 'threshold',
        recovery: 1,
        recoveryUnit: 'min',
        recoveryType: 'jog',
      },
    ];
  } else {
    // Marathon-pace intervals
    return [
      {
        distance: 2,
        repetitions: 5,
        pace: paces.marathonPace,
        paceZone: 'threshold',
        recovery: 1,
        recoveryUnit: 'min',
        recoveryType: 'jog',
      },
    ];
  }
}

function getHalfMarathonIntervals(paces: VDOTTrainingPaces, phase: string): IntervalSuggestion[] {
  if (phase === 'base') {
    return [
      {
        distance: 0.2,
        repetitions: 10,
        pace: paces.intervalPace,
        paceZone: 'interval',
        recovery: 60,
        recoveryUnit: 'min',
        recoveryType: 'jog',
      },
    ];
  } else if (phase === 'build') {
    return [
      {
        distance: 1,
        repetitions: 5,
        pace: paces.thresholdPace,
        paceZone: 'threshold',
        recovery: 1,
        recoveryUnit: 'min',
        recoveryType: 'jog',
      },
    ];
  } else {
    // VO2max intervals
    return [
      {
        distance: 1,
        repetitions: 5,
        pace: paces.intervalPace,
        paceZone: 'interval',
        recovery: 3,
        recoveryUnit: 'min',
        recoveryType: 'jog',
      },
    ];
  }
}

function get10kIntervals(paces: VDOTTrainingPaces, phase: string): IntervalSuggestion[] {
  if (phase === 'base') {
    return [
      {
        distance: 0.2,
        repetitions: 12,
        pace: paces.repetitionPace,
        paceZone: 'repetition',
        recovery: 0.2,
        recoveryUnit: 'km',
        recoveryType: 'jog',
      },
    ];
  } else if (phase === 'build') {
    return [
      {
        distance: 0.8,
        repetitions: 6,
        pace: paces.intervalPace,
        paceZone: 'interval',
        recovery: 2.5,
        recoveryUnit: 'min',
        recoveryType: 'jog',
      },
    ];
  } else {
    // Race-specific
    return [
      {
        distance: 1,
        repetitions: 6,
        pace: paces.intervalPace,
        paceZone: 'interval',
        recovery: 3,
        recoveryUnit: 'min',
        recoveryType: 'jog',
      },
    ];
  }
}

function get5kIntervals(paces: VDOTTrainingPaces, phase: string): IntervalSuggestion[] {
  if (phase === 'base') {
    return [
      {
        distance: 0.2,
        repetitions: 10,
        pace: paces.repetitionPace,
        paceZone: 'repetition',
        recovery: 0.2,
        recoveryUnit: 'km',
        recoveryType: 'jog',
      },
    ];
  } else if (phase === 'build') {
    return [
      {
        distance: 0.4,
        repetitions: 12,
        pace: paces.intervalPace,
        paceZone: 'interval',
        recovery: 0.4,
        recoveryUnit: 'km',
        recoveryType: 'jog',
      },
    ];
  } else {
    // Race-specific VO2max
    return [
      {
        distance: 1,
        repetitions: 5,
        pace: paces.intervalPace,
        paceZone: 'interval',
        recovery: 3,
        recoveryUnit: 'min',
        recoveryType: 'jog',
      },
    ];
  }
}

// ============ Race Equivalency Table ============

/**
 * Generate race time predictions for common distances
 */
export function generateRaceEquivalencyTable(vdot: number): Record<string, string> {
  const table: Record<string, string> = {};

  for (const [name, distance] of Object.entries(RACE_DISTANCES)) {
    const timeMinutes = projectRaceTime(vdot, distance);
    table[name] = formatTime(timeMinutes);
  }

  return table;
}

/**
 * Generate training pace table for display
 */
export function generatePaceTable(vdot: number): Record<string, string> {
  const paces = calculateTrainingPacesFromVDOT(vdot);

  return {
    'Recovery': `${formatPace(paces.recoveryPace.min)} - ${formatPace(paces.recoveryPace.max)} /km`,
    'Easy (E)': `${formatPace(paces.easyPace.min)} - ${formatPace(paces.easyPace.max)} /km`,
    'Marathon (M)': `${formatPace(paces.marathonPace)} /km`,
    'Threshold (T)': `${formatPace(paces.thresholdPace)} /km`,
    'Interval (I)': `${formatPace(paces.intervalPace)} /km`,
    'Repetition (R)': `${formatPace(paces.repetitionPace)} /km`,
  };
}
