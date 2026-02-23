/**
 * Recovery Rules
 *
 * Based on:
 * - Jack Daniels: Recovery principles and stress/recovery balance
 * - Pete Pfitzinger: Hard/easy day principle
 * - Hansons: Cumulative fatigue management
 * - Marquardt: Injury prevention through adequate recovery
 *
 * Key principles:
 * - 48-72 hours between hard sessions
 * - Recovery runs after hard efforts
 * - Supercompensation cycle
 */

import { TrainingRule, RuleContext, RuleResult, RuleSource, SessionSuggestion } from '../types';
import { SESSION_CHARACTERISTICS } from '../../config/sessionCharacteristics';
import { SessionType } from '../../types';

// ============ Sources ============

const DANIELS_SOURCE: RuleSource = {
  author: 'Jack Daniels',
  book: "Daniels' Running Formula",
  principle: 'Stress/Recovery Balance',
};

const PFITZINGER_SOURCE: RuleSource = {
  author: 'Pete Pfitzinger',
  book: 'Advanced Marathoning',
  principle: 'Hard/Easy Day Principle',
};

const HANSONS_SOURCE: RuleSource = {
  author: 'Keith & Kevin Hanson',
  book: 'Hansons Marathon Method',
  principle: 'Cumulative Fatigue Management',
};

const MARQUARDT_SOURCE: RuleSource = {
  author: 'Dr. Matthias Marquardt',
  book: 'Die Laufbibel',
  principle: 'Verletzungsprävention durch Regeneration',
};

// ============ Recovery Rules ============

/**
 * 48-Hour Rule for Interval Training
 *
 * "Always allow 48-72 hours between high-intensity track workouts for proper recovery"
 * - Jack Daniels & general sports science consensus
 */
export class IntervalRecoveryRule implements TrainingRule {
  id = 'recovery_interval_48h';
  name = '48-Stunden-Regel nach Intervalltraining';
  description =
    'Nach einem Intervalltraining sollten mindestens 48 Stunden Regeneration folgen, bevor die nächste harte Einheit ansteht.';
  category = 'recovery' as const;
  priority = 'critical' as const;
  source = DANIELS_SOURCE;

  appliesTo(context: RuleContext): boolean {
    // Applies if there was an interval session recently
    return context.existingSessions.some(
      (s) => s.type === 'intervals' && context.dayOfWeek - s.dayOfWeek < 2
    );
  }

  evaluate(context: RuleContext): RuleResult {
    const intervalSession = context.existingSessions.find((s) => s.type === 'intervals');
    if (!intervalSession) {
      return this.createPassResult(context);
    }

    const daysSinceInterval = context.dayOfWeek - intervalSession.dayOfWeek;

    if (daysSinceInterval < 2) {
      // Violation: too soon for another hard session
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        confidence: 0.95,
        priority: this.priority,
        category: this.category,
        message: `Nur ${daysSinceInterval} Tag(e) seit dem letzten Intervalltraining. Mindestens 48h Regeneration empfohlen.`,
        violation: {
          severity: 'error',
          message: 'Zu kurze Regeneration nach Intervalltraining',
          recommendation: 'Plane einen Recovery- oder Easy-Run ein.',
        },
        suggestion: this.createRecoverySuggestion(context),
        source: this.source,
      };
    }

    return this.createPassResult(context);
  }

  private createPassResult(_context: RuleContext): RuleResult {
    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: true,
      confidence: 1.0,
      priority: this.priority,
      category: this.category,
      message: 'Ausreichend Regeneration nach Intervalltraining',
      source: this.source,
    };
  }

  private createRecoverySuggestion(context: RuleContext): SessionSuggestion {
    return {
      type: 'recovery',
      distance: Math.min(8, context.raceDistance * 0.15),
      confidence: 0.95,
      reasoning: 'Regenerationslauf nach Intervalltraining (48h-Regel)',
      priority: 'high',
      intensityLevel: 'easy',
      notes: 'Sehr lockeres Tempo, Fokus auf Erholung',
    };
  }
}

/**
 * Hard/Easy Day Principle
 *
 * "Every high-intensity workout or hard effort should be followed by a recovery run"
 * - Pete Pfitzinger & general coaching consensus
 */
export class HardEasyPrincipleRule implements TrainingRule {
  id = 'recovery_hard_easy_principle';
  name = 'Hard/Easy Prinzip';
  description =
    'Nach jeder harten Einheit sollte ein lockerer oder Regenerationslauf folgen.';
  category = 'recovery' as const;
  priority = 'high' as const;
  source = PFITZINGER_SOURCE;

  private hardSessionTypes: SessionType[] = [
    'intervals',
    'tempo',
    'race',
    'hill_repeats',
    'fartlek',
    'long', // Long runs also need recovery
  ];

  appliesTo(context: RuleContext): boolean {
    return context.previousDaySession !== undefined;
  }

  evaluate(context: RuleContext): RuleResult {
    const prevSession = context.previousDaySession;
    if (!prevSession) {
      return this.createPassResult();
    }

    const wasHardSession = this.isHardSession(prevSession.type);

    if (wasHardSession) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: true, // This is a suggestion, not a violation
        confidence: 0.9,
        priority: this.priority,
        category: this.category,
        message: `Nach gestrigem ${this.getSessionName(prevSession.type)} wird ein lockerer Lauf empfohlen.`,
        suggestion: this.createRecoverySuggestion(context, prevSession.type),
        source: this.source,
      };
    }

    return this.createPassResult();
  }

  private isHardSession(type: SessionType): boolean {
    const char = SESSION_CHARACTERISTICS[type];
    return (
      this.hardSessionTypes.includes(type) ||
      char.intensityLevel === 'hard' ||
      char.intensityLevel === 'very_hard'
    );
  }

  private createPassResult(): RuleResult {
    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: true,
      confidence: 1.0,
      priority: this.priority,
      category: this.category,
      message: 'Kein spezieller Recovery-Bedarf heute',
      source: this.source,
    };
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

  private createRecoverySuggestion(
    context: RuleContext,
    previousType: SessionType
  ): SessionSuggestion {
    // Recovery distance based on previous session intensity
    const char = SESSION_CHARACTERISTICS[previousType];
    let recoveryDistance: number;

    if (char.intensityScore >= 8) {
      // Very hard session: shorter recovery
      recoveryDistance = Math.min(6, context.raceDistance * 0.12);
    } else if (char.intensityScore >= 6) {
      // Hard session: moderate recovery
      recoveryDistance = Math.min(8, context.raceDistance * 0.15);
    } else {
      // Moderate session: easy run
      recoveryDistance = Math.min(10, context.raceDistance * 0.18);
    }

    return {
      type: 'recovery',
      distance: Math.round(recoveryDistance * 10) / 10,
      confidence: 0.9,
      reasoning: `Erholung nach ${this.getSessionName(previousType)}`,
      priority: 'high',
      intensityLevel: 'easy',
      notes: 'Lockeres Tempo, bei Bedarf Gehpausen einbauen',
    };
  }
}

/**
 * Maximum Hard Sessions Per Week Rule
 *
 * "Most runners should limit hard workouts to 2-3 per week"
 * - Consensus from Daniels, Pfitzinger, and Hansons
 */
export class MaxHardSessionsRule implements TrainingRule {
  id = 'recovery_max_hard_sessions';
  name = 'Maximale harte Einheiten pro Woche';
  description = 'Maximal 2-3 harte Einheiten pro Woche (inkl. Long Run).';
  category = 'recovery' as const;
  priority = 'high' as const;
  source = PFITZINGER_SOURCE;

  appliesTo(_context: RuleContext): boolean {
    return true; // Always applies
  }

  evaluate(context: RuleContext): RuleResult {
    // Count hard sessions
    const hardSessions = context.existingSessions.filter((s) => {
      const char = SESSION_CHARACTERISTICS[s.type];
      return char.intensityLevel === 'hard' || char.intensityLevel === 'very_hard';
    });

    // Adjust limit based on experience and phase
    let maxHardSessions = 2;
    if (context.currentPhase === 'build' || context.currentPhase === 'peak') {
      maxHardSessions = 3;
    }
    if (context.currentPhase === 'taper' || context.currentPhase === 'recovery') {
      maxHardSessions = 1;
    }

    if (hardSessions.length >= maxHardSessions) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        confidence: 0.9,
        priority: this.priority,
        category: this.category,
        message: `Bereits ${hardSessions.length} harte Einheiten diese Woche (Maximum: ${maxHardSessions}).`,
        violation: {
          severity: hardSessions.length > maxHardSessions ? 'error' : 'warning',
          message: 'Zu viele harte Einheiten in dieser Woche',
          recommendation: 'Plane die restlichen Tage mit Easy- oder Recovery-Läufen.',
        },
        suggestion: {
          type: 'easy',
          distance: Math.min(8, context.targetWeeklyKm * 0.1),
          confidence: 0.85,
          reasoning: 'Lockerer Lauf um die Wochenlast zu balancieren',
          priority: 'high',
          intensityLevel: 'easy',
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
      message: `${hardSessions.length}/${maxHardSessions} harte Einheiten diese Woche`,
      source: this.source,
    };
  }
}

/**
 * Recovery Week Rule
 *
 * "Plan a recovery week every 3-4 weeks with 20-30% volume reduction"
 * - Pfitzinger, Daniels, and periodization science
 */
export class RecoveryWeekRule implements TrainingRule {
  id = 'recovery_week_scheduling';
  name = 'Regenerationswoche alle 3-4 Wochen';
  description =
    'Nach 3-4 Wochen progressiver Steigerung sollte eine Regenerationswoche mit 20-30% Volumenreduktion folgen.';
  category = 'recovery' as const;
  priority = 'high' as const;
  source = PFITZINGER_SOURCE;

  appliesTo(context: RuleContext): boolean {
    // Applies when checking week structure
    return context.currentPhase !== 'taper';
  }

  evaluate(context: RuleContext): RuleResult {
    // Check if this should be a recovery week
    const recoveryFrequency = context.raceDistance >= 42 ? 4 : 3;
    const isRecoveryWeek =
      context.currentWeekNumber % recoveryFrequency === 0 && context.currentWeekNumber > 0;

    if (isRecoveryWeek) {
      const recommendedVolume = context.previousWeekKm * 0.75;

      if (context.targetWeeklyKm > recommendedVolume * 1.1) {
        return {
          ruleId: this.id,
          ruleName: this.name,
          passed: false,
          confidence: 0.85,
          priority: this.priority,
          category: this.category,
          message: `Woche ${context.currentWeekNumber} sollte eine Regenerationswoche sein.`,
          violation: {
            severity: 'warning',
            message: 'Regenerationswoche überfällig',
            recommendation: `Reduziere das Volumen auf ca. ${Math.round(recommendedVolume)} km.`,
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
      message: context.consecutiveHardWeeks < recoveryFrequency
        ? `Noch ${recoveryFrequency - context.consecutiveHardWeeks} Wochen bis zur nächsten Regenerationswoche`
        : 'Regenerationswoche korrekt geplant',
      source: this.source,
    };
  }
}

/**
 * Cumulative Fatigue Warning Rule (Hansons)
 *
 * "Cumulative fatigue is the accumulation of fatigue over days, weeks, and months"
 * - Hansons Marathon Method
 */
export class CumulativeFatigueRule implements TrainingRule {
  id = 'recovery_cumulative_fatigue';
  name = 'Kumulative Ermüdung überwachen';
  description =
    'Die kumulative Ermüdung sollte kontrolliert aufgebaut werden, ohne den Körper zu überlasten.';
  category = 'cumulative_fatigue' as const;
  priority = 'high' as const;
  source = HANSONS_SOURCE;

  appliesTo(context: RuleContext): boolean {
    return context.cumulativeFatigueScore !== undefined;
  }

  evaluate(context: RuleContext): RuleResult {
    const fatigueScore = context.cumulativeFatigueScore;

    // Fatigue thresholds
    if (fatigueScore > 85) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        confidence: 0.95,
        priority: 'critical',
        category: this.category,
        message: `Hohe kumulative Ermüdung (${fatigueScore}/100). Regeneration dringend notwendig!`,
        violation: {
          severity: 'error',
          message: 'Kritische Ermüdung erreicht',
          recommendation: 'Plane 1-2 Ruhetage oder sehr lockere Läufe ein.',
        },
        suggestion: {
          type: 'recovery',
          distance: 5,
          confidence: 0.95,
          reasoning: 'Regeneration bei hoher kumulativer Ermüdung',
          priority: 'high',
          intensityLevel: 'easy',
          notes: 'Alternativ: Ruhetag oder Cross-Training',
        },
        source: this.source,
      };
    }

    if (fatigueScore > 70) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: true,
        confidence: 0.8,
        priority: this.priority,
        category: this.category,
        message: `Erhöhte Ermüdung (${fatigueScore}/100). Trainingsbelastung beobachten.`,
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
      message: `Ermüdungslevel im grünen Bereich (${fatigueScore}/100)`,
      source: this.source,
    };
  }
}

/**
 * Rest Day Rule
 *
 * "Every runner should have at least one full rest day each week"
 * - General coaching consensus
 */
export class RestDayRule implements TrainingRule {
  id = 'recovery_rest_day';
  name = 'Mindestens ein Ruhetag pro Woche';
  description =
    'Jeder Läufer sollte mindestens einen kompletten Ruhetag pro Woche einplanen.';
  category = 'recovery' as const;
  priority = 'high' as const;
  source = MARQUARDT_SOURCE;

  appliesTo(_context: RuleContext): boolean {
    return true;
  }

  evaluate(context: RuleContext): RuleResult {
    // Count rest days (days without sessions)
    const sessionDays = new Set(context.existingSessions.map((s) => s.dayOfWeek));
    const daysWithSessions = sessionDays.size;

    if (daysWithSessions >= 7) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        confidence: 0.9,
        priority: this.priority,
        category: this.category,
        message: 'Kein Ruhetag diese Woche geplant!',
        violation: {
          severity: 'warning',
          message: 'Fehlender Ruhetag',
          recommendation: 'Plane mindestens einen kompletten Ruhetag ein.',
        },
        source: this.source,
      };
    }

    const restDays = 7 - daysWithSessions;
    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: true,
      confidence: 1.0,
      priority: this.priority,
      category: this.category,
      message: `${restDays} Ruhetag(e) diese Woche eingeplant`,
      source: this.source,
    };
  }
}

// Export all recovery rules
export const RECOVERY_RULES: TrainingRule[] = [
  new IntervalRecoveryRule(),
  new HardEasyPrincipleRule(),
  new MaxHardSessionsRule(),
  new RecoveryWeekRule(),
  new CumulativeFatigueRule(),
  new RestDayRule(),
];
