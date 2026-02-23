/**
 * Expert System Types
 *
 * Types for the rule-based training expert system based on:
 * - Jack Daniels' Running Formula (VDOT)
 * - Pete Pfitzinger's Advanced Marathoning
 * - Hansons Marathon Method
 * - Herbert Steffny's Das große Laufbuch
 * - Dr. Matthias Marquardt's Laufbibel
 */

import { SessionType, TrainingSession } from '../types';
import { TrainingPhase, IntensityLevel } from '../types/suggestions';
import { TrainingZones } from '../types/userProfile';

// ============ Rule Engine Types ============

/**
 * Rule priority levels
 * CRITICAL: Safety rules (injury prevention, overtraining)
 * HIGH: Core training principles (recovery, periodization)
 * MEDIUM: Optimization rules (session placement, intensity distribution)
 * LOW: Preference/convenience rules
 */
export type RulePriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Rule categories based on training science sources
 */
export type RuleCategory =
  | 'recovery'           // Recovery and regeneration rules
  | 'periodization'      // Phase-based training rules
  | 'intensity'          // Intensity distribution (80/20)
  | 'volume'             // Volume progression (10% rule)
  | 'session_placement'  // When to place specific sessions
  | 'injury_prevention'  // Safety constraints
  | 'race_specific'      // Race distance specific rules
  | 'vdot_based'         // VDOT pace calculations
  | 'cumulative_fatigue' // Hansons-style fatigue management
  | 'biomechanics';      // Marquardt-style form rules

/**
 * Source reference for rules
 */
export interface RuleSource {
  author: string;
  book: string;
  principle: string;
}

/**
 * Rule evaluation context
 */
export interface RuleContext {
  // Current state
  currentWeekNumber: number;
  totalWeeks: number;
  currentPhase: TrainingPhase;
  phaseProgress: number;
  daysUntilRace: number;

  // Session context
  dayOfWeek: number;
  existingSessions: TrainingSession[];
  previousDaySession?: TrainingSession;
  lastHardSessionDay: number | null;
  daysSinceLastHardSession: number;

  // Week analysis
  weeklyKm: number;
  targetWeeklyKm: number;
  hardSessionsThisWeek: number;
  hasLongRunThisWeek: boolean;
  weeklyIntensityScore: number;

  // Historical
  previousWeekKm: number;
  averageWeeklyKm: number;
  peakWeeklyKm: number;
  consecutiveHardWeeks: number;

  // User profile
  raceDistance: number;
  vdot?: number;
  zones?: TrainingZones;
  weeklyKmBase?: number;  // User's current weekly km base
  runningExperience?: number; // Years of running

  // Cumulative fatigue (Hansons)
  cumulativeFatigueScore: number; // 0-100
  weeklyLoadScore: number;
}

/**
 * Rule evaluation result
 */
export interface RuleResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  confidence: number; // 0-1
  priority: RulePriority;
  category: RuleCategory;
  message: string;
  suggestion?: SessionSuggestion;
  violation?: RuleViolation;
  source: RuleSource;
}

/**
 * Rule violation when a constraint is broken
 */
export interface RuleViolation {
  severity: 'warning' | 'error';
  message: string;
  recommendation: string;
}

/**
 * Session suggestion from expert system
 */
export interface SessionSuggestion {
  type: SessionType;
  distance?: number;
  duration?: number;
  warmUp?: number;
  warmUpUnit?: 'km' | 'min';
  coolDown?: number;
  coolDownUnit?: 'km' | 'min';
  paceZone?: keyof TrainingZones;
  targetPace?: number; // min/km
  intervals?: IntervalSuggestion[];
  notes?: string;
  confidence: number;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  intensityLevel: IntensityLevel;
}

/**
 * Interval workout suggestion
 */
export interface IntervalSuggestion {
  distance: number;
  repetitions: number;
  pace: number; // min/km
  paceZone: 'interval' | 'repetition' | 'threshold';
  recovery: number;
  recoveryUnit: 'km' | 'min';
  recoveryType: 'jog' | 'walk' | 'stand';
}

// ============ Training Rule Interface ============

/**
 * Base interface for all training rules
 */
export interface TrainingRule {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  priority: RulePriority;
  source: RuleSource;

  /**
   * Check if the rule applies in the current context
   */
  appliesTo(context: RuleContext): boolean;

  /**
   * Evaluate the rule and return result
   */
  evaluate(context: RuleContext): RuleResult;
}

// ============ VDOT Training Paces ============

/**
 * VDOT-based training pace types (Jack Daniels)
 */
export interface VDOTTrainingPaces {
  vdot: number;

  // Easy/Recovery (E pace) - 59-74% VO2max
  easyPace: { min: number; max: number };

  // Marathon pace (M pace) - ~80% VO2max
  marathonPace: number;

  // Threshold pace (T pace) - 83-88% VO2max
  // "Comfortably hard", sustainable for ~1 hour
  thresholdPace: number;

  // Interval pace (I pace) - 95-100% VO2max
  // Hard, 3-5 minute efforts
  intervalPace: number;

  // Repetition pace (R pace) - 105-110% VO2max
  // Fast, short efforts with full recovery
  repetitionPace: number;

  // Recovery pace - slower than easy
  recoveryPace: { min: number; max: number };
}

// ============ Periodization Types (Pfitzinger) ============

/**
 * Mesocycle definition (Pfitzinger's phases)
 */
export interface Mesocycle {
  name: string;
  phase: TrainingPhase;
  durationWeeks: number;
  volumeMultiplier: number; // Relative to peak
  keyWorkouts: SessionType[];
  focusAreas: string[];
  constraints: string[];
}

/**
 * Training plan template based on Pfitzinger
 */
export interface PfitzingerPlanTemplate {
  name: string;
  raceDistance: number;
  totalWeeks: number;
  peakWeeklyKm: number;
  mesocycles: Mesocycle[];
}

// ============ Cumulative Fatigue (Hansons) ============

/**
 * Cumulative fatigue state
 */
export interface CumulativeFatigueState {
  // Current fatigue level (0-100)
  currentFatigue: number;

  // Fatigue trend (increasing/stable/decreasing)
  trend: 'increasing' | 'stable' | 'decreasing';

  // Days since last recovery day
  daysSinceRecovery: number;

  // Training load (TRIMP-like score)
  weeklyLoad: number;

  // Acute:Chronic workload ratio
  acuteChronicRatio: number;

  // Recommendation
  recommendation: 'continue' | 'reduce' | 'recover';
}

// ============ Volume Progression (10% Rule) ============

/**
 * Volume progression analysis
 */
export interface VolumeProgressionAnalysis {
  currentWeeklyKm: number;
  previousWeeklyKm: number;
  percentIncrease: number;

  // Is within safe limits (10% rule)?
  isSafe: boolean;

  // Recommended volume
  recommendedKm: number;

  // Week type
  weekType: 'build' | 'maintain' | 'recovery';

  // Violations
  violations: string[];
}

// ============ Session Placement Rules ============

/**
 * Day preference for session type
 */
export interface DayPreference {
  sessionType: SessionType;
  preferredDays: number[]; // 0=Monday, 6=Sunday
  avoidDays: number[];
  reason: string;
}

/**
 * Session sequence rule
 */
export interface SessionSequenceRule {
  sessionType: SessionType;

  // Minimum days before next hard session
  minRecoveryDays: number;

  // Maximum days between sessions of this type
  maxDaysBetween?: number;

  // Sessions that should not precede this
  avoidAfter: SessionType[];

  // Sessions that work well before this
  goodAfter: SessionType[];
}

// ============ Expert System Output ============

/**
 * Complete expert system analysis for a day
 */
export interface DailyAnalysis {
  dayOfWeek: number;
  date: string;

  // Suggested sessions (sorted by priority)
  suggestions: SessionSuggestion[];

  // Rule violations/warnings
  violations: RuleViolation[];

  // Overall recommendation
  recommendation: 'rest' | 'easy' | 'moderate' | 'hard';

  // Reasoning
  reasoning: string[];

  // Applied rules
  appliedRules: string[];
}

/**
 * Complete expert system analysis for a week
 */
export interface WeeklyAnalysis {
  weekNumber: number;
  phase: TrainingPhase;

  // Daily analyses
  days: Map<number, DailyAnalysis>;

  // Weekly metrics
  targetVolume: number;
  currentVolume: number;
  volumeStatus: 'under' | 'on_track' | 'over';

  // Intensity distribution
  intensityDistribution: {
    easy: number;
    moderate: number;
    hard: number;
  };

  // Overall health
  overallHealth: 'excellent' | 'good' | 'warning' | 'critical';

  // Key recommendations
  keyRecommendations: string[];
}
