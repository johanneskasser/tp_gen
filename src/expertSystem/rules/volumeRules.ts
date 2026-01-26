/**
 * Volume Progression Rules
 *
 * Based on:
 * - The 10% Rule (general consensus, Marquardt)
 * - Pete Pfitzinger's periodization
 * - Herbert Steffny's progressive volume plans
 *
 * Key principles:
 * - Increase weekly volume by max 10% per week
 * - Include recovery weeks every 3-4 weeks
 * - Peak volume 2-3 weeks before race
 */

import { TrainingRule, RuleContext, RuleResult, RuleSource } from '../types';

// ============ Sources ============

const MARQUARDT_SOURCE: RuleSource = {
  author: 'Dr. Matthias Marquardt',
  book: 'Die Laufbibel',
  principle: '10%-Regel zur Verletzungsprävention',
};

const PFITZINGER_SOURCE: RuleSource = {
  author: 'Pete Pfitzinger',
  book: 'Advanced Marathoning',
  principle: 'Progressive Overload mit Erholungsphasen',
};

const STEFFNY_SOURCE: RuleSource = {
  author: 'Herbert Steffny',
  book: 'Das große Laufbuch',
  principle: 'Schrittweise Volumenerhöhung',
};

// ============ Volume Rules ============

/**
 * 10% Rule
 *
 * "Steigere die Wochenkilometer um maximal 10%"
 * - Dr. Matthias Marquardt, Die Laufbibel
 * - General sports science consensus
 */
export class TenPercentRule implements TrainingRule {
  id = 'volume_ten_percent';
  name = '10%-Regel';
  description =
    'Die wöchentliche Laufumfang sollte um maximal 10% gegenüber der Vorwoche gesteigert werden.';
  category = 'volume' as const;
  priority = 'critical' as const;
  source = MARQUARDT_SOURCE;

  appliesTo(context: RuleContext): boolean {
    // Applies when there's previous week data and we're building volume
    return context.previousWeekKm > 0 && context.currentPhase !== 'taper';
  }

  evaluate(context: RuleContext): RuleResult {
    const percentIncrease =
      ((context.targetWeeklyKm - context.previousWeekKm) / context.previousWeekKm) * 100;

    // Allow more flexibility in recovery weeks (negative is fine)
    if (context.currentPhase === 'recovery') {
      if (percentIncrease > 0) {
        return {
          ruleId: this.id,
          ruleName: this.name,
          passed: false,
          confidence: 0.85,
          priority: this.priority,
          category: this.category,
          message: `Volumen steigt um ${percentIncrease.toFixed(1)}% in einer Regenerationswoche.`,
          violation: {
            severity: 'warning',
            message: 'Volumensteigerung in Regenerationswoche',
            recommendation: 'Reduziere das Volumen um 20-30% in der Regenerationswoche.',
          },
          source: this.source,
        };
      }
      return this.createPassResult(percentIncrease);
    }

    // Check 10% rule
    if (percentIncrease > 10) {
      const safeIncrease = context.previousWeekKm * 1.1;

      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        confidence: 0.95,
        priority: this.priority,
        category: this.category,
        message: `Volumensteigerung von ${percentIncrease.toFixed(1)}% überschreitet die 10%-Regel.`,
        violation: {
          severity: percentIncrease > 15 ? 'error' : 'warning',
          message: 'Zu schnelle Volumensteigerung',
          recommendation: `Maximales empfohlenes Volumen: ${Math.round(safeIncrease)} km`,
        },
        source: this.source,
      };
    }

    return this.createPassResult(percentIncrease);
  }

  private createPassResult(percentIncrease: number): RuleResult {
    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: true,
      confidence: 1.0,
      priority: this.priority,
      category: this.category,
      message:
        percentIncrease >= 0
          ? `Volumensteigerung von ${percentIncrease.toFixed(1)}% ist im sicheren Bereich`
          : `Volumenreduktion von ${Math.abs(percentIncrease).toFixed(1)}%`,
      source: this.source,
    };
  }
}

/**
 * Peak Volume Timing Rule
 *
 * "Peak training volume should occur 2-4 weeks before the race"
 * - Pete Pfitzinger, Advanced Marathoning
 */
export class PeakVolumeTimingRule implements TrainingRule {
  id = 'volume_peak_timing';
  name = 'Peak-Volumen-Timing';
  description =
    'Das höchste Trainingsvolumen sollte 2-4 Wochen vor dem Wettkampf erreicht werden.';
  category = 'volume' as const;
  priority = 'high' as const;
  source = PFITZINGER_SOURCE;

  appliesTo(context: RuleContext): boolean {
    return context.totalWeeks >= 8; // Only for longer plans
  }

  evaluate(context: RuleContext): RuleResult {
    const weeksUntilRace = Math.ceil(context.daysUntilRace / 7);
    // idealPeakWeek would be context.totalWeeks - 3 (3 weeks before race)

    // Check if we're in peak volume phase
    if (weeksUntilRace >= 2 && weeksUntilRace <= 4) {
      // This should be peak or near-peak volume
      const peakVolume = this.estimatePeakVolume(context);

      if (context.targetWeeklyKm < peakVolume * 0.85) {
        return {
          ruleId: this.id,
          ruleName: this.name,
          passed: false,
          confidence: 0.75,
          priority: this.priority,
          category: this.category,
          message: `${weeksUntilRace} Wochen vor dem Wettkampf: Volumen könnte höher sein für Peak-Phase.`,
          violation: {
            severity: 'warning',
            message: 'Volumen unter Peak-Niveau',
            recommendation: `Erwäge Steigerung auf ${Math.round(peakVolume)} km`,
          },
          source: this.source,
        };
      }
    }

    // Check if volume is too high too close to race
    if (weeksUntilRace < 2 && context.targetWeeklyKm > context.peakWeeklyKm * 0.7) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        confidence: 0.9,
        priority: this.priority,
        category: this.category,
        message: 'Volumen zu hoch kurz vor dem Wettkampf (Taper-Phase).',
        violation: {
          severity: 'error',
          message: 'Fehlendes Tapering',
          recommendation: `Reduziere auf ${Math.round(context.peakWeeklyKm * 0.5)}-${Math.round(context.peakWeeklyKm * 0.7)} km`,
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
      message: 'Volumen-Timing passt zur Planphase',
      source: this.source,
    };
  }

  private estimatePeakVolume(context: RuleContext): number {
    // Estimate based on race distance (Pfitzinger guidelines)
    if (context.raceDistance >= 42) {
      // Marathon: 80-130 km peak
      return Math.max(80, Math.min(130, context.averageWeeklyKm * 1.3));
    } else if (context.raceDistance >= 21) {
      // Half Marathon: 65-100 km peak
      return Math.max(65, Math.min(100, context.averageWeeklyKm * 1.25));
    } else if (context.raceDistance >= 10) {
      // 10k: 50-80 km peak
      return Math.max(50, Math.min(80, context.averageWeeklyKm * 1.2));
    } else {
      // 5k: 40-70 km peak
      return Math.max(40, Math.min(70, context.averageWeeklyKm * 1.15));
    }
  }
}

/**
 * Long Run Proportion Rule
 *
 * "Long run should be 20-30% of weekly mileage, but not more than 35%"
 * - General coaching consensus, Steffny
 */
export class LongRunProportionRule implements TrainingRule {
  id = 'volume_long_run_proportion';
  name = 'Long Run Anteil am Wochenvolumen';
  description =
    'Der lange Lauf sollte 20-30% des Wochenvolumens ausmachen, maximal 35%.';
  category = 'volume' as const;
  priority = 'medium' as const;
  source = STEFFNY_SOURCE;

  appliesTo(context: RuleContext): boolean {
    return context.hasLongRunThisWeek;
  }

  evaluate(context: RuleContext): RuleResult {
    const longRun = context.existingSessions.find((s) => s.type === 'long');
    if (!longRun || !longRun.distance) {
      return this.createPassResult(0);
    }

    const longRunPercent = (longRun.distance / context.targetWeeklyKm) * 100;

    if (longRunPercent > 35) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        confidence: 0.85,
        priority: this.priority,
        category: this.category,
        message: `Long Run macht ${longRunPercent.toFixed(0)}% des Wochenvolumens aus (max. 35% empfohlen).`,
        violation: {
          severity: 'warning',
          message: 'Long Run Anteil zu hoch',
          recommendation: 'Erhöhe das restliche Wochenvolumen oder verkürze den Long Run.',
        },
        source: this.source,
      };
    }

    if (longRunPercent < 20 && context.currentPhase !== 'taper') {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: true,
        confidence: 0.7,
        priority: this.priority,
        category: this.category,
        message: `Long Run macht nur ${longRunPercent.toFixed(0)}% aus. Könnte länger sein (20-30% empfohlen).`,
        source: this.source,
      };
    }

    return this.createPassResult(longRunPercent);
  }

  private createPassResult(percent: number): RuleResult {
    return {
      ruleId: this.id,
      ruleName: this.name,
      passed: true,
      confidence: 1.0,
      priority: this.priority,
      category: this.category,
      message: percent > 0
        ? `Long Run Anteil: ${percent.toFixed(0)}% des Wochenvolumens`
        : 'Long Run Anteil nicht berechnet',
      source: this.source,
    };
  }
}

/**
 * Minimum Weekly Volume Rule
 *
 * Based on race distance requirements
 */
export class MinimumVolumeRule implements TrainingRule {
  id = 'volume_minimum';
  name = 'Mindestvolumen für Zieldistanz';
  description =
    'Für jede Wettkampfdistanz gibt es ein empfohlenes Mindest-Wochenvolumen.';
  category = 'volume' as const;
  priority = 'medium' as const;
  source = PFITZINGER_SOURCE;

  private getMinVolume(raceDistance: number): number {
    if (raceDistance >= 42) return 50; // Marathon: min 50 km/week
    if (raceDistance >= 21) return 40; // Half: min 40 km/week
    if (raceDistance >= 10) return 30; // 10k: min 30 km/week
    return 20; // 5k: min 20 km/week
  }

  appliesTo(context: RuleContext): boolean {
    return context.currentPhase !== 'recovery' && context.currentPhase !== 'taper';
  }

  evaluate(context: RuleContext): RuleResult {
    const minVolume = this.getMinVolume(context.raceDistance);

    if (context.targetWeeklyKm < minVolume) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        confidence: 0.75,
        priority: this.priority,
        category: this.category,
        message: `Wochenvolumen (${context.targetWeeklyKm} km) unter Minimum für ${context.raceDistance}k (${minVolume} km).`,
        violation: {
          severity: 'warning',
          message: 'Wochenvolumen unter Empfehlung',
          recommendation: `Steigere das Volumen schrittweise auf mindestens ${minVolume} km/Woche.`,
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
      message: `Wochenvolumen ausreichend für ${context.raceDistance}k`,
      source: this.source,
    };
  }
}

/**
 * Maximum Volume Based on Experience
 *
 * Prevent over-training for less experienced runners
 */
export class ExperienceBasedVolumeRule implements TrainingRule {
  id = 'volume_experience_based';
  name = 'Volumen basierend auf Erfahrung';
  description =
    'Das maximale Wochenvolumen sollte zur Lauferfahrung passen.';
  category = 'volume' as const;
  priority = 'high' as const;
  source = MARQUARDT_SOURCE;

  appliesTo(context: RuleContext): boolean {
    return context.weeklyKmBase !== undefined || context.runningExperience !== undefined;
  }

  evaluate(context: RuleContext): RuleResult {
    // Estimate safe maximum based on current base
    const currentBase = context.weeklyKmBase || context.averageWeeklyKm;
    const safeMaximum = currentBase * 1.3; // 30% above current base is max

    if (context.targetWeeklyKm > safeMaximum) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        confidence: 0.85,
        priority: this.priority,
        category: this.category,
        message: `Zielvolumen (${context.targetWeeklyKm} km) über deinem sicheren Maximum (${Math.round(safeMaximum)} km).`,
        violation: {
          severity: 'warning',
          message: 'Volumen über persönlichem Limit',
          recommendation: `Baue zuerst deine Basis auf ${Math.round(context.targetWeeklyKm / 1.3)} km auf, bevor du auf ${context.targetWeeklyKm} km steigerst.`,
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
      message: 'Zielvolumen passt zu deiner Erfahrung',
      source: this.source,
    };
  }
}

/**
 * Consecutive Build Weeks Limit
 *
 * "Don't build volume for more than 3-4 consecutive weeks without a down week"
 */
export class ConsecutiveBuildWeeksRule implements TrainingRule {
  id = 'volume_consecutive_build';
  name = 'Aufeinanderfolgende Aufbauwochen';
  description =
    'Nach 3-4 Wochen Volumenaufbau sollte eine Entlastungswoche folgen.';
  category = 'volume' as const;
  priority = 'high' as const;
  source = PFITZINGER_SOURCE;

  appliesTo(context: RuleContext): boolean {
    return context.consecutiveHardWeeks !== undefined;
  }

  evaluate(context: RuleContext): RuleResult {
    const maxConsecutive = context.raceDistance >= 42 ? 4 : 3;

    if (context.consecutiveHardWeeks >= maxConsecutive) {
      return {
        ruleId: this.id,
        ruleName: this.name,
        passed: false,
        confidence: 0.9,
        priority: this.priority,
        category: this.category,
        message: `${context.consecutiveHardWeeks} Aufbauwochen in Folge. Regenerationswoche empfohlen!`,
        violation: {
          severity: 'warning',
          message: 'Regenerationswoche überfällig',
          recommendation: 'Plane diese Woche als Regenerationswoche mit 20-30% weniger Volumen.',
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
      message: `${context.consecutiveHardWeeks}/${maxConsecutive} Aufbauwochen`,
      source: this.source,
    };
  }
}

// Export all volume rules
export const VOLUME_RULES: TrainingRule[] = [
  new TenPercentRule(),
  new PeakVolumeTimingRule(),
  new LongRunProportionRule(),
  new MinimumVolumeRule(),
  new ExperienceBasedVolumeRule(),
  new ConsecutiveBuildWeeksRule(),
];
