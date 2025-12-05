import { PersonalBest, TrainingZones } from '../types/userProfile';

/**
 * VDOT Calculator based on Jack Daniels' Running Formula
 *
 * VDOT is a measure of running fitness that accounts for running economy.
 * It's calculated from race performances and used to determine training paces.
 *
 * Reference: "Daniels' Running Formula" by Jack Daniels
 */

/**
 * Convert time string to seconds
 * Supports formats: "HH:MM:SS", "MM:SS", "SS"
 */
function timeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);

  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  } else {
    // Just seconds
    return parts[0];
  }
}

/**
 * Get distance in km from race type
 */
function getDistanceKm(distance: PersonalBest['distance'], customKm?: number): number {
  switch (distance) {
    case '5K':
      return 5;
    case '10K':
      return 10;
    case 'HALF_MARATHON':
      return 21.0975;
    case 'MARATHON':
      return 42.195;
    case 'CUSTOM':
      return customKm || 10;
  }
}

/**
 * Calculate VDOT from race performance
 * Uses Jack Daniels' VDOT formula
 *
 * Simplified formula:
 * VO2 = -4.60 + 0.182258 * velocity + 0.000104 * velocity^2
 * %VO2Max = 0.8 + 0.1894393 * e^(-0.012778 * time_minutes) + 0.2989558 * e^(-0.1932605 * time_minutes)
 * VDOT = VO2 / %VO2Max
 */
export function calculateVDOT(pb: PersonalBest): number {
  const distanceKm = getDistanceKm(pb.distance, pb.customDistanceKm);
  const timeSeconds = timeToSeconds(pb.time);
  const timeMinutes = timeSeconds / 60;

  // Velocity in meters per minute
  const velocityMpm = (distanceKm * 1000) / timeMinutes;

  // Calculate VO2
  const vo2 = -4.60 + 0.182258 * velocityMpm + 0.000104 * Math.pow(velocityMpm, 2);

  // Calculate percentage of VO2max used
  const percentVO2Max = 0.8 +
    0.1894393 * Math.exp(-0.012778 * timeMinutes) +
    0.2989558 * Math.exp(-0.1932605 * timeMinutes);

  // VDOT
  const vdot = vo2 / percentVO2Max;

  return Math.round(vdot * 10) / 10; // Round to 1 decimal
}

/**
 * Get the best VDOT from multiple personal bests
 * Usually the most recent or best performance
 */
export function getBestVDOT(personalBests: PersonalBest[]): number {
  if (personalBests.length === 0) {
    return 40; // Default moderate fitness
  }

  const vdots = personalBests.map(pb => calculateVDOT(pb));
  return Math.max(...vdots);
}

/**
 * Calculate training zones from VDOT
 * Based on Jack Daniels' training pace tables
 */
export function calculateTrainingZones(vdot: number): TrainingZones {
  // These formulas approximate Jack Daniels' VDOT tables
  // Paces are in min/km

  // Easy pace (E): 59-74% of VO2max, conversational pace
  const easyPaceMiddle = 60 / (0.29 * vdot + 3.5);
  const easyPaceMin = easyPaceMiddle * 0.95; // 5% slower
  const easyPaceMax = easyPaceMiddle * 1.05; // 5% faster

  // Marathon pace (M): 80-85% of VO2max
  const marathonPace = 60 / (0.26 * vdot + 2.8);

  // Threshold pace (T): 88-92% of VO2max, comfortably hard
  const thresholdPace = 60 / (0.29 * vdot + 1.5);

  // Interval pace (I): 95-100% of VO2max
  const intervalPace = 60 / (0.36 * vdot);

  // Repetition pace (R): 105-110% of VO2max, fast but controlled
  const repetitionPace = 60 / (0.39 * vdot);

  // Recovery pace: even slower than easy
  const recoveryPaceMin = easyPaceMax;
  const recoveryPaceMax = easyPaceMax * 1.15;

  // Long run pace: similar to easy, but toward slower end
  const longPaceMin = easyPaceMiddle;
  const longPaceMax = easyPaceMax;

  return {
    vdot,
    easy: { min: easyPaceMin, max: easyPaceMax },
    marathon: marathonPace,
    threshold: thresholdPace,
    interval: intervalPace,
    repetition: repetitionPace,
    recovery: { min: recoveryPaceMin, max: recoveryPaceMax },
    long: { min: longPaceMin, max: longPaceMax },
  };
}

/**
 * Estimate VO2max from VDOT
 * Rough approximation: VO2max ≈ VDOT
 * (They're similar but not exactly the same)
 */
export function estimateVO2Max(vdot: number): number {
  return vdot;
}

/**
 * Get pace category based on VDOT
 * Helps users understand their fitness level
 */
export function getFitnessCategory(vdot: number): {
  category: string;
  description: string;
  percentile: number; // Rough percentile among runners
} {
  if (vdot < 30) {
    return {
      category: 'Anfänger',
      description: 'Du bist am Anfang deiner Laufkarriere',
      percentile: 10,
    };
  } else if (vdot < 40) {
    return {
      category: 'Freizeitläufer',
      description: 'Du läufst regelmäßig und baust Fitness auf',
      percentile: 30,
    };
  } else if (vdot < 50) {
    return {
      category: 'Fortgeschrittener',
      description: 'Du trainierst strukturiert und hast gute Grundfitness',
      percentile: 50,
    };
  } else if (vdot < 60) {
    return {
      category: 'Ambitionierter Läufer',
      description: 'Du bist schnell und trainierst fokussiert',
      percentile: 75,
    };
  } else if (vdot < 70) {
    return {
      category: 'Leistungsläufer',
      description: 'Du gehörst zu den schnellsten Hobbyläufern',
      percentile: 90,
    };
  } else {
    return {
      category: 'Elite',
      description: 'Du bist auf nationalem/internationalem Niveau',
      percentile: 99,
    };
  }
}

/**
 * Project race time based on VDOT
 * Useful for goal setting
 */
export function projectRaceTime(vdot: number, distanceKm: number): string {
  // Use reverse VDOT calculation
  // This is a simplified projection

  let timeMinutes: number;

  if (distanceKm <= 5) {
    // 5K projection
    timeMinutes = distanceKm * 1000 / (0.36 * vdot * 60);
  } else if (distanceKm <= 10) {
    // 10K projection
    timeMinutes = distanceKm * 1000 / (0.33 * vdot * 60);
  } else if (distanceKm <= 21.1) {
    // Half marathon projection
    timeMinutes = distanceKm * 1000 / (0.30 * vdot * 60);
  } else {
    // Marathon projection
    timeMinutes = distanceKm * 1000 / (0.26 * vdot * 60);
  }

  const hours = Math.floor(timeMinutes / 60);
  const minutes = Math.floor(timeMinutes % 60);
  const seconds = Math.floor((timeMinutes % 1) * 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

/**
 * Format pace for display
 */
export function formatPace(paceMinPerKm: number): string {
  const minutes = Math.floor(paceMinPerKm);
  const seconds = Math.round((paceMinPerKm % 1) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
}

/**
 * Example usage:
 *
 * const pb: PersonalBest = {
 *   distance: '10K',
 *   time: '45:00' // 45 minutes
 * };
 *
 * const vdot = calculateVDOT(pb); // ~50
 * const zones = calculateTrainingZones(vdot);
 *
 * console.log(`Easy pace: ${formatPace(zones.easy.min)} - ${formatPace(zones.easy.max)}`);
 * console.log(`Threshold pace: ${formatPace(zones.threshold)}`);
 */
