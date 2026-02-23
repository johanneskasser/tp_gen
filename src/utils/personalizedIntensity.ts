import { TrainingSession, TrainingPlan } from '../types';
import { UserProfile, PlanDifficulty, TrainingZones } from '../types/userProfile';
import { calculateTrainingZones, getBestVDOT } from './vdotCalculator';
import { SESSION_CHARACTERISTICS } from '../config/sessionCharacteristics';
import { calculateSessionDistance } from './calculationUtils';
import { IntensityAnalyzer } from './intensityAnalyzer';
import { calculateSessionRPE } from './sessionRPECalculator';

/**
 * Personalized Intensity Calculator
 *
 * Calculates training intensity relative to the user's current fitness level (VDOT)
 * This makes intensity more accurate and personalized than generic session type ratings
 */

/**
 * Calculate relative intensity of a session for a specific user
 * Returns 0-100 score where:
 * - 0-30: Very easy/recovery
 * - 30-50: Easy
 * - 50-70: Moderate
 * - 70-85: Hard
 * - 85-100: Very hard/maximum
 *
 * NOW USES DYNAMIC RPE CALCULATION!
 */
export function calculateRelativeIntensity(
  session: TrainingSession,
  userProfile: UserProfile
): number {
  // If no user profile or VDOT, fall back to generic intensity
  if (!userProfile.vdot && (!userProfile.personalBests || userProfile.personalBests.length === 0)) {
    return SESSION_CHARACTERISTICS[session.type].intensityScore * 10;
  }

  // Get user's VDOT and training zones
  const vdot = userProfile.vdot || getBestVDOT(userProfile.personalBests);
  const zones = calculateTrainingZones(vdot);

  // Use the dynamic RPE calculation (1-10 scale)
  const rpe = calculateSessionRPE(session, zones);

  // Convert RPE (1-10) to 0-100 scale
  // RPE 1 = 10, RPE 5 = 50, RPE 10 = 100
  return rpe * 10;
}

// REMOVED: Old getBaseIntensityForType and adjustIntensityForSessionDetails functions
// Now using dynamic RPE calculation instead!

/**
 * Calculate weekly intensity score relative to user fitness
 * Returns 0-100 where 100 is maximum sustainable intensity for a week
 */
export function calculateWeeklyRelativeIntensity(
  sessions: TrainingSession[],
  userProfile: UserProfile
): number {
  if (sessions.length === 0) return 0;

  let totalWeightedIntensity = 0;
  let totalDistance = 0;

  for (const session of sessions) {
    const intensity = calculateRelativeIntensity(session, userProfile);
    const distance = calculateSessionDistance(session);

    totalWeightedIntensity += intensity * distance;
    totalDistance += distance;
  }

  if (totalDistance === 0) return 0;

  return totalWeightedIntensity / totalDistance;
}

/**
 * Calculate training plan difficulty relative to user's fitness
 * Analyzes volume progression, intensity distribution, and compares to user's current capacity
 */
export function calculatePlanDifficulty(
  plan: TrainingPlan,
  userProfile: UserProfile
): PlanDifficulty {
  const recommendations: string[] = [];
  const warnings: string[] = [];

  // Analyze plan characteristics
  const totalWeeks = plan.weeks.length;
  const peakWeekKm = Math.max(...plan.weeks.map(w => w.totalKm));
  const avgWeeklyKm = plan.weeks.reduce((sum, w) => sum + w.totalKm, 0) / totalWeeks;

  // Calculate training zones for dynamic RPE analysis
  let zones: TrainingZones | undefined;
  if (userProfile.vdot || (userProfile.personalBests && userProfile.personalBests.length > 0)) {
    const vdot = userProfile.vdot || getBestVDOT(userProfile.personalBests);
    zones = calculateTrainingZones(vdot);
  }

  // Calculate hard sessions per week using dynamic RPE
  let totalHardSessions = 0;
  for (const week of plan.weeks) {
    const hardSessions = week.sessions.filter(s => {
      if (zones) {
        // Use dynamic RPE calculation
        const rpe = calculateSessionRPE(s, zones);
        return rpe >= 6; // RPE 6+ is considered "hard"
      } else {
        // Fallback to static characteristics
        const char = SESSION_CHARACTERISTICS[s.type];
        return char.intensityLevel === 'hard' || char.intensityLevel === 'very_hard';
      }
    }).length;
    totalHardSessions += hardSessions;
  }
  const hardSessionsPerWeek = totalHardSessions / totalWeeks;

  // Volume rating (compared to user's current base)
  let volumeRating = 50; // Default moderate
  if (userProfile.weeklyKmBase) {
    const volumeIncrease = (avgWeeklyKm - userProfile.weeklyKmBase) / userProfile.weeklyKmBase;

    if (volumeIncrease > 1.5) {
      volumeRating = 95; // >150% increase = very challenging
      warnings.push('⚠️ Trainingsvolumen ist deutlich höher als deine aktuelle Basis');
      warnings.push('Verletzungsrisiko erhöht - erwäge einen längeren Aufbau');
    } else if (volumeIncrease > 1.0) {
      volumeRating = 85; // >100% increase = challenging
      warnings.push('⚠️ Signifikanter Anstieg des Trainingsvolumens');
      recommendations.push('Achte besonders auf Erholung und Regeneration');
    } else if (volumeIncrease > 0.5) {
      volumeRating = 70; // 50-100% increase = moderate-challenging
      recommendations.push('Moderater Volumenanstieg - achte auf progressive Steigerung');
    } else if (volumeIncrease > 0.2) {
      volumeRating = 55; // 20-50% increase = moderate
      recommendations.push('Guter Volumenanstieg für Progression');
    } else if (volumeIncrease > -0.2) {
      volumeRating = 40; // Similar volume = easy-moderate
    } else {
      volumeRating = 25; // Less volume = easy
      recommendations.push('Dieses Volumen liegt unter deiner aktuellen Basis');
    }
  }

  // Intensity rating (based on hard sessions per week and intensity distribution)
  let intensityRating = 50;

  // Analyze overall intensity using dynamic RPE
  const allSessions = plan.weeks.flatMap(w => w.sessions);
  const intensityAnalyzer = new IntensityAnalyzer(allSessions, zones); // Pass zones for dynamic RPE
  const intensityDist = intensityAnalyzer.analyzeDistribution();

  if (intensityDist.current.hard > 0.25) {
    intensityRating = 90;
    warnings.push('⚠️ Sehr hoher Anteil an hartem Training (>25%)');
    warnings.push('Übertrainingsrisiko - erwäge mehr Easy Runs');
  } else if (intensityDist.current.hard > 0.20) {
    intensityRating = 80;
    warnings.push('Hoher Anteil an hartem Training (20-25%)');
  } else if (intensityDist.current.hard > 0.15) {
    intensityRating = 65;
  } else if (intensityDist.current.hard < 0.08) {
    intensityRating = 30;
    recommendations.push('Geringer Intensitätsanteil - gut für Aufbauphase');
  } else {
    intensityRating = 50; // Sweet spot around 10-15%
    recommendations.push('Gute Intensitätsverteilung nach 80/20-Prinzip');
  }

  // Hard sessions per week
  if (hardSessionsPerWeek > 3) {
    warnings.push(`⚠️ Durchschnittlich ${hardSessionsPerWeek.toFixed(1)} harte Einheiten/Woche - sehr anspruchsvoll`);
  } else if (hardSessionsPerWeek > 2.5) {
    warnings.push(`Hohe Intensität mit ${hardSessionsPerWeek.toFixed(1)} harten Einheiten/Woche`);
  }

  // Peak week analysis
  if (userProfile.weeklyKmBase && peakWeekKm > userProfile.weeklyKmBase * 2) {
    warnings.push('⚠️ Spitzenwoche ist mehr als doppelt so hoch wie deine Basis');
  }

  // VDOT-based recommendations
  if (userProfile.vdot || userProfile.personalBests.length > 0) {
    const vdot = userProfile.vdot || getBestVDOT(userProfile.personalBests);

    // Target race pace analysis
    if (plan.event.targetTime) {
      recommendations.push(`Dein aktuelles VDOT: ${vdot.toFixed(1)}`);
    }
  }

  // Overall difficulty score (weighted combination)
  const overallScore = Math.round(
    volumeRating * 0.5 + // Volume is 50% of difficulty
    intensityRating * 0.5 // Intensity is 50%
  );

  // Determine difficulty category
  let overall: PlanDifficulty['overall'];
  if (overallScore < 30) {
    overall = 'very_easy';
  } else if (overallScore < 50) {
    overall = 'easy';
  } else if (overallScore < 65) {
    overall = 'moderate';
  } else if (overallScore < 80) {
    overall = 'challenging';
  } else if (overallScore < 90) {
    overall = 'very_challenging';
  } else {
    overall = 'extreme';
  }

  // General recommendations based on overall difficulty
  if (overall === 'extreme' || overall === 'very_challenging') {
    recommendations.push('💡 Dieser Plan ist sehr anspruchsvoll - stelle sicher, dass du gut vorbereitet bist');
    recommendations.push('Baue Ruhetage ein und höre auf deinen Körper');
  } else if (overall === 'challenging') {
    recommendations.push('💡 Dieser Plan wird dich fordern - plane ausreichend Erholung ein');
  } else if (overall === 'very_easy') {
    recommendations.push('💡 Dieser Plan könnte zu leicht für dich sein');
    recommendations.push('Erwäge einen ambitionierteren Plan für bessere Fortschritte');
  }

  return {
    overall,
    score: overallScore,
    breakdown: {
      volumeRating,
      intensityRating,
      peakWeekKm,
      avgWeeklyKm,
      hardSessionsPerWeek,
    },
    recommendations,
    warnings,
  };
}

/**
 * Get difficulty label and color for UI display
 */
export function getDifficultyDisplay(difficulty: PlanDifficulty['overall']): {
  label: string;
  color: string;
  bgColor: string;
  emoji: string;
} {
  switch (difficulty) {
    case 'very_easy':
      return {
        label: 'Sehr Leicht',
        color: 'text-green-800',
        bgColor: 'bg-green-100',
        emoji: '😌',
      };
    case 'easy':
      return {
        label: 'Leicht',
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        emoji: '🙂',
      };
    case 'moderate':
      return {
        label: 'Moderat',
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        emoji: '💪',
      };
    case 'challenging':
      return {
        label: 'Herausfordernd',
        color: 'text-orange-700',
        bgColor: 'bg-orange-50',
        emoji: '🔥',
      };
    case 'very_challenging':
      return {
        label: 'Sehr Anspruchsvoll',
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        emoji: '💥',
      };
    case 'extreme':
      return {
        label: 'Extrem',
        color: 'text-red-900',
        bgColor: 'bg-red-100',
        emoji: '⚠️',
      };
  }
}

/**
 * Format relative intensity for display
 */
export function formatRelativeIntensity(intensity: number): {
  label: string;
  color: string;
} {
  if (intensity < 30) {
    return { label: 'Sehr Leicht', color: 'text-green-600' };
  } else if (intensity < 50) {
    return { label: 'Leicht', color: 'text-green-500' };
  } else if (intensity < 70) {
    return { label: 'Moderat', color: 'text-blue-600' };
  } else if (intensity < 85) {
    return { label: 'Hart', color: 'text-orange-600' };
  } else {
    return { label: 'Sehr Hart', color: 'text-red-600' };
  }
}
