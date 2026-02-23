import { TrainingSession, IntervalSet } from '../types';
import { TrainingZones } from '../types/userProfile';
import { SESSION_CHARACTERISTICS } from '../config/sessionCharacteristics';
import { calculateSessionDistance } from './calculationUtils';

/**
 * Advanced Session RPE Calculator
 *
 * Calculates Rate of Perceived Exertion (RPE) dynamically based on:
 * - User's VDOT and training zones
 * - Actual pace vs zone pace
 * - Distance/duration (fatigue accumulation)
 * - Interval repetitions and recovery
 * - Session type characteristics
 *
 * Based on:
 * - Jack Daniels' VDOT system
 * - Borg RPE Scale (1-10)
 * - TRIMP (Training Impulse) principles
 * - 80/20 training intensity distribution
 *
 * References:
 * - Daniels' Running Formula
 * - Bannister's TRIMP formula
 * - Heart Rate Reserve and intensity scaling
 */

/**
 * Parse pace string (e.g., "4:30") to minutes per km
 */
function parsePace(pace: string | undefined): number | null {
  if (!pace) return null;

  const parts = pace.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0]);
    const seconds = parseInt(parts[1]);
    return minutes + seconds / 60;
  }

  return null;
}

/**
 * Calculate RPE based on pace relative to training zones
 * Using the relationship between %VO2max and perceived exertion
 */
function calculatePaceBasedRPE(
  paceMinPerKm: number,
  zones: TrainingZones
): number {
  // Recovery pace (< 59% VO2max): RPE 1-2
  if (paceMinPerKm >= zones.recovery.min) {
    return 1.5;
  }

  // Easy pace (59-74% VO2max): RPE 2-4
  if (paceMinPerKm >= zones.easy.min && paceMinPerKm <= zones.easy.max) {
    // Linear interpolation within easy zone
    const easyRange = zones.easy.max - zones.easy.min;
    const position = (zones.easy.max - paceMinPerKm) / easyRange;
    return 2 + position * 2; // 2-4 RPE
  }

  // Long run pace (similar to easy): RPE 3-5
  if (paceMinPerKm >= zones.long.min && paceMinPerKm <= zones.long.max) {
    return 4;
  }

  // Marathon pace (75-84% VO2max): RPE 5-6
  if (paceMinPerKm <= zones.marathon && paceMinPerKm > zones.threshold) {
    return 5.5;
  }

  // Threshold pace (83-88% VO2max): RPE 6-7
  if (paceMinPerKm <= zones.threshold && paceMinPerKm > zones.interval) {
    return 7;
  }

  // Interval pace (95-100% VO2max): RPE 8-9
  if (paceMinPerKm <= zones.interval && paceMinPerKm > zones.repetition) {
    return 8.5;
  }

  // Repetition pace (105-110% VO2max): RPE 9-10
  if (paceMinPerKm <= zones.repetition) {
    return 9.5;
  }

  // Default: moderate
  return 5;
}

/**
 * Calculate distance-based fatigue factor
 * Longer distances increase RPE exponentially
 * Based on glycogen depletion and fatigue accumulation
 */
function calculateDistanceFatigueFactor(distanceKm: number): number {
  if (distanceKm <= 10) {
    return 0; // No additional fatigue
  } else if (distanceKm <= 15) {
    return 0.5; // Slight increase
  } else if (distanceKm <= 21) {
    return 1.0; // Half marathon distance
  } else if (distanceKm <= 30) {
    return 1.5; // Long training runs
  } else {
    return 2.0; // Marathon+ distance
  }
}

/**
 * Calculate duration-based fatigue factor
 * Time on feet matters more for longer sessions
 */
function calculateDurationFatigueFactor(durationMin: number): number {
  if (durationMin <= 60) {
    return 0;
  } else if (durationMin <= 90) {
    return 0.5;
  } else if (durationMin <= 120) {
    return 1.0;
  } else {
    return 1.5;
  }
}

/**
 * Calculate RPE for interval training
 * Accounts for:
 * - Work interval intensity (pace compared to personal training zones)
 * - Number of repetitions (cumulative fatigue)
 * - Recovery duration (incomplete recovery increases RPE)
 * - Total interval volume
 */
function calculateIntervalRPE(
  intervals: IntervalSet[],
  zones: TrainingZones,
  warmUp?: number,
  coolDown?: number
): number {
  let maxRPE = 0;
  let totalIntervalVolume = 0;
  let totalIntervalStress = 0;

  for (const interval of intervals) {
    const pace = parsePace(interval.pace);
    const reps = interval.repetitions || 1;
    const distance = interval.distance || 0;

    // Base RPE from pace - COMPARE WITH PERSONAL TRAINING ZONES
    let intervalRPE = 8; // Default for intervals if no pace specified
    if (pace) {
      // Use the pace-based RPE that compares with user's personal zones
      intervalRPE = calculatePaceBasedRPE(pace, zones);

      // Additional context: if pace is in interval zone or faster, boost RPE slightly
      // because intervals at your VO2max pace are supposed to be very hard
      if (pace <= zones.interval) {
        // This is true interval intensity (95-100% VO2max)
        intervalRPE = Math.max(intervalRPE, 8.5); // Minimum RPE for true intervals
      }

      // If pace is even faster than interval pace (repetition pace), it's maximum effort
      if (pace <= zones.repetition) {
        intervalRPE = Math.max(intervalRPE, 9.0); // Near-maximum effort
      }
    }

    // Volume of this interval set
    const volume = distance * reps;
    totalIntervalVolume += volume;

    // Recovery factor - shorter recovery = higher stress
    // Incomplete recovery increases lactate accumulation and perceived effort
    const recovery = parseFloat(interval.recovery || '0');
    let recoveryFactor = 1.0;
    if (interval.recoveryUnit === 'min') {
      // Active recovery less than 2 minutes is hard
      if (recovery < 1) recoveryFactor = 1.3; // Very short recovery = much harder
      else if (recovery < 2) recoveryFactor = 1.15; // Short recovery = harder
      else if (recovery < 3) recoveryFactor = 1.05; // Moderate recovery
      else recoveryFactor = 1.0; // Full recovery
    } else {
      // Recovery in km (jogging recovery)
      if (recovery < 0.2) recoveryFactor = 1.3; // 200m recovery or less = very hard
      else if (recovery < 0.4) recoveryFactor = 1.15; // 200-400m = hard
      else if (recovery < 0.6) recoveryFactor = 1.05; // 400-600m = moderate
      else recoveryFactor = 1.0; // 600m+ = full recovery
    }

    // Repetition fatigue - each additional rep increases RPE
    // Based on TRIMP principle: cumulative stress and lactate accumulation
    // First 4 reps are baseline, additional reps increase difficulty exponentially
    let repsFactor = 1.0;
    if (reps <= 4) {
      repsFactor = 1.0; // Standard interval session
    } else if (reps <= 8) {
      repsFactor = 1 + (reps - 4) * 0.08; // +8% per rep above 4
    } else {
      // Very high rep sessions (8+) get exponentially harder
      repsFactor = 1.32 + (reps - 8) * 0.12; // +12% per rep above 8
    }

    // Calculate adjusted RPE for this interval set
    const adjustedRPE = intervalRPE * recoveryFactor * repsFactor;
    totalIntervalStress += adjustedRPE * volume;

    maxRPE = Math.max(maxRPE, adjustedRPE);
  }

  // Calculate weighted average RPE (weighted by distance)
  let avgRPE = totalIntervalVolume > 0
    ? totalIntervalStress / totalIntervalVolume
    : maxRPE;

  // Add volume factor - high total interval volume increases RPE
  // More than 6-8km of intervals is a very demanding session
  if (totalIntervalVolume > 10) {
    avgRPE += 0.8; // Massive volume
  } else if (totalIntervalVolume > 8) {
    avgRPE += 0.5; // Very high volume
  } else if (totalIntervalVolume > 6) {
    avgRPE += 0.3; // High volume
  }

  // The RPE score should reflect the HARD WORK of the intervals
  // Warm-up and cool-down are just preparation/recovery, not the main stress
  // Don't dilute the interval RPE too much with warm-up/cool-down

  // Only slightly reduce RPE if warm-up/cool-down are very long compared to intervals
  const totalDistance = totalIntervalVolume + (warmUp || 0) + (coolDown || 0);
  const intervalPercentage = totalIntervalVolume / totalDistance;

  // If intervals are less than 40% of total session, slightly reduce RPE
  // But never reduce by more than 1 point - the intervals are still the key stress
  if (intervalPercentage < 0.4) {
    const reductionFactor = Math.max(0.85, intervalPercentage / 0.4); // Max 15% reduction
    avgRPE = avgRPE * reductionFactor;
  }

  return Math.min(10, avgRPE);
}

/**
 * Calculate RPE for progression runs
 * RPE increases as pace increases throughout run
 */
function calculateProgressionRPE(
  session: TrainingSession,
  zones: TrainingZones
): number {
  const startPace = parsePace(session.progression?.startPace);
  const endPace = parsePace(session.progression?.endPace);
  const distance = session.progression?.totalDistance || 0;

  if (!startPace || !endPace) {
    return 6; // Default progression RPE
  }

  const startRPE = calculatePaceBasedRPE(startPace, zones);
  const endRPE = calculatePaceBasedRPE(endPace, zones);

  // Weighted average favoring the end pace (where you're most fatigued)
  const avgRPE = startRPE * 0.3 + endRPE * 0.7;

  // Add distance fatigue
  const distanceFactor = calculateDistanceFatigueFactor(distance);

  return Math.min(10, avgRPE + distanceFactor * 0.3);
}

/**
 * Calculate RPE for hill repeats
 * Hills significantly increase RPE due to muscular and cardiovascular demand
 */
function calculateHillRepeatsRPE(
  session: TrainingSession
): number {
  const reps = session.hillRepeats?.repetitions || 6;
  const distance = session.hillRepeats?.distance || 0.4;
  const grade = session.hillRepeats?.grade || 5;

  // Base hill RPE is very hard
  let hillRPE = 8.5;

  // Adjust for grade - steeper = harder
  const gradeFactor = Math.min(grade / 5, 2); // 5% is baseline, max 2x
  hillRPE += gradeFactor * 0.5;

  // Adjust for reps - more reps = cumulative fatigue
  const repsFactor = 1 + (reps - 6) * 0.05; // 6 reps is baseline
  hillRPE *= repsFactor;

  // Adjust for distance - longer hills = harder
  if (distance > 0.5) {
    hillRPE += 0.3;
  } else if (distance < 0.3) {
    hillRPE -= 0.2;
  }

  return Math.min(10, hillRPE);
}

/**
 * Calculate RPE for tempo/threshold runs
 * Accounts for distance at threshold pace
 */
function calculateTempoRPE(
  session: TrainingSession,
  zones: TrainingZones
): number {
  const distance = session.distance || 0;
  const duration = session.duration;
  const pace = duration && distance ? (duration / distance) : null;

  // Base tempo RPE from pace
  let tempoRPE = 7; // Default threshold RPE
  if (pace) {
    tempoRPE = calculatePaceBasedRPE(pace, zones);
  }

  // Distance at threshold significantly increases RPE
  const distanceAtThreshold = distance - (session.warmUp || 0) - (session.coolDown || 0);
  if (distanceAtThreshold > 12) {
    tempoRPE += 1.0; // Very long tempo
  } else if (distanceAtThreshold > 8) {
    tempoRPE += 0.5; // Long tempo
  }

  return Math.min(10, tempoRPE);
}

/**
 * Calculate RPE for standard distance-based runs (easy, long, recovery)
 */
function calculateStandardRunRPE(
  session: TrainingSession,
  zones: TrainingZones
): number {
  const distance = session.distance || 0;
  const duration = session.duration;
  const pace = duration && distance ? (duration / distance) : null;

  // Get base characteristics
  const baseScore = SESSION_CHARACTERISTICS[session.type].intensityScore;
  let rpe = baseScore * 1.0; // Convert 1-10 score to RPE

  // Adjust based on actual pace if available
  if (pace) {
    rpe = calculatePaceBasedRPE(pace, zones);
  }

  // Add distance fatigue
  const distanceFactor = calculateDistanceFatigueFactor(distance);
  rpe += distanceFactor * 0.5;

  // Add duration fatigue if duration specified
  if (duration) {
    const durationFactor = calculateDurationFatigueFactor(duration);
    rpe += durationFactor * 0.3;
  }

  return Math.min(10, rpe);
}

/**
 * Main function: Calculate session RPE dynamically
 *
 * Returns RPE on scale of 1-10 where:
 * 1-2: Very easy (recovery)
 * 3-4: Easy (conversational)
 * 5-6: Moderate (comfortable)
 * 7-8: Hard (threshold/tempo)
 * 9-10: Very hard (intervals, race)
 */
export function calculateSessionRPE(
  session: TrainingSession,
  zones: TrainingZones
): number {
  // Handle different session types
  switch (session.type) {
    case 'intervals':
      if (session.intervals && session.intervals.length > 0) {
        return calculateIntervalRPE(
          session.intervals,
          zones,
          session.warmUp,
          session.coolDown
        );
      }
      return 8.5; // Default interval RPE

    case 'progression':
      return calculateProgressionRPE(session, zones);

    case 'hill_repeats':
      return calculateHillRepeatsRPE(session);

    case 'tempo':
      return calculateTempoRPE(session, zones);

    case 'fartlek': {
      // Fartlek is variable - use moderate-hard default with volume adjustment
      const distance = calculateSessionDistance(session);
      const baseFartlek = 7;
      const distanceFactor = calculateDistanceFatigueFactor(distance);
      return Math.min(10, baseFartlek + distanceFactor * 0.3);
    }

    case 'race': {
      // Race is maximum effort, but duration matters
      const raceDistance = session.distance || 10;
      if (raceDistance <= 5) return 10; // Short race = max RPE
      if (raceDistance <= 10) return 9.5;
      if (raceDistance <= 21.1) return 9;
      return 8.5; // Marathon = slightly lower RPE due to pacing
    }

    case 'strides':
      // Strides are short and fast but low volume
      return 4.5;

    case 'strength':
    case 'plyometrics':
      // Non-running workouts - use base characteristics
      return SESSION_CHARACTERISTICS[session.type].intensityScore * 1.0;

    default:
      // Standard runs: easy, long, recovery
      return calculateStandardRunRPE(session, zones);
  }
}

/**
 * Get RPE label and emoji for display
 */
export function getRPELabel(rpe: number): {
  label: string;
  emoji: string;
  description: string;
} {
  if (rpe < 2) {
    return {
      label: 'Sehr Locker',
      emoji: '😌',
      description: 'Regeneration - Sehr einfach, fast entspannend'
    };
  } else if (rpe < 4) {
    return {
      label: 'Locker',
      emoji: '🙂',
      description: 'Easy - Gesprächstempo möglich'
    };
  } else if (rpe < 6) {
    return {
      label: 'Moderat',
      emoji: '💪',
      description: 'Komfortabel aber spürbar'
    };
  } else if (rpe < 8) {
    return {
      label: 'Hart',
      emoji: '🔥',
      description: 'Threshold - Anstrengend, kurze Sätze möglich'
    };
  } else if (rpe < 9) {
    return {
      label: 'Sehr Hart',
      emoji: '💥',
      description: 'VO2max - Sehr anstrengend, kaum sprechen möglich'
    };
  } else {
    return {
      label: 'Maximal',
      emoji: '⚡',
      description: 'Maximum - Höchste Anstrengung, nicht lange haltbar'
    };
  }
}

/**
 * Calculate average RPE for entire week
 * Weighted by distance/duration
 */
export function calculateWeeklyAverageRPE(
  sessions: TrainingSession[],
  zones: TrainingZones
): number {
  if (sessions.length === 0) return 0;

  let totalWeightedRPE = 0;
  let totalDistance = 0;

  for (const session of sessions) {
    const rpe = calculateSessionRPE(session, zones);
    const distance = calculateSessionDistance(session);

    totalWeightedRPE += rpe * distance;
    totalDistance += distance;
  }

  return totalDistance > 0 ? totalWeightedRPE / totalDistance : 0;
}

/**
 * Convert RPE score to intensity level category
 * Used for weekly intensity distribution analysis
 */
export function getIntensityLevelFromRPE(rpe: number): 'easy' | 'moderate' | 'hard' | 'very_hard' {
  if (rpe < 4) {
    return 'easy';
  } else if (rpe < 6) {
    return 'moderate';
  } else if (rpe < 8) {
    return 'hard';
  } else {
    return 'very_hard';
  }
}
