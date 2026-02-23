import { SessionType } from '../types';
import { SessionTypeCharacteristics } from '../types/suggestions';

/**
 * Comprehensive characteristics for each session type
 * Based on training science and best practices
 */
export const SESSION_CHARACTERISTICS: Record<SessionType, SessionTypeCharacteristics> = {
  easy: {
    type: 'easy',
    intensityLevel: 'easy',
    intensityScore: 2,
    recoveryDaysNeeded: 0,
    maxPerWeek: 5,
    preferredDays: [0, 2, 4], // Monday, Wednesday, Friday
    phases: ['base', 'build', 'peak', 'taper', 'recovery'],
    volumePercent: { min: 10, max: 25 },
    pairsWith: ['easy', 'long', 'recovery', 'strength', 'plyometrics'],
    avoidAfter: [], // Can follow anything
  },

  recovery: {
    type: 'recovery',
    intensityLevel: 'easy',
    intensityScore: 1,
    recoveryDaysNeeded: 0,
    maxPerWeek: 3,
    preferredDays: [0, 4], // Day after hard workouts
    phases: ['base', 'build', 'peak', 'taper', 'recovery'],
    volumePercent: { min: 8, max: 15 },
    pairsWith: ['easy', 'recovery'],
    avoidAfter: [], // Can follow anything (especially good after hard days)
  },

  long: {
    type: 'long',
    intensityLevel: 'moderate',
    intensityScore: 5,
    recoveryDaysNeeded: 1,
    maxPerWeek: 1,
    preferredDays: [5, 6], // Weekend
    phases: ['base', 'build', 'peak'],
    volumePercent: { min: 25, max: 40 },
    pairsWith: ['easy', 'recovery'],
    avoidAfter: ['intervals', 'tempo', 'hill_repeats', 'race'],
  },

  intervals: {
    type: 'intervals',
    intensityLevel: 'very_hard',
    intensityScore: 9,
    recoveryDaysNeeded: 2,
    maxPerWeek: 1,
    preferredDays: [2, 3], // Tuesday/Wednesday (midweek)
    phases: ['build', 'peak'],
    volumePercent: { min: 8, max: 15 },
    pairsWith: ['easy', 'recovery'],
    avoidAfter: ['intervals', 'tempo', 'long', 'hill_repeats', 'race', 'fartlek'],
  },

  tempo: {
    type: 'tempo',
    intensityLevel: 'hard',
    intensityScore: 7,
    recoveryDaysNeeded: 1,
    maxPerWeek: 1,
    preferredDays: [1, 2, 3], // Early/midweek
    phases: ['build', 'peak'],
    volumePercent: { min: 15, max: 25 },
    pairsWith: ['easy', 'recovery', 'strides'],
    avoidAfter: ['intervals', 'tempo', 'hill_repeats', 'race', 'long'],
  },

  race: {
    type: 'race',
    intensityLevel: 'very_hard',
    intensityScore: 10,
    recoveryDaysNeeded: 3,
    maxPerWeek: 1,
    preferredDays: [5, 6], // Weekend
    phases: ['peak', 'taper'],
    volumePercent: { min: 10, max: 25 },
    pairsWith: ['recovery'],
    avoidAfter: ['intervals', 'tempo', 'hill_repeats', 'long', 'race'],
  },

  strides: {
    type: 'strides',
    intensityLevel: 'moderate',
    intensityScore: 4,
    recoveryDaysNeeded: 0,
    maxPerWeek: 2,
    preferredDays: [1, 3, 5], // Can be added to easy runs
    phases: ['base', 'build', 'peak'],
    volumePercent: { min: 5, max: 12 },
    pairsWith: ['easy', 'recovery', 'tempo'],
    avoidAfter: ['race'],
  },

  hill_repeats: {
    type: 'hill_repeats',
    intensityLevel: 'very_hard',
    intensityScore: 8,
    recoveryDaysNeeded: 2,
    maxPerWeek: 1,
    preferredDays: [2, 3],
    phases: ['base', 'build'],
    volumePercent: { min: 10, max: 15 },
    pairsWith: ['easy', 'recovery'],
    avoidAfter: ['intervals', 'tempo', 'hill_repeats', 'long', 'race'],
  },

  progression: {
    type: 'progression',
    intensityLevel: 'hard',
    intensityScore: 6,
    recoveryDaysNeeded: 1,
    maxPerWeek: 1,
    preferredDays: [1, 2, 5], // Early week or weekend
    phases: ['build', 'peak'],
    volumePercent: { min: 15, max: 25 },
    pairsWith: ['easy', 'recovery'],
    avoidAfter: ['intervals', 'tempo', 'hill_repeats', 'race'],
  },

  fartlek: {
    type: 'fartlek',
    intensityLevel: 'hard',
    intensityScore: 7,
    recoveryDaysNeeded: 1,
    maxPerWeek: 1,
    preferredDays: [2, 3, 5],
    phases: ['base', 'build', 'peak'],
    volumePercent: { min: 12, max: 20 },
    pairsWith: ['easy', 'recovery', 'strides'],
    avoidAfter: ['intervals', 'tempo', 'hill_repeats', 'race', 'long'],
  },

  strength: {
    type: 'strength',
    intensityLevel: 'moderate',
    intensityScore: 3,
    recoveryDaysNeeded: 1,
    maxPerWeek: 2,
    preferredDays: [1, 3, 5],
    phases: ['base', 'build', 'peak'],
    volumePercent: { min: 0, max: 0 }, // No distance
    pairsWith: ['easy', 'recovery'],
    avoidAfter: ['race'],
  },

  plyometrics: {
    type: 'plyometrics',
    intensityLevel: 'hard',
    intensityScore: 6,
    recoveryDaysNeeded: 2,
    maxPerWeek: 1,
    preferredDays: [2, 3],
    phases: ['base', 'build'],
    volumePercent: { min: 0, max: 0 }, // No distance
    pairsWith: ['easy', 'recovery'],
    avoidAfter: ['intervals', 'hill_repeats', 'race', 'long'],
  },
};

/**
 * Get intensity score for a session
 */
export function getSessionIntensityScore(session: { type: SessionType }): number {
  return SESSION_CHARACTERISTICS[session.type].intensityScore;
}

/**
 * Check if two session types are compatible in the same week
 */
export function areSessionsCompatible(type1: SessionType, type2: SessionType): boolean {
  const char1 = SESSION_CHARACTERISTICS[type1];
  return char1.pairsWith.includes(type2);
}

/**
 * Check if a session type should be avoided after another
 */
export function shouldAvoidAfter(
  proposedType: SessionType,
  previousType: SessionType
): boolean {
  const proposed = SESSION_CHARACTERISTICS[proposedType];
  return proposed.avoidAfter.includes(previousType);
}

/**
 * Get recommended recovery days for a session type
 */
export function getRecoveryDaysNeeded(type: SessionType): number {
  return SESSION_CHARACTERISTICS[type].recoveryDaysNeeded;
}
