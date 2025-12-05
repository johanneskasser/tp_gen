import { SessionType, TrainingSession, TrainingPlan, TrainingWeek } from '../types';

// Training phases based on periodization
export type TrainingPhase = 'base' | 'build' | 'peak' | 'taper' | 'recovery';

// Intensity levels for sessions
export type IntensityLevel = 'easy' | 'moderate' | 'hard' | 'very_hard';

// Session suggestion with reasoning
export interface TrainingSuggestion {
  type: SessionType;
  distance?: number;
  duration?: number;
  warmUp?: number;
  warmUpUnit?: 'km' | 'min';
  coolDown?: number;
  coolDownUnit?: 'km' | 'min';
  confidence: number; // 0-1
  reason: string;
  priority: 'high' | 'medium' | 'low';
  dayOfWeek?: number;
  suggestedTitle?: string;
  notes?: string;
  intensityLevel: IntensityLevel;
}

// Context for generating suggestions
export interface TrainingContext {
  // Plan info
  plan: TrainingPlan;
  currentWeek: TrainingWeek;
  weekNumber: number;
  totalWeeks: number;

  // Race info
  raceDistance: number; // in km
  daysUntilRace: number;
  targetPace?: number; // min/km

  // Current week analysis
  weekSessions: TrainingSession[];
  weeklyKm: number;
  weeklyIntensityScore: number;
  hardSessionsThisWeek: number;

  // Historical data
  previousWeekKm: number;
  averageWeeklyKm: number;
  peakWeeklyKm: number;

  // Phase detection
  currentPhase: TrainingPhase;
  phaseProgress: number; // 0-1 within current phase

  // Patterns
  recentSessionTypes: SessionType[];
  lastHardSessionDay: number | null;
  hasLongRunThisWeek: boolean;
}

// Volume progression rules
export interface VolumeProgression {
  weeklyIncrease: number; // percentage
  maxWeeklyIncrease: number; // max km increase
  recoveryWeekFrequency: number; // every N weeks
  recoveryWeekReduction: number; // percentage reduction
  peakWeekNumber: number;
  taperStartWeek: number;
}

// Intensity distribution target (80/20 principle)
export interface IntensityDistribution {
  easy: number; // 0-1 (target: 0.8)
  moderate: number; // 0-1 (target: 0.1)
  hard: number; // 0-1 (target: 0.1)
  current: {
    easy: number;
    moderate: number;
    hard: number;
  };
  needsRebalancing: boolean;
  recommendation: string;
}

// Pattern for ML training later
export interface TrainingPattern {
  id: string;
  sequence: SessionType[];
  contextHash: string; // Hash of context (phase, distance, week, etc.)
  frequency: number; // How often this pattern appears
  successMetrics?: {
    completionRate: number;
    userSatisfaction?: number;
    performanceImprovement?: number;
  };
  metadata: {
    raceDistance: string;
    phase: TrainingPhase;
    weekInPlan: number;
    totalWeeks: number;
  };
}

// Data point for ML training (to be collected)
export interface TrainingDataPoint {
  timestamp: string;
  context: Partial<TrainingContext>;
  suggestion: TrainingSuggestion;
  userAction: 'accepted' | 'modified' | 'rejected' | 'ignored';
  modifications?: Partial<TrainingSession>;
  outcome?: {
    sessionCompleted: boolean;
    userRating?: number; // 1-5
    notes?: string;
  };
}

// Session type rules and characteristics
export interface SessionTypeCharacteristics {
  type: SessionType;
  intensityLevel: IntensityLevel;
  intensityScore: number; // 1-10
  recoveryDaysNeeded: number;
  maxPerWeek: number;
  preferredDays: number[]; // 0-6
  phases: TrainingPhase[];
  volumePercent: { min: number; max: number }; // % of weekly volume
  pairsWith: SessionType[]; // Compatible session types in same week
  avoidAfter: SessionType[]; // Sessions to avoid day after
}
