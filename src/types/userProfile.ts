/**
 * User Profile Types
 * For personalized training recommendations and intensity calculations
 */

export interface PersonalBest {
  distance: '5K' | '10K' | 'HALF_MARATHON' | 'MARATHON' | 'CUSTOM';
  customDistanceKm?: number; // For custom distances
  time: string; // Format: "HH:MM:SS" or "MM:SS"
  date?: string; // When this PB was achieved
}

export interface UserProfile {
  id: string;
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';

  // Physical Metrics
  heightCm?: number; // Height in cm (for BMI calculation)
  weightKg?: number; // Weight in kg (for BMI calculation)

  // Heart Rate Metrics
  restingHeartRateBpm?: number; // Resting HR (for HR-based training zones)
  maxHeartRateBpm?: number; // Max HR (for HR-based training zones)

  // Personal bests for different distances
  personalBests: PersonalBest[];

  // Training experience
  weeklyKmBase?: number; // Current weekly running volume
  yearsRunning?: number;
  longestRunKm?: number; // Longest run distance (especially for beginners)

  // Calculated fitness metrics
  vdot?: number; // Jack Daniels' VDOT (calculated from best PB)
  estimatedVO2Max?: number;

  // Preferences
  preferredTrainingDays?: number[]; // 0-6, Monday-Sunday
  availableTimePerWeek?: number; // Hours per week

  // Goals & Motivation
  motivationText?: string; // Free text describing motivation and goals
  targetRaces?: {
    distance: string;
    date: string;
    targetTime?: string;
  }[];

  // Health & Safety
  injuryHistory?: string[]; // Array of past injuries

  // Onboarding status
  onboarding_completed?: boolean;
}

/**
 * Training zone paces based on VDOT
 * All paces in min/km
 */
export interface TrainingZones {
  vdot: number;

  // Jack Daniels' training zones
  easy: { min: number; max: number }; // E pace
  marathon: number; // M pace
  threshold: number; // T pace
  interval: number; // I pace
  repetition: number; // R pace

  // Additional zones
  recovery: { min: number; max: number };
  long: { min: number; max: number };
}

/**
 * Difficulty rating for a training plan relative to user's fitness
 */
export interface PlanDifficulty {
  overall: 'very_easy' | 'easy' | 'moderate' | 'challenging' | 'very_challenging' | 'extreme';
  score: number; // 0-100

  breakdown: {
    volumeRating: number; // 0-100 (compared to user's current weekly km)
    intensityRating: number; // 0-100 (based on % of hard sessions)
    peakWeekKm: number;
    avgWeeklyKm: number;
    hardSessionsPerWeek: number;
  };

  recommendations: string[];
  warnings: string[];
}
