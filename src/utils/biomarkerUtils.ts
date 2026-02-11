/**
 * Biomarker-based calculations and recommendations
 * For personalized training based on health metrics
 */

import { UserProfile } from '../types/userProfile';

/**
 * Calculate BMI (Body Mass Index) from height and weight
 * BMI = weight (kg) / (height (m))²
 *
 * Categories (WHO):
 * - Underweight: < 18.5
 * - Normal: 18.5 - 24.9
 * - Overweight: 25.0 - 29.9
 * - Obese: ≥ 30.0
 */
export function calculateBMI(heightCm: number, weightKg: number): {
  value: number;
  category: string;
  healthStatus: 'underweight' | 'normal' | 'overweight' | 'obese';
} {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const rounded = Math.round(bmi * 10) / 10;

  let category: string;
  let healthStatus: 'underweight' | 'normal' | 'overweight' | 'obese';

  if (bmi < 18.5) {
    category = 'Untergewicht';
    healthStatus = 'underweight';
  } else if (bmi < 25) {
    category = 'Normalgewicht';
    healthStatus = 'normal';
  } else if (bmi < 30) {
    category = 'Übergewicht';
    healthStatus = 'overweight';
  } else {
    category = 'Adipositas';
    healthStatus = 'obese';
  }

  return { value: rounded, category, healthStatus };
}

/**
 * Calculate heart rate training zones using Karvonen method
 * HR Reserve = Max HR - Resting HR
 * Target HR = Resting HR + (HR Reserve × Intensity%)
 *
 * Zones:
 * - Recovery: 50-60% HRR
 * - Easy/Aerobic: 60-70% HRR
 * - Tempo/Threshold: 70-85% HRR
 * - Interval/VO2max: 85-95% HRR
 * - Max: 95-100% HRR
 */
export function calculateHeartRateZones(
  restingHR: number,
  maxHR: number
): {
  recovery: { min: number; max: number };
  easy: { min: number; max: number };
  tempo: { min: number; max: number };
  interval: { min: number; max: number };
  max: { min: number; max: number };
} {
  const hrReserve = maxHR - restingHR;

  const calculateZone = (minPercent: number, maxPercent: number) => ({
    min: Math.round(restingHR + hrReserve * minPercent),
    max: Math.round(restingHR + hrReserve * maxPercent),
  });

  return {
    recovery: calculateZone(0.5, 0.6),
    easy: calculateZone(0.6, 0.7),
    tempo: calculateZone(0.7, 0.85),
    interval: calculateZone(0.85, 0.95),
    max: calculateZone(0.95, 1.0),
  };
}

/**
 * Estimate maximum heart rate based on age
 * Uses multiple formulas and returns the average
 *
 * Formulas:
 * - Traditional: 220 - age
 * - Tanaka: 208 - (0.7 × age)
 * - Gellish: 207 - (0.7 × age)
 */
export function estimateMaxHeartRate(age: number): number {
  const traditional = 220 - age;
  const tanaka = 208 - 0.7 * age;
  const gellish = 207 - 0.7 * age;

  // Average of all formulas for better accuracy
  const average = (traditional + tanaka + gellish) / 3;
  return Math.round(average);
}

/**
 * Gender-specific VDOT adjustments and recommendations
 *
 * Research shows:
 * - Women typically have 10-15% lower VO2max than men at same performance
 * - Women have different hormonal cycles affecting training
 * - Recovery needs may differ
 */
export function getGenderSpecificRecommendations(
  vdot: number,
  gender: 'male' | 'female' | 'other'
): {
  adjustedVDOT: number;
  recommendations: string[];
  recoveryMultiplier: number;
} {
  const recommendations: string[] = [];
  let adjustedVDOT = vdot;
  let recoveryMultiplier = 1.0;

  if (gender === 'female') {
    // Women generally perform as well as men at same VDOT
    // No VDOT adjustment needed - VDOT is already normalized!

    recommendations.push(
      'Berücksichtige deinen Menstruationszyklus: In der Follikelphase (Tag 1-14) ist die Leistung oft höher.',
      'In der Lutealphase (Tag 14-28) kann mehr Erholung nötig sein.',
      'Eisenaufnahme ist wichtig - achte auf ausreichende Versorgung.',
      'Schwangerschaften und Stillzeit beeinflussen das Training - passe dein Pensum ggf. an.'
    );

    // Women may need slightly more recovery
    recoveryMultiplier = 1.1;
  } else if (gender === 'male') {
    recommendations.push(
      'Krafttraining kann die Laufleistung verbessern - 2-3x pro Woche empfohlen.',
      'Achte auf ausreichende Protein-Zufuhr für Muskelregeneration.',
      'Höheres Verletzungsrisiko bei zu schneller Umfangssteigerung - max. 10% pro Woche.'
    );
  }

  return {
    adjustedVDOT,
    recommendations,
    recoveryMultiplier,
  };
}

/**
 * Get personalized training recommendations based on biomarkers
 */
export function getPersonalizedRecommendations(profile: Partial<UserProfile>): string[] {
  const recommendations: string[] = [];

  // BMI-based recommendations
  if (profile.heightCm && profile.weightKg) {
    const bmi = calculateBMI(profile.heightCm, profile.weightKg);

    if (bmi.healthStatus === 'underweight') {
      recommendations.push(
        '⚠️ Dein BMI liegt im Untergewichtsbereich. Achte auf ausreichende Kalorienzufuhr, um Verletzungen vorzubeugen.'
      );
    } else if (bmi.healthStatus === 'overweight' || bmi.healthStatus === 'obese') {
      recommendations.push(
        '💡 Bei erhöhtem Körpergewicht: Beginne mit niedrig-belastenden Aktivitäten und steigere langsam, um Gelenke zu schonen.',
        '🏊 Ergänze Laufen mit Schwimmen oder Radfahren für gelenkschonenderes Training.'
      );
    }
  }

  // Age-based recommendations
  if (profile.age) {
    if (profile.age < 20) {
      recommendations.push(
        '🌱 Junge Läufer: Fokussiere auf Technik und Spaß, nicht nur auf Umfang und Tempo.',
        '⚠️ Wachstumsphasen beachten - zu intensive Belastung kann Wachstumsfugen schädigen.'
      );
    } else if (profile.age > 50) {
      recommendations.push(
        '💪 Ältere Läufer: Krafttraining ist besonders wichtig zur Erhaltung der Muskelmasse.',
        '🧘 Mehr Zeit für Regeneration einplanen - Erholung dauert mit dem Alter länger.',
        '🦴 Knochengesundheit: Achte auf ausreichend Calcium und Vitamin D.'
      );
    }
  }

  // Heart rate recommendations
  if (profile.restingHeartRateBpm) {
    if (profile.restingHeartRateBpm < 50) {
      recommendations.push(
        '❤️ Sehr niedriger Ruhepuls - Zeichen guter Fitness! Achte auf Übertraining-Symptome.'
      );
    } else if (profile.restingHeartRateBpm > 80) {
      recommendations.push(
        '💓 Erhöhter Ruhepuls kann auf Übertraining oder Stress hindeuten. Mehr Regeneration könnte helfen.'
      );
    }
  }

  // Gender-specific
  if (profile.gender && profile.vdot) {
    const genderRecs = getGenderSpecificRecommendations(
      profile.vdot,
      profile.gender as 'male' | 'female' | 'other'
    );
    recommendations.push(...genderRecs.recommendations);
  }

  return recommendations;
}

/**
 * Calculate estimated body fat percentage
 * Uses Navy Method (circumference-based, but we don't have that data)
 * Falls back to BMI-based estimation (less accurate)
 */
export function estimateBodyFatPercentage(
  gender: 'male' | 'female' | 'other',
  age: number,
  bmi: number
): number | null {
  // BMI-based estimation (Deurenberg et al., 1991)
  // BF% = 1.20 × BMI + 0.23 × Age − 10.8 × Sex − 5.4
  // Sex: 1 for males, 0 for females

  const sexValue = gender === 'male' ? 1 : 0;
  const bodyFat = 1.2 * bmi + 0.23 * age - 10.8 * sexValue - 5.4;

  // Clamp to realistic range
  return Math.max(5, Math.min(50, Math.round(bodyFat * 10) / 10));
}
