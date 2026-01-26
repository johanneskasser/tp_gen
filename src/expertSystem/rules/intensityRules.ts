/**
 * Intensity Distribution Rules
 *
 * Based on:
 * - 80/20 Principle (Stephen Seiler, polarized training research)
 * - Jack Daniels' intensity zones
 * - Pete Pfitzinger's workout balance
 *
 * Key principles:
 * - ~80% of training should be easy/aerobic
 * - ~20% of training should be at higher intensities
 * - Avoid the "moderate intensity trap"
 */

import { TrainingRule, RuleContext, RuleResult, RuleSource, SessionSuggestion } from '../types';
import { SESSION_CHARACTERISTICS } from '../../config/sessionCharacteristics';

// ============ Sources ============

const SEILER_SOURCE: RuleSource = {
  author: 'Dr. Stephen Seiler',
  book: 'Polarized Training Research',
  principle: '80/20 Intensity Distribution',
};

const DANIELS_SOURCE: RuleSource = {
  author: 'Jack Daniels',
  book: "Daniels' Running Formula",
  principle: 'Purpose-Driven Training Intensities',
};

const PFITZINGER_SOURCE: RuleSource = {
  author: 'Pete Pfitzinger',
  book: 'Advanced Marathoning',
  principle: 'Balanced Intensity Distribution',
};

// ============ Intensity Rules ============

/**
 * 80/20 Intensity Distribution Rule
 *
 * "About 80% of your training should be at low intensity"
 * - Dr. Stephen Seiler's research on elite endurance athletes
 */
export class EightyTwentyRule implements TrainingRule {
  id = 'intensity_80_20';
  name = '80/20 Intensitätsverteilung';
  description =
    'Etwa 80% des Trainings sollte im lockeren Bereich stattfinden, 20% im intensiven Bereich.';
  category = 'intensity' as const;
  priority = 'high' as const;
  source = SEILER_SOURCE;

  appliesTo(context: RuleContext): boolean {
    return context.existingSessions.length >= 3; // Need enough data
  }

  evaluate(context: RuleContext): RuleResult {
    const distribution = this.calculateDistribution(context);

    // Check if distribution is too intensity-heavy
    if (distribution.hard > 0.25) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        confidence: 0.85,
        priority: this.priority,
        category: this.category,
        message: `Zu viel Intensität: ${(distribution.hard * 100).toFixed(0)}% hart (Ziel: ≤20%).`,
        violation: {
          severity: distribution.hard > 0.35 ? 'error' : 'warning',
          message: 'Intensitätsverteilung nicht optimal',
          recommendation: 'Ersetze eine harte Einheit durch einen Easy Run.',
        },
        suggestion: this.createEasySuggestion(context),
        source: this.source,
      };
    }

    // Check if too little intensity (in build/peak phases)
    if (
      distribution.hard < 0.10 &&
      (context.currentPhase === 'build' || context.currentPhase === 'peak')
    ) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: true, // Technically okay, but could be better
        confidence: 0.7,
        priority: this.priority,
        category: this.category,
        message: `Wenig Intensität: ${(distribution.hard * 100).toFixed(0)}% hart. In der ${context.currentPhase}-Phase könnten Quality Sessions hinzugefügt werden.`,
        suggestion: this.createQualitySuggestion(context),
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
      message: `Gute Intensitätsverteilung: ${(distribution.easy * 100).toFixed(0)}% locker, ${(distribution.hard * 100).toFixed(0)}% intensiv`,
      source: this.source,
    };
  }

  private calculateDistribution(context: RuleContext): {
    easy: number;
    moderate: number;
    hard: number;
  } {
    let easyKm = 0;
    let moderateKm = 0;
    let hardKm = 0;

    for (const session of context.existingSessions) {
      const char = SESSION_CHARACTERISTICS[session.type];
      const distance = session.distance || 0;

      if (char.intensityLevel === 'easy') {
        easyKm += distance;
      } else if (char.intensityLevel === 'moderate') {
        moderateKm += distance;
      } else {
        hardKm += distance;
      }
    }

    const total = easyKm + moderateKm + hardKm;
    if (total === 0) return { easy: 1, moderate: 0, hard: 0 };

    return {
      easy: easyKm / total,
      moderate: moderateKm / total,
      hard: hardKm / total,
    };
  }

  private createEasySuggestion(context: RuleContext): SessionSuggestion {
    return {
      type: 'easy',
      distance: Math.min(10, context.targetWeeklyKm * 0.12),
      confidence: 0.85,
      reasoning: 'Easy Run um die 80/20-Balance zu verbessern',
      priority: 'high',
      intensityLevel: 'easy',
      notes: 'Lockeres Tempo, Herzfrequenz Zone 2',
    };
  }

  private createQualitySuggestion(context: RuleContext): SessionSuggestion {
    return {
      type: context.raceDistance >= 21 ? 'tempo' : 'intervals',
      confidence: 0.7,
      reasoning: 'Quality Session um Trainingsreize zu setzen',
      priority: 'medium',
      intensityLevel: 'hard',
    };
  }
}

/**
 * Avoid Moderate Intensity Trap Rule
 *
 * "Too much time in Zone 3 (moderate intensity) is inefficient"
 * - Stephen Seiler, Polarized Training
 */
export class ModerateIntensityTrapRule implements TrainingRule {
  id = 'intensity_moderate_trap';
  name = 'Moderate-Intensität-Falle vermeiden';
  description =
    'Vermeide zu viel Training im mittleren Intensitätsbereich ("Grauzone").';
  category = 'intensity' as const;
  priority = 'medium' as const;
  source = SEILER_SOURCE;

  appliesTo(context: RuleContext): boolean {
    return context.existingSessions.length >= 3;
  }

  evaluate(context: RuleContext): RuleResult {
    const moderateSessions = context.existingSessions.filter((s) => {
      const char = SESSION_CHARACTERISTICS[s.type];
      return char.intensityLevel === 'moderate';
    });

    // More than 25% moderate is concerning
    const moderateRatio = moderateSessions.length / context.existingSessions.length;

    if (moderateRatio > 0.25) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        confidence: 0.75,
        priority: this.priority,
        category: this.category,
        message: `${(moderateRatio * 100).toFixed(0)}% der Einheiten im mittleren Intensitätsbereich.`,
        violation: {
          severity: 'warning',
          message: 'Zu viel Training in der "Grauzone"',
          recommendation: 'Trainiere entweder richtig locker (Easy) oder richtig hart (Tempo/Intervalle).',
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
      message: 'Training ist gut polarisiert',
      source: this.source,
    };
  }
}

/**
 * Purpose-Driven Intensity Rule (Daniels)
 *
 * "Every workout should have a purpose at a specific intensity"
 * - Jack Daniels
 */
export class PurposeDrivenIntensityRule implements TrainingRule {
  id = 'intensity_purpose_driven';
  name = 'Zweckgerichtete Intensität';
  description =
    'Jede Trainingseinheit sollte einen klaren Zweck und eine passende Intensität haben.';
  category = 'intensity' as const;
  priority = 'medium' as const;
  source = DANIELS_SOURCE;

  appliesTo(_context: RuleContext): boolean {
    return true;
  }

  evaluate(context: RuleContext): RuleResult {
    const issues: string[] = [];

    for (const session of context.existingSessions) {
      const char = SESSION_CHARACTERISTICS[session.type];

      // Check if session type matches phase
      if (!char.phases.includes(context.currentPhase)) {
        issues.push(
          `${session.type} ist in der ${context.currentPhase}-Phase ungewöhnlich`
        );
      }
    }

    if (issues.length > 0) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        confidence: 0.7,
        priority: this.priority,
        category: this.category,
        message: issues.join('. '),
        violation: {
          severity: 'warning',
          message: 'Einige Einheiten passen nicht optimal zur Trainingsphase',
          recommendation: 'Überprüfe ob die Einheiten zur aktuellen Phase passen.',
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
      message: 'Alle Einheiten passen zur Trainingsphase',
      source: this.source,
    };
  }
}

/**
 * Intensity During Taper Rule
 *
 * "Maintain intensity but reduce volume during taper"
 * - Pete Pfitzinger, Advanced Marathoning
 */
export class TaperIntensityRule implements TrainingRule {
  id = 'intensity_taper';
  name = 'Intensität im Tapering';
  description =
    'Während des Taperings: Volumen reduzieren, aber Intensität beibehalten.';
  category = 'intensity' as const;
  priority = 'high' as const;
  source = PFITZINGER_SOURCE;

  appliesTo(context: RuleContext): boolean {
    return context.currentPhase === 'taper';
  }

  evaluate(context: RuleContext): RuleResult {
    const hardSessions = context.existingSessions.filter((s) => {
      const char = SESSION_CHARACTERISTICS[s.type];
      return char.intensityLevel === 'hard' || char.intensityLevel === 'very_hard';
    });

    // During taper, should still have 1-2 quality sessions
    if (hardSessions.length === 0) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        confidence: 0.8,
        priority: this.priority,
        category: this.category,
        message: 'Keine Quality Sessions im Taper geplant.',
        violation: {
          severity: 'warning',
          message: 'Fehlende Intensität im Tapering',
          recommendation: 'Plane 1-2 kurze, schnelle Einheiten (Sharpeners) ein.',
        },
        suggestion: {
          type: 'strides',
          confidence: 0.85,
          reasoning: 'Kurze Steigerungen halten das Nervensystem aktiv',
          priority: 'high',
          intensityLevel: 'moderate',
          notes: '6x20s Steigerungen am Ende eines Easy Runs',
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
      message: 'Gute Intensität im Taper-Plan',
      source: this.source,
    };
  }
}

/**
 * Quality Sessions Limit Rule
 *
 * "Limit quality sessions to 2-3 per week for most runners"
 * - Consensus from Daniels, Pfitzinger, Hansons
 */
export class QualitySessionsLimitRule implements TrainingRule {
  id = 'intensity_quality_limit';
  name = 'Quality Sessions pro Woche begrenzen';
  description =
    'Die meisten Läufer sollten 2-3 Quality Sessions (inkl. Long Run) pro Woche planen.';
  category = 'intensity' as const;
  priority = 'high' as const;
  source = DANIELS_SOURCE;

  appliesTo(_context: RuleContext): boolean {
    return true;
  }

  evaluate(context: RuleContext): RuleResult {
    const qualitySessions = context.existingSessions.filter((s) => {
      const char = SESSION_CHARACTERISTICS[s.type];
      return (
        char.intensityLevel === 'hard' ||
        char.intensityLevel === 'very_hard' ||
        s.type === 'long' // Long run counts as quality
      );
    });

    const limit = context.currentPhase === 'taper' ? 2 : 3;

    if (qualitySessions.length > limit) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        confidence: 0.9,
        priority: this.priority,
        category: this.category,
        message: `${qualitySessions.length} Quality Sessions diese Woche (empfohlen: max. ${limit}).`,
        violation: {
          severity: 'warning',
          message: 'Zu viele Quality Sessions',
          recommendation: 'Ersetze eine Quality Session durch einen Easy Run.',
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
      message: `${qualitySessions.length}/${limit} Quality Sessions diese Woche`,
      source: this.source,
    };
  }
}

/**
 * Intensity Based on VDOT Rule
 *
 * "Train at paces appropriate for your current fitness level"
 * - Jack Daniels' VDOT system
 */
export class VDOTBasedIntensityRule implements TrainingRule {
  id = 'intensity_vdot_based';
  name = 'VDOT-basierte Intensitäten';
  description =
    'Die Trainingsintensitäten sollten basierend auf dem aktuellen VDOT berechnet werden.';
  category = 'vdot_based' as const;
  priority = 'medium' as const;
  source = DANIELS_SOURCE;

  appliesTo(context: RuleContext): boolean {
    return context.vdot !== undefined && context.zones !== undefined;
  }

  evaluate(context: RuleContext): RuleResult {
    if (!context.zones) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: true,
        confidence: 0.5,
        priority: this.priority,
        category: this.category,
        message: 'VDOT-Zonen nicht verfügbar',
        source: this.source,
      };
    }

    // Check if sessions have appropriate paces
    // (This would need pace data from sessions)
    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: true,
      confidence: 1.0,
      priority: this.priority,
      category: this.category,
      message: `Trainiere basierend auf VDOT ${context.vdot}`,
      source: this.source,
    };
  }
}

// Export all intensity rules
export const INTENSITY_RULES: TrainingRule[] = [
  new EightyTwentyRule(),
  new ModerateIntensityTrapRule(),
  new PurposeDrivenIntensityRule(),
  new TaperIntensityRule(),
  new QualitySessionsLimitRule(),
  new VDOTBasedIntensityRule(),
];
