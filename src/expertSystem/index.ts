/**
 * Training Expert System
 *
 * A rule-based expert system for generating intelligent training suggestions
 * based on established sports science principles from:
 *
 * - Jack Daniels' Running Formula (VDOT, training zones)
 * - Pete Pfitzinger's Advanced Marathoning (periodization)
 * - Hansons Marathon Method (cumulative fatigue)
 * - Herbert Steffny's Das große Laufbuch (German training principles)
 * - Dr. Matthias Marquardt's Laufbibel (injury prevention)
 *
 * @module expertSystem
 */

// Main exports
export { TrainingRuleEngine } from './RuleEngine';
export * from './types';
export * from './vdotPaceCalculator';

// Rule exports
export {
  ALL_RULES,
  RECOVERY_RULES,
  VOLUME_RULES,
  INTENSITY_RULES,
  SESSION_PLACEMENT_RULES,
  PERIODIZATION_RULES,
  getRulesByCategory,
  getRulesByPriority,
  getRuleById,
} from './rules';

// Individual rule classes (for customization)
export {
  IntervalRecoveryRule,
  HardEasyPrincipleRule,
  MaxHardSessionsRule,
  RecoveryWeekRule,
  CumulativeFatigueRule,
  RestDayRule,
} from './rules/recoveryRules';

export {
  TenPercentRule,
  PeakVolumeTimingRule,
  LongRunProportionRule,
  MinimumVolumeRule,
  ExperienceBasedVolumeRule,
  ConsecutiveBuildWeeksRule,
} from './rules/volumeRules';

export {
  EightyTwentyRule,
  ModerateIntensityTrapRule,
  PurposeDrivenIntensityRule,
  TaperIntensityRule,
  QualitySessionsLimitRule,
  VDOTBasedIntensityRule,
} from './rules/intensityRules';

export {
  LongRunWeekendRule,
  QualitySessionsMidweekRule,
  NoBackToBackHardRule,
  PreRaceDayRule,
  PreLongRunRule,
  SessionSequenceRule,
  MondayEasyRule,
} from './rules/sessionPlacementRules';

export {
  PhaseAppropriateSessionsRule,
  BasePhaseFocusRule,
  BuildPhaseIntensityRule,
  PeakPhaseSpecificityRule,
  TaperVolumeRule,
  ProgressiveOverloadRule,
  LongRunByPhaseRule,
} from './rules/periodizationRules';
