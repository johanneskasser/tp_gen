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

  // Personal bests for different distances
  personalBests: PersonalBest[];

  // Training experience
  weeklyKmBase?: number; // Current weekly running volume
  yearsRunning?: number;

  // Calculated fitness metrics
  vdot?: number; // Jack Daniels' VDOT (calculated from best PB)
  estimatedVO2Max?: number;

  // Preferences
  preferredTrainingDays?: number[]; // 0-6, Monday-Sunday
  availableTimePerWeek?: number; // Hours per week

  // Goals
  targetRaces?: {
    distance: string;
    date: string;
    targetTime?: string;
  }[];
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
