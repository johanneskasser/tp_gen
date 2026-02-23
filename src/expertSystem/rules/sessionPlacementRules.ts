/**
 * Session Placement Rules
 *
 * Based on:
 * - Jack Daniels' workout scheduling
 * - Pete Pfitzinger's weekly structure
 * - Herbert Steffny's training patterns
 *
 * Key principles:
 * - Long runs on weekends
 * - Quality sessions midweek (Tue-Thu)
 * - Recovery after hard sessions
 * - Avoid back-to-back hard days
 */

import { TrainingRule, RuleContext, RuleResult, RuleSource } from '../types';
import { SESSION_CHARACTERISTICS, shouldAvoidAfter } from '../../config/sessionCharacteristics';
import { SessionType, TrainingSession } from '../../types';

// ============ Sources ============

const DANIELS_SOURCE: RuleSource = {
  author: 'Jack Daniels',
  book: "Daniels' Running Formula",
  principle: 'Workout Scheduling',
};

const PFITZINGER_SOURCE: RuleSource = {
  author: 'Pete Pfitzinger',
  book: 'Advanced Marathoning',
  principle: 'Weekly Training Structure',
};

const STEFFNY_SOURCE: RuleSource = {
  author: 'Herbert Steffny',
  book: 'Das große Laufbuch',
  principle: 'Wochenstruktur und Trainingsplanung',
};

// ============ Day Names ============

const DAY_NAMES = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

// ============ Session Placement Rules ============

/**
 * Long Run Weekend Rule
 *
 * "Place long runs on weekends when you have more time"
 * - Universal coaching consensus
 */
export class LongRunWeekendRule implements TrainingRule {
  id = 'placement_long_run_weekend';
  name = 'Langer Lauf am Wochenende';
  description =
    'Der lange Lauf sollte am Wochenende (Samstag oder Sonntag) stattfinden.';
  category = 'session_placement' as const;
  priority = 'medium' as const;
  source = STEFFNY_SOURCE;

  appliesTo(context: RuleContext): boolean {
    const hasLongRun = context.existingSessions.some((s) => s.type === 'long');
    return hasLongRun;
  }

  evaluate(context: RuleContext): RuleResult {
    const longRun = context.existingSessions.find((s) => s.type === 'long');

    if (!longRun) {
      return this.createPassResult();
    }

    const isWeekend = longRun.dayOfWeek === 5 || longRun.dayOfWeek === 6;

    if (!isWeekend) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        confidence: 0.7, // Medium confidence - some prefer weekday long runs
        priority: this.priority,
        category: this.category,
        message: `Langer Lauf an ${DAY_NAMES[longRun.dayOfWeek]} geplant. Wochenende ist meist besser.`,
        violation: {
          severity: 'warning',
          message: 'Long Run nicht am Wochenende',
          recommendation: 'Verschiebe den langen Lauf auf Samstag oder Sonntag.',
        },
        source: this.source,
      };
    }

    return this.createPassResult();
  }

  private createPassResult(): RuleResult {
    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: true,
      confidence: 1.0,
      priority: this.priority,
      category: this.category,
      message: 'Langer Lauf optimal am Wochenende platziert',
      source: this.source,
    };
  }
}

/**
 * Quality Sessions Midweek Rule
 *
 * "Schedule quality sessions for Tuesday/Wednesday/Thursday"
 * - Pete Pfitzinger, Jack Daniels
 */
export class QualitySessionsMidweekRule implements TrainingRule {
  id = 'placement_quality_midweek';
  name = 'Quality Sessions unter der Woche';
  description =
    'Intervall- und Tempotraining sollten idealerweise Dienstag bis Donnerstag stattfinden.';
  category = 'session_placement' as const;
  priority = 'medium' as const;
  source = PFITZINGER_SOURCE;

  private qualityTypes: SessionType[] = ['intervals', 'tempo', 'hill_repeats', 'fartlek'];

  appliesTo(context: RuleContext): boolean {
    return context.existingSessions.some((s) => this.qualityTypes.includes(s.type));
  }

  evaluate(context: RuleContext): RuleResult {
    const issues: string[] = [];

    for (const session of context.existingSessions) {
      if (this.qualityTypes.includes(session.type)) {
        // Ideal days: 1 (Tue), 2 (Wed), 3 (Thu)
        const isIdealDay = session.dayOfWeek >= 1 && session.dayOfWeek <= 3;

        if (!isIdealDay) {
          issues.push(
            `${this.getSessionName(session.type)} an ${DAY_NAMES[session.dayOfWeek]}`
          );
        }
      }
    }

    if (issues.length > 0) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: true, // Not critical, just a suggestion
        confidence: 0.65,
        priority: this.priority,
        category: this.category,
        message: `Quality Sessions nicht optimal platziert: ${issues.join(', ')}. Dienstag-Donnerstag ist ideal.`,
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
      message: 'Quality Sessions optimal platziert',
      source: this.source,
    };
  }

  private getSessionName(type: SessionType): string {
    const names: Record<string, string> = {
      intervals: 'Intervalltraining',
      tempo: 'Tempodauerlauf',
      hill_repeats: 'Bergwiederholungen',
      fartlek: 'Fartlek',
    };
    return names[type] || type;
  }
}

/**
 * Back-to-Back Hard Days Rule
 *
 * "Never schedule two hard workouts on consecutive days"
 * - Universal coaching principle
 */
export class NoBackToBackHardRule implements TrainingRule {
  id = 'placement_no_back_to_back';
  name = 'Keine aufeinanderfolgenden harten Tage';
  description =
    'Zwischen harten Einheiten sollte mindestens ein lockerer Tag liegen.';
  category = 'session_placement' as const;
  priority = 'critical' as const;
  source = DANIELS_SOURCE;

  appliesTo(context: RuleContext): boolean {
    return context.existingSessions.length >= 2;
  }

  evaluate(context: RuleContext): RuleResult {
    const sortedSessions = [...context.existingSessions].sort(
      (a, b) => a.dayOfWeek - b.dayOfWeek
    );

    for (let i = 0; i < sortedSessions.length - 1; i++) {
      const current = sortedSessions[i];
      const next = sortedSessions[i + 1];

      if (next.dayOfWeek - current.dayOfWeek === 1) {
        const currentHard = this.isHardSession(current);
        const nextHard = this.isHardSession(next);

        if (currentHard && nextHard) {
          return {
            ruleId: this.id,
            ruleName: this.name,
            passed: false,
            confidence: 0.95,
            priority: this.priority,
            category: this.category,
            message: `Zwei harte Einheiten hintereinander: ${this.getSessionName(current.type)} (${DAY_NAMES[current.dayOfWeek]}) und ${this.getSessionName(next.type)} (${DAY_NAMES[next.dayOfWeek]}).`,
            violation: {
              severity: 'error',
              message: 'Aufeinanderfolgende harte Tage',
              recommendation: 'Füge einen Easy- oder Recovery-Run dazwischen ein.',
            },
            source: this.source,
          };
        }
      }
    }

    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: true,
      confidence: 1.0,
      priority: this.priority,
      category: this.category,
      message: 'Keine aufeinanderfolgenden harten Tage',
      source: this.source,
    };
  }

  private isHardSession(session: TrainingSession): boolean {
    const char = SESSION_CHARACTERISTICS[session.type];
    return char.intensityLevel === 'hard' || char.intensityLevel === 'very_hard';
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
 * Pre-Race Day Rule
 *
 * "The day before a race should be rest or very easy"
 * - Universal consensus
 */
export class PreRaceDayRule implements TrainingRule {
  id = 'placement_pre_race';
  name = 'Tag vor dem Wettkampf';
  description =
    'Der Tag vor dem Wettkampf sollte Ruhe oder ein sehr lockerer Lauf sein.';
  category = 'session_placement' as const;
  priority = 'high' as const;
  source = PFITZINGER_SOURCE;

  appliesTo(context: RuleContext): boolean {
    return context.existingSessions.some((s) => s.type === 'race');
  }

  evaluate(context: RuleContext): RuleResult {
    const race = context.existingSessions.find((s) => s.type === 'race');
    if (!race) return this.createPassResult();

    const dayBeforeRace = race.dayOfWeek - 1;
    const sessionDayBefore = context.existingSessions.find(
      (s) => s.dayOfWeek === dayBeforeRace
    );

    if (sessionDayBefore) {
      const char = SESSION_CHARACTERISTICS[sessionDayBefore.type];

      if (char.intensityLevel !== 'easy') {
        return {
          ruleId: this.id,
          ruleName: this.name,
          passed: false,
          confidence: 0.9,
          priority: this.priority,
          category: this.category,
          message: `${this.getSessionName(sessionDayBefore.type)} am Tag vor dem Wettkampf ist nicht optimal.`,
          violation: {
            severity: 'warning',
            message: 'Zu intensive Einheit vor Wettkampf',
            recommendation: 'Ersetze durch Ruhetag oder kurzen lockeren Lauf mit Steigerungen.',
          },
          suggestion: {
            type: 'strides',
            distance: 4,
            confidence: 0.9,
            reasoning: 'Lockerer Shakeout-Lauf vor dem Wettkampf',
            priority: 'high',
            intensityLevel: 'easy',
            notes: '4 km locker + 4-6 Steigerungen',
          },
          source: this.source,
        };
      }
    }

    return this.createPassResult();
  }

  private createPassResult(): RuleResult {
    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: true,
      confidence: 1.0,
      priority: this.priority,
      category: this.category,
      message: 'Wettkampf-Vortag optimal geplant',
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
}

/**
 * Pre-Long Run Day Rule
 *
 * "The day before a long run should be easy or rest"
 * - Common coaching advice
 */
export class PreLongRunRule implements TrainingRule {
  id = 'placement_pre_long_run';
  name = 'Tag vor dem langen Lauf';
  description =
    'Der Tag vor dem langen Lauf sollte locker oder ein Ruhetag sein.';
  category = 'session_placement' as const;
  priority = 'medium' as const;
  source = STEFFNY_SOURCE;

  appliesTo(context: RuleContext): boolean {
    return context.existingSessions.some((s) => s.type === 'long');
  }

  evaluate(context: RuleContext): RuleResult {
    const longRun = context.existingSessions.find((s) => s.type === 'long');
    if (!longRun) return this.createPassResult();

    const dayBeforeLong = longRun.dayOfWeek - 1;
    if (dayBeforeLong < 0) return this.createPassResult(); // Monday long run, check previous week

    const sessionDayBefore = context.existingSessions.find(
      (s) => s.dayOfWeek === dayBeforeLong
    );

    if (sessionDayBefore) {
      const char = SESSION_CHARACTERISTICS[sessionDayBefore.type];

      if (char.intensityLevel === 'hard' || char.intensityLevel === 'very_hard') {
        return {
          ruleId: this.id,
          ruleName: this.name,
          passed: false,
          confidence: 0.8,
          priority: this.priority,
          category: this.category,
          message: `Harte Einheit (${this.getSessionName(sessionDayBefore.type)}) am Tag vor dem Long Run.`,
          violation: {
            severity: 'warning',
            message: 'Harte Einheit vor Long Run',
            recommendation: 'Plane einen lockeren Lauf oder Ruhetag vor dem Long Run.',
          },
          source: this.source,
        };
      }
    }

    return this.createPassResult();
  }

  private createPassResult(): RuleResult {
    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: true,
      confidence: 1.0,
      priority: this.priority,
      category: this.category,
      message: 'Tag vor Long Run ist angemessen',
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
}

/**
 * Session Sequence Avoidance Rule
 *
 * "Certain sessions should not follow certain other sessions"
 * - Based on session characteristics
 */
export class SessionSequenceRule implements TrainingRule {
  id = 'placement_session_sequence';
  name = 'Session-Reihenfolge';
  description =
    'Bestimmte Einheiten sollten nicht direkt auf andere folgen.';
  category = 'session_placement' as const;
  priority = 'high' as const;
  source = DANIELS_SOURCE;

  appliesTo(context: RuleContext): boolean {
    return context.existingSessions.length >= 2;
  }

  evaluate(context: RuleContext): RuleResult {
    const sortedSessions = [...context.existingSessions].sort(
      (a, b) => a.dayOfWeek - b.dayOfWeek
    );

    const violations: string[] = [];

    for (let i = 0; i < sortedSessions.length - 1; i++) {
      const current = sortedSessions[i];
      const next = sortedSessions[i + 1];

      // Only check consecutive days
      if (next.dayOfWeek - current.dayOfWeek === 1) {
        if (shouldAvoidAfter(next.type, current.type)) {
          violations.push(
            `${this.getSessionName(next.type)} sollte nicht auf ${this.getSessionName(current.type)} folgen`
          );
        }
      }
    }

    if (violations.length > 0) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        confidence: 0.85,
        priority: this.priority,
        category: this.category,
        message: violations.join('. ') + '.',
        violation: {
          severity: 'warning',
          message: 'Suboptimale Trainingsreihenfolge',
          recommendation: 'Füge einen Easy Run zwischen diesen Einheiten ein.',
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
      message: 'Trainingsreihenfolge ist optimal',
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
}

/**
 * Monday Easy Start Rule
 *
 * "Start the week with an easy day to recover from weekend long run"
 * - Common periodization approach
 */
export class MondayEasyRule implements TrainingRule {
  id = 'placement_monday_easy';
  name = 'Montag: Lockerer Start';
  description =
    'Die Woche sollte nach dem Wochenend-Long-Run mit einem lockeren Tag beginnen.';
  category = 'session_placement' as const;
  priority = 'low' as const;
  source = STEFFNY_SOURCE;

  appliesTo(context: RuleContext): boolean {
    // Only if there was a weekend long run
    const hasWeekendLongRun = context.existingSessions.some(
      (s) => s.type === 'long' && (s.dayOfWeek === 5 || s.dayOfWeek === 6)
    );
    return hasWeekendLongRun;
  }

  evaluate(context: RuleContext): RuleResult {
    const mondaySession = context.existingSessions.find((s) => s.dayOfWeek === 0);

    if (mondaySession) {
      const char = SESSION_CHARACTERISTICS[mondaySession.type];

      if (char.intensityLevel !== 'easy') {
        return {
          ruleId: this.id,
          ruleName: this.name,
          passed: false,
          confidence: 0.6,
          priority: this.priority,
          category: this.category,
          message: `${this.getSessionName(mondaySession.type)} am Montag nach dem Wochenend-Long-Run.`,
          violation: {
            severity: 'warning',
            message: 'Harte Einheit am Montag',
            recommendation: 'Nach dem langen Lauf am Wochenende empfiehlt sich Montag ein lockerer Tag.',
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
      message: 'Montag ist angemessen locker',
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
}

// Export all session placement rules
export const SESSION_PLACEMENT_RULES: TrainingRule[] = [
  new LongRunWeekendRule(),
  new QualitySessionsMidweekRule(),
  new NoBackToBackHardRule(),
  new PreRaceDayRule(),
  new PreLongRunRule(),
  new SessionSequenceRule(),
  new MondayEasyRule(),
];
