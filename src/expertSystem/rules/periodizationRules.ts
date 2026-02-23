/**
 * Periodization Rules
 *
 * Based on:
 * - Pete Pfitzinger's mesocycle approach
 * - Jack Daniels' phase-based training
 * - Herbert Steffny's periodization
 *
 * Key principles:
 * - Base → Build → Peak → Taper progression
 * - Phase-appropriate workouts
 * - Progressive overload
 */

import { TrainingRule, RuleContext, RuleResult, RuleSource, SessionSuggestion } from '../types';
import { SESSION_CHARACTERISTICS } from '../../config/sessionCharacteristics';
import { SessionType } from '../../types';
import { TrainingPhase } from '../../types/suggestions';

// ============ Sources ============

const PFITZINGER_SOURCE: RuleSource = {
  author: 'Pete Pfitzinger',
  book: 'Advanced Marathoning',
  principle: 'Mesocycle-Based Periodization',
};

const DANIELS_SOURCE: RuleSource = {
  author: 'Jack Daniels',
  book: "Daniels' Running Formula",
  principle: 'Phase-Based Training',
};

const STEFFNY_SOURCE: RuleSource = {
  author: 'Herbert Steffny',
  book: 'Das große Laufbuch',
  principle: 'Periodisierungsprinzipien',
};

// ============ Phase-Appropriate Session Types ============

const PHASE_SESSIONS: Record<TrainingPhase, SessionType[]> = {
  base: ['easy', 'recovery', 'long', 'strides', 'strength', 'hill_repeats'],
  build: ['easy', 'recovery', 'long', 'tempo', 'intervals', 'fartlek', 'progression', 'strength'],
  peak: ['easy', 'recovery', 'long', 'tempo', 'intervals', 'race', 'progression'],
  taper: ['easy', 'recovery', 'strides', 'race'],
  recovery: ['easy', 'recovery'],
};

// ============ Periodization Rules ============

/**
 * Phase-Appropriate Sessions Rule
 *
 * "Train with workouts appropriate for your current training phase"
 * - Pete Pfitzinger
 */
export class PhaseAppropriateSessionsRule implements TrainingRule {
  id = 'periodization_phase_sessions';
  name = 'Phasengerechte Einheiten';
  description =
    'Die Trainingseinheiten sollten zur aktuellen Trainingsphase passen.';
  category = 'periodization' as const;
  priority = 'high' as const;
  source = PFITZINGER_SOURCE;

  appliesTo(_context: RuleContext): boolean {
    return true;
  }

  evaluate(context: RuleContext): RuleResult {
    const inappropriateSessions: string[] = [];
    const allowedTypes = PHASE_SESSIONS[context.currentPhase];

    for (const session of context.existingSessions) {
      if (!allowedTypes.includes(session.type)) {
        inappropriateSessions.push(this.getSessionName(session.type));
      }
    }

    if (inappropriateSessions.length > 0) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        confidence: 0.8,
        priority: this.priority,
        category: this.category,
        message: `Unpassende Einheiten für ${this.getPhaseName(context.currentPhase)}-Phase: ${inappropriateSessions.join(', ')}.`,
        violation: {
          severity: 'warning',
          message: 'Einheiten passen nicht zur Phase',
          recommendation: `In der ${this.getPhaseName(context.currentPhase)}-Phase sind empfohlen: ${this.getPhaseRecommendations(context.currentPhase)}`,
        },
        source: this.source,
      };
    }

    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: true,
      confidence: 1.0,
      priority: this.priority,
      category: this.category,
      message: `Alle Einheiten passen zur ${this.getPhaseName(context.currentPhase)}-Phase`,
      source: this.source,
    };
  }

  private getPhaseName(phase: TrainingPhase): string {
    const names: Record<TrainingPhase, string> = {
      base: 'Grundlagen',
      build: 'Aufbau',
      peak: 'Peak',
      taper: 'Taper',
      recovery: 'Regeneration',
    };
    return names[phase];
  }

  private getPhaseRecommendations(phase: TrainingPhase): string {
    const recs: Record<TrainingPhase, string> = {
      base: 'Easy Runs, Long Runs, Steigerungen, Krafttraining',
      build: 'Easy Runs, Tempo Runs, Intervalle, Long Runs',
      peak: 'Easy Runs, Wettkampfspezifische Einheiten, Tune-up Races',
      taper: 'Kurze Easy Runs, Steigerungen, Ruhe',
      recovery: 'Nur Easy und Recovery Runs',
    };
    return recs[phase];
  }

  private getSessionName(type: SessionType): string {
    const names: Record<SessionType, string> = {
      easy: 'Easy Run',
      recovery: 'Recovery Run',
      long: 'Long Run',
      intervals: 'Intervalltraining',
      tempo: 'Tempodauerlauf',
      race: 'Wettkampf',
      strides: 'Steigerungen',
      hill_repeats: 'Bergwiederholungen',
      progression: 'Progression Run',
      fartlek: 'Fartlek',
      strength: 'Krafttraining',
      plyometrics: 'Plyometrie',
    };
    return names[type];
  }
}

/**
 * Base Phase Focus Rule
 *
 * "Focus on building aerobic base before adding intensity"
 * - Jack Daniels, Herbert Steffny
 */
export class BasePhaseFocusRule implements TrainingRule {
  id = 'periodization_base_focus';
  name = 'Grundlagenphase: Aerobe Basis';
  description =
    'In der Grundlagenphase sollte der Fokus auf aerobem Aufbau liegen.';
  category = 'periodization' as const;
  priority = 'high' as const;
  source = DANIELS_SOURCE;

  appliesTo(context: RuleContext): boolean {
    return context.currentPhase === 'base';
  }

  evaluate(context: RuleContext): RuleResult {
    const highIntensitySessions = context.existingSessions.filter((s) => {
      const char = SESSION_CHARACTERISTICS[s.type];
      return char.intensityLevel === 'hard' || char.intensityLevel === 'very_hard';
    });

    // In base phase, should have minimal hard sessions
    if (highIntensitySessions.length > 1) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        confidence: 0.85,
        priority: this.priority,
        category: this.category,
        message: `${highIntensitySessions.length} intensive Einheiten in der Grundlagenphase.`,
        violation: {
          severity: 'warning',
          message: 'Zu viel Intensität in der Grundlagenphase',
          recommendation: 'Fokussiere auf aerobe Easy Runs und langsame Long Runs. Ersetze intensive Einheiten durch Steigerungen oder Hill Repeats (Kraft).',
        },
        suggestion: this.createBasePhaseSuggestion(context),
        source: this.source,
      };
    }

    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: true,
      confidence: 1.0,
      priority: this.priority,
      category: this.category,
      message: 'Guter Fokus auf aerobe Basis in der Grundlagenphase',
      source: this.source,
    };
  }

  private createBasePhaseSuggestion(context: RuleContext): SessionSuggestion {
    // In base phase, suggest easy runs or hill repeats for strength
    if (context.hardSessionsThisWeek === 0) {
      return {
        type: 'hill_repeats',
        warmUp: 2,
        warmUpUnit: 'km',
        coolDown: 2,
        coolDownUnit: 'km',
        confidence: 0.75,
        reasoning: 'Bergwiederholungen für Kraft ohne zu viel Laktat',
        priority: 'medium',
        intensityLevel: 'hard',
        notes: '6-8 x 60-90s Bergan mit Trab bergab',
      };
    }

    return {
      type: 'easy',
      distance: Math.min(10, context.targetWeeklyKm * 0.12),
      confidence: 0.9,
      reasoning: 'Easy Run für aerobe Basisentwicklung',
      priority: 'high',
      intensityLevel: 'easy',
    };
  }
}

/**
 * Build Phase Intensity Rule
 *
 * "Introduce tempo and interval work during build phase"
 * - Pete Pfitzinger
 */
export class BuildPhaseIntensityRule implements TrainingRule {
  id = 'periodization_build_intensity';
  name = 'Aufbauphase: Intensität einführen';
  description =
    'In der Aufbauphase sollten Tempo- und Intervalltraining eingeführt werden.';
  category = 'periodization' as const;
  priority = 'medium' as const;
  source = PFITZINGER_SOURCE;

  appliesTo(context: RuleContext): boolean {
    return context.currentPhase === 'build';
  }

  evaluate(context: RuleContext): RuleResult {
    const hasTempoOrIntervals = context.existingSessions.some(
      (s) => s.type === 'tempo' || s.type === 'intervals' || s.type === 'fartlek'
    );

    if (!hasTempoOrIntervals) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        confidence: 0.75,
        priority: this.priority,
        category: this.category,
        message: 'Keine Tempo- oder Intervalleinheiten in der Aufbauphase.',
        violation: {
          severity: 'warning',
          message: 'Fehlende Intensität in der Aufbauphase',
          recommendation: 'Plane 1-2 Quality Sessions (Tempo oder Intervalle) pro Woche.',
        },
        suggestion: {
          type: 'tempo',
          warmUp: 2,
          warmUpUnit: 'km',
          coolDown: 2,
          coolDownUnit: 'km',
          confidence: 0.8,
          reasoning: 'Tempodauerlauf für Laktattoleranz in der Aufbauphase',
          priority: 'medium',
          intensityLevel: 'hard',
        },
        source: this.source,
      };
    }

    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: true,
      confidence: 1.0,
      priority: this.priority,
      category: this.category,
      message: 'Gute Intensitätsmischung in der Aufbauphase',
      source: this.source,
    };
  }
}

/**
 * Peak Phase Race Specificity Rule
 *
 * "Peak training should be race-specific"
 * - Jack Daniels, Pfitzinger
 */
export class PeakPhaseSpecificityRule implements TrainingRule {
  id = 'periodization_peak_specificity';
  name = 'Peak-Phase: Wettkampfspezifik';
  description =
    'In der Peak-Phase sollte das Training wettkampfspezifisch sein.';
  category = 'periodization' as const;
  priority = 'high' as const;
  source = DANIELS_SOURCE;

  appliesTo(context: RuleContext): boolean {
    return context.currentPhase === 'peak';
  }

  evaluate(context: RuleContext): RuleResult {
    // Check for race-specific workouts
    const hasRaceSpecific = context.existingSessions.some(
      (s) =>
        s.type === 'tempo' ||
        s.type === 'progression' ||
        (s.type === 'long' && s.distance && s.distance >= context.raceDistance * 0.5)
    );

    if (!hasRaceSpecific) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        confidence: 0.75,
        priority: this.priority,
        category: this.category,
        message: 'Keine wettkampfspezifischen Einheiten in der Peak-Phase.',
        violation: {
          severity: 'warning',
          message: 'Fehlende Wettkampfspezifik',
          recommendation: 'Plane Race-Pace-Läufe oder einen Tune-up-Wettkampf ein.',
        },
        suggestion: this.createRaceSpecificSuggestion(context),
        source: this.source,
      };
    }

    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: true,
      confidence: 1.0,
      priority: this.priority,
      category: this.category,
      message: 'Gute Wettkampfspezifik in der Peak-Phase',
      source: this.source,
    };
  }

  private createRaceSpecificSuggestion(context: RuleContext): SessionSuggestion {
    if (context.raceDistance >= 42) {
      // Marathon: Marathon pace runs
      return {
        type: 'tempo',
        distance: 16,
        warmUp: 2,
        warmUpUnit: 'km',
        coolDown: 2,
        coolDownUnit: 'km',
        confidence: 0.85,
        reasoning: 'Marathon-Pace-Lauf für Wettkampfspezifik',
        priority: 'high',
        intensityLevel: 'hard',
        notes: '12 km im Marathon-Tempo',
      };
    } else if (context.raceDistance >= 21) {
      // Half: Tempo at HM pace
      return {
        type: 'tempo',
        distance: 12,
        warmUp: 2,
        warmUpUnit: 'km',
        coolDown: 2,
        coolDownUnit: 'km',
        confidence: 0.85,
        reasoning: 'Halbmarathon-Tempo-Lauf',
        priority: 'high',
        intensityLevel: 'hard',
        notes: '8 km im Halbmarathon-Tempo',
      };
    } else {
      // Short distance: VO2max intervals
      return {
        type: 'intervals',
        warmUp: 2,
        warmUpUnit: 'km',
        coolDown: 2,
        coolDownUnit: 'km',
        confidence: 0.85,
        reasoning: 'VO2max-Intervalle für Wettkampfschärfe',
        priority: 'high',
        intensityLevel: 'very_hard',
        notes: '5-6 x 1000m @ Wettkampftempo',
      };
    }
  }
}

/**
 * Taper Phase Volume Reduction Rule
 *
 * "Reduce volume by 40-60% during taper, maintain intensity"
 * - Universal taper principle
 */
export class TaperVolumeRule implements TrainingRule {
  id = 'periodization_taper_volume';
  name = 'Tapering: Volumenreduktion';
  description =
    'Im Tapering sollte das Volumen um 40-60% reduziert werden.';
  category = 'periodization' as const;
  priority = 'high' as const;
  source = PFITZINGER_SOURCE;

  appliesTo(context: RuleContext): boolean {
    return context.currentPhase === 'taper';
  }

  evaluate(context: RuleContext): RuleResult {
    // Compare to peak volume
    const expectedTaperVolume = context.peakWeeklyKm * 0.55; // 45% reduction
    const toleranceHigh = context.peakWeeklyKm * 0.65; // Allow up to 35% reduction
    const toleranceLow = context.peakWeeklyKm * 0.4; // At least 60% reduction

    if (context.targetWeeklyKm > toleranceHigh) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        confidence: 0.9,
        priority: this.priority,
        category: this.category,
        message: `Taper-Volumen (${context.targetWeeklyKm} km) ist zu hoch. Empfohlen: ${Math.round(expectedTaperVolume)} km.`,
        violation: {
          severity: 'error',
          message: 'Zu wenig Volumenreduktion im Tapering',
          recommendation: `Reduziere auf ${Math.round(toleranceLow)}-${Math.round(toleranceHigh)} km.`,
        },
        source: this.source,
      };
    }

    if (context.targetWeeklyKm < toleranceLow) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: true,
        confidence: 0.7,
        priority: this.priority,
        category: this.category,
        message: `Sehr starke Volumenreduktion im Taper (${context.targetWeeklyKm} km). Stelle sicher, dass du Intensität beibehältst.`,
        source: this.source,
      };
    }

    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: true,
      confidence: 1.0,
      priority: this.priority,
      category: this.category,
      message: `Gute Taper-Volumenreduktion auf ${context.targetWeeklyKm} km`,
      source: this.source,
    };
  }
}

/**
 * Progressive Overload Rule
 *
 * "Training stress should progressively increase over time"
 * - Fundamental training principle
 */
export class ProgressiveOverloadRule implements TrainingRule {
  id = 'periodization_progressive_overload';
  name = 'Progressive Überlastung';
  description =
    'Die Trainingsbelastung sollte über Zeit progressiv zunehmen (außer in Regen./Taper).';
  category = 'periodization' as const;
  priority = 'medium' as const;
  source = STEFFNY_SOURCE;

  appliesTo(context: RuleContext): boolean {
    return (
      context.currentPhase !== 'recovery' &&
      context.currentPhase !== 'taper' &&
      context.currentWeekNumber > 1
    );
  }

  evaluate(context: RuleContext): RuleResult {
    // Check if there's progression from previous weeks
    const isProgressing = context.targetWeeklyKm >= context.previousWeekKm;

    // In base/build phases, we want progression
    if (!isProgressing && context.currentPhase !== 'recovery') {
      const isRecoveryWeek = context.currentWeekNumber % 4 === 0; // Every 4th week

      if (!isRecoveryWeek) {
        return {
          ruleId: this.id,
          ruleName: this.name,
          passed: false,
          confidence: 0.7,
          priority: this.priority,
          category: this.category,
          message: `Volumen sinkt in Woche ${context.currentWeekNumber} (keine Regenerationswoche).`,
          violation: {
            severity: 'warning',
            message: 'Fehlende Progression',
            recommendation: 'Steigere das Volumen oder markiere dies als Regenerationswoche.',
          },
          source: this.source,
        };
      }
    }

    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: true,
      confidence: 1.0,
      priority: this.priority,
      category: this.category,
      message: 'Gute progressive Entwicklung',
      source: this.source,
    };
  }
}

/**
 * Long Run Distance by Phase Rule
 *
 * "Long run distance should match the training phase"
 * - Pfitzinger, Steffny
 */
export class LongRunByPhaseRule implements TrainingRule {
  id = 'periodization_long_run_phase';
  name = 'Long Run nach Phase';
  description =
    'Die Distanz des langen Laufs sollte zur Trainingsphase passen.';
  category = 'periodization' as const;
  priority = 'medium' as const;
  source = STEFFNY_SOURCE;

  appliesTo(context: RuleContext): boolean {
    return context.existingSessions.some((s) => s.type === 'long');
  }

  evaluate(context: RuleContext): RuleResult {
    const longRun = context.existingSessions.find((s) => s.type === 'long');
    if (!longRun || !longRun.distance) return this.createPassResult();

    const expectedRange = this.getExpectedLongRunRange(context);

    if (longRun.distance > expectedRange.max) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        confidence: 0.75,
        priority: this.priority,
        category: this.category,
        message: `Long Run (${longRun.distance} km) ist für die ${this.getPhaseName(context.currentPhase)}-Phase sehr lang.`,
        violation: {
          severity: 'warning',
          message: 'Long Run möglicherweise zu lang für diese Phase',
          recommendation: `Empfohlen für ${this.getPhaseName(context.currentPhase)}: ${expectedRange.min}-${expectedRange.max} km`,
        },
        source: this.source,
      };
    }

    if (
      longRun.distance < expectedRange.min &&
      context.currentPhase !== 'taper' &&
      context.currentPhase !== 'recovery'
    ) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: true,
        confidence: 0.7,
        priority: this.priority,
        category: this.category,
        message: `Long Run (${longRun.distance} km) könnte in der ${this.getPhaseName(context.currentPhase)}-Phase länger sein.`,
        source: this.source,
      };
    }

    return this.createPassResult();
  }

  private getExpectedLongRunRange(context: RuleContext): { min: number; max: number } {
    const raceKm = context.raceDistance;

    // Base distances on race distance and phase
    const baseRanges: Record<TrainingPhase, { minPct: number; maxPct: number }> = {
      base: { minPct: 0.3, maxPct: 0.5 },
      build: { minPct: 0.4, maxPct: 0.65 },
      peak: { minPct: 0.5, maxPct: 0.75 },
      taper: { minPct: 0.2, maxPct: 0.4 },
      recovery: { minPct: 0.2, maxPct: 0.35 },
    };

    const range = baseRanges[context.currentPhase];

    // Cap based on race distance
    let maxCap: number;
    if (raceKm >= 42) {
      maxCap = 35; // Marathon: max 35km long run (Steffny goes to 35)
    } else if (raceKm >= 21) {
      maxCap = 25; // Half: max 25km
    } else {
      maxCap = 18; // Short: max 18km
    }

    return {
      min: Math.round(raceKm * range.minPct),
      max: Math.min(Math.round(raceKm * range.maxPct), maxCap),
    };
  }

  private getPhaseName(phase: TrainingPhase): string {
    const names: Record<TrainingPhase, string> = {
      base: 'Grundlagen',
      build: 'Aufbau',
      peak: 'Peak',
      taper: 'Taper',
      recovery: 'Regeneration',
    };
    return names[phase];
  }

  private createPassResult(): RuleResult {
    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: true,
      confidence: 1.0,
      priority: this.priority,
      category: this.category,
      message: 'Long Run Distanz passt zur Phase',
      source: this.source,
    };
  }
}

// Export all periodization rules
export const PERIODIZATION_RULES: TrainingRule[] = [
  new PhaseAppropriateSessionsRule(),
  new BasePhaseFocusRule(),
  new BuildPhaseIntensityRule(),
  new PeakPhaseSpecificityRule(),
  new TaperVolumeRule(),
  new ProgressiveOverloadRule(),
  new LongRunByPhaseRule(),
];
