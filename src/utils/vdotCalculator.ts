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
 * @throws {Error} if the time string is invalid
 */
function timeToSeconds(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') {
    throw new Error('Invalid time string: time must be a non-empty string');
  }

  const trimmed = timeStr.trim();
  if (trimmed.length === 0) {
    throw new Error('Invalid time string: time cannot be empty');
  }

  const parts = trimmed.split(':');

  if (parts.length === 0 || parts.length > 3) {
    throw new Error('Invalid time format: use HH:MM:SS, MM:SS, or SS');
  }

  const numbers = parts.map(p => {
    const num = Number(p);
    if (isNaN(num) || num < 0) {
      throw new Error(`Invalid time component: ${p} is not a valid number`);
    }
    return num;
  });

  let totalSeconds = 0;

  if (numbers.length === 3) {
    // HH:MM:SS
    const [hours, minutes, seconds] = numbers;
    if (minutes >= 60 || seconds >= 60) {
      throw new Error('Invalid time: minutes and seconds must be less than 60');
    }
    totalSeconds = hours * 3600 + minutes * 60 + seconds;
  } else if (numbers.length === 2) {
    // MM:SS
    const [minutes, seconds] = numbers;
    if (seconds >= 60) {
      throw new Error('Invalid time: seconds must be less than 60');
    }
    totalSeconds = minutes * 60 + seconds;
  } else {
    // Just seconds
    totalSeconds = numbers[0];
  }

  if (totalSeconds <= 0) {
    throw new Error('Invalid time: total time must be greater than 0');
  }

  return totalSeconds;
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
 * Calculate training zones from VDOT using Daniels-Gilbert formula
 * Based on Jack Daniels' Running Formula tables
 *
 * This uses the reverse calculation: from %VO2max to velocity to pace
 * Reference: Jack Daniels' Running Formula (3rd Edition)
 * Source: https://vdoto2.com/calculator and https://sport-calculator.com/calculators/running/jack-daniels-running-calculator
 */
export function calculateTrainingZones(vdot: number): TrainingZones {
  /**
   * Calculate pace for a given %VO2max
   * We need to solve for velocity where the effort can be sustained
   */
  function paceForPercentVO2(percentVO2: number): number {
    // For steady-state running, we use the velocity that produces this %VO2
    const vo2 = vdot * percentVO2;

    // Solve quadratic: 0.000104 * V² + 0.182258 * V + (-4.60 - VO2) = 0
    const a = 0.000104;
    const b = 0.182258;
    const c = -4.60 - vo2;

    const discriminant = b * b - 4 * a * c;
    const velocityMpm = (-b + Math.sqrt(discriminant)) / (2 * a); // meters per minute

    // Convert to min/km
    const paceMinPerKm = 1000 / velocityMpm;
    return paceMinPerKm;
  }

  // Easy pace (E): 59-74% of VO2max
  // Jack Daniels specifies this as conversational pace
  // Note: Higher %VO2 = faster pace (lower min/km), so we swap min/max
  const easyPaceMin = paceForPercentVO2(0.70); // Faster end (~70%) = lower min/km
  const easyPaceMax = paceForPercentVO2(0.59); // Slower end (59%) = higher min/km

  // Marathon pace (M): ~80-85% of VO2max
  // For marathon distance, we need to account for duration
  // Use the race prediction for marathon pace
  const marathonTimeStr = projectRaceTime(vdot, 42.195);
  const marathonTimeMinutes = parseTimeToMinutes(marathonTimeStr);
  const marathonPace = marathonTimeMinutes / 42.195;

  // Threshold pace (T): 83-88% of VO2max
  // Comfortably hard, sustainable for ~1 hour
  // Calibrated to match Jack Daniels tables
  const thresholdPace = paceForPercentVO2(0.91);

  // Interval pace (I): 95-100% of VO2max
  // Hard effort, sustainable for 10-12 minutes
  // Calibrated to match Jack Daniels tables
  const intervalPace = paceForPercentVO2(1.05);

  // Repetition pace (R): 105-110% of VO2max
  // Fast but controlled, with full recovery
  // Calibrated to match Jack Daniels tables
  const repetitionPace = paceForPercentVO2(1.15);

  // Recovery pace: slightly slower than easy
  const recoveryPaceMin = easyPaceMax;
  const recoveryPaceMax = easyPaceMax * 1.15;

  // Long run pace: similar to easy, toward slower end
  const longPaceMin = easyPaceMin * 0.95;
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
 * Helper: Parse time string to minutes
 */
function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 60 + parts[1] + parts[2] / 60;
  } else {
    return parts[0] + parts[1] / 60;
  }
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
 * Calculate velocity from VDOT and %VO2max
 * Uses the reverse of the Daniels-Gilbert formula
 *
 * Based on: VO2 = -4.60 + 0.182258 * V + 0.000104 * V²
 * Where V is velocity in meters per minute
 */
function velocityFromVDOT(vdot: number, percentVO2Max: number): number {
  // VO2 at this percentage
  const vo2 = vdot * percentVO2Max;

  // Solve quadratic equation: 0.000104 * V² + 0.182258 * V + (-4.60 - VO2) = 0
  const a = 0.000104;
  const b = 0.182258;
  const c = -4.60 - vo2;

  // Quadratic formula
  const discriminant = b * b - 4 * a * c;
  const velocity = (-b + Math.sqrt(discriminant)) / (2 * a);

  return velocity; // meters per minute
}

/**
 * Calculate %VO2max from race duration (in minutes)
 * Based on Jack Daniels' formula:
 * %VO2max = 0.8 + 0.1894393 * e^(-0.012778*T) + 0.2989558 * e^(-0.1932605*T)
 */
function percentVO2MaxFromTime(timeMinutes: number): number {
  return 0.8 +
    0.1894393 * Math.exp(-0.012778 * timeMinutes) +
    0.2989558 * Math.exp(-0.1932605 * timeMinutes);
}

/**
 * Project race time based on VDOT using Daniels-Gilbert formula
 * This uses an iterative approach to find the time where the formula balances
 *
 * Reference: Jack Daniels' Running Formula (3rd Edition)
 * Formula source: https://sport-calculator.com/blog/how-to-predict-race-times-vdot-critical-speed
 */
export function projectRaceTime(vdot: number, distanceKm: number): string {
  const distanceMeters = distanceKm * 1000;

  // Initial guess based on distance
  // These are rough estimates to start the iteration
  let timeMinutes: number;
  if (distanceKm <= 5) {
    timeMinutes = distanceKm * 5; // ~5:00/km initial guess
  } else if (distanceKm <= 10) {
    timeMinutes = distanceKm * 5.5; // ~5:30/km initial guess
  } else if (distanceKm <= 21.1) {
    timeMinutes = distanceKm * 6; // ~6:00/km initial guess
  } else {
    timeMinutes = distanceKm * 6.5; // ~6:30/km initial guess
  }

  // Newton-Raphson iteration to find correct time
  for (let i = 0; i < 20; i++) {
    const percentVO2 = percentVO2MaxFromTime(timeMinutes);
    const velocity = velocityFromVDOT(vdot, percentVO2);
    const predictedTime = distanceMeters / velocity;

    // Check convergence
    if (Math.abs(predictedTime - timeMinutes) < 0.01) {
      timeMinutes = predictedTime;
      break;
    }

    // Adjust estimate
    timeMinutes = predictedTime;
  }

  // Format time
  const totalSeconds = Math.round(timeMinutes * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

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
 * Calculate training zones with gender-specific adjustments
 * Women may need slightly easier recovery paces due to physiological differences
 */
export function calculateTrainingZonesWithBiomarkers(
  vdot: number,
  gender?: 'male' | 'female' | 'other'
): TrainingZones & { recommendations?: string[] } {
  const zones = calculateTrainingZones(vdot);

  // Gender-specific adjustments (subtle, based on research)
  if (gender === 'female') {
    // Women often benefit from slightly more conservative recovery paces
    // and may need more recovery during luteal phase
    return {
      ...zones,
      recovery: {
        min: zones.recovery.min * 1.02, // Slightly slower recovery
        max: zones.recovery.max * 1.05,
      },
      recommendations: [
        'Berücksichtige deinen Menstruationszyklus bei der Trainingsplanung',
        'In der Follikelphase (Tag 1-14) ist oft höhere Intensität möglich',
        'In der Lutealphase (Tag 14-28) kann mehr Erholung sinnvoll sein',
      ],
    };
  }

  return zones;
}

/**
 * Get VDOT category with gender-specific percentiles
 * Women and men have different performance distributions
 */
export function getFitnessCategoryWithGender(
  vdot: number,
  gender?: 'male' | 'female' | 'other'
): {
  category: string;
  description: string;
  percentile: number;
  genderNote?: string;
} {
  const baseCategory = getFitnessCategory(vdot);

  if (gender === 'female') {
    // Women with same VDOT are typically in higher percentile
    // due to fewer female runners at elite level (statistical distribution)
    return {
      ...baseCategory,
      percentile: Math.min(99, baseCategory.percentile + 5),
      genderNote: 'Als Frau mit diesem VDOT bist du in der Spitzengruppe!',
    };
  } else if (gender === 'male') {
    return {
      ...baseCategory,
      genderNote: 'Vergleichswert für männliche Läufer',
    };
  }

  return baseCategory;
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
 * const zones = calculateTrainingZonesWithBiomarkers(vdot, 'female');
 *
 * console.log(`Easy pace: ${formatPace(zones.easy.min)} - ${formatPace(zones.easy.max)}`);
 * console.log(`Threshold pace: ${formatPace(zones.threshold)}`);
 * console.log(`Recommendations:`, zones.recommendations);
 */
