import { TrainingPlan } from '../types';
import { PhaseDetector } from './phaseDetection';
import { getRaceDistanceKm } from './calculationUtils';

interface VolumeRecommendation {
  targetWeeklyKm: number;
  minKm: number;
  maxKm: number;
  isRecoveryWeek: boolean;
  increaseFromLastWeek: number; // percentage
  reasoning: string[];
  warnings: string[];
}

/**
 * Intelligent volume progression analyzer
 * Implements 10% rule, recovery weeks, and phase-specific progression
 */
export class VolumeProgressionAnalyzer {
  private plan: TrainingPlan;
  private phaseDetector: PhaseDetector;
  private raceDistance: number;

  constructor(plan: TrainingPlan, currentWeekNumber: number) {
    this.plan = plan;
    this.phaseDetector = new PhaseDetector(plan, currentWeekNumber);
    this.raceDistance = getRaceDistanceKm(
      plan.event.distance,
      plan.event.customDistance
    );
  }

  /**
   * Get recommended volume for a specific week
   */
  getWeeklyVolumeRecommendation(weekNumber: number): VolumeRecommendation {
    const phase = this.phaseDetector.detectPhase(weekNumber);
    const previousWeekKm = this.getPreviousWeekKm(weekNumber);
    const peakVolume = this.estimatePeakVolume();

    const reasoning: string[] = [];
    const warnings: string[] = [];

    // Recovery week logic
    if (phase.phase === 'recovery') {
      const targetKm = previousWeekKm * 0.7; // 30% reduction
      reasoning.push('Regenerationswoche: 30% Volumen-Reduktion');
      reasoning.push('Fokus auf Erholung und Adaptation');

      return {
        targetWeeklyKm: Math.round(targetKm * 10) / 10,
        minKm: targetKm * 0.9,
        maxKm: targetKm * 1.1,
        isRecoveryWeek: true,
        increaseFromLastWeek: -30,
        reasoning,
        warnings,
      };
    }

    // Phase-specific volume multiplier
    const phaseMultiplier = this.phaseDetector.getPhaseVolumeMultiplier(
      phase.phase
    );
    const phaseTargetKm = peakVolume * phaseMultiplier;

    // Apply 10% rule
    const tenPercentIncrease = previousWeekKm * 0.1;
    const maxSafeIncrease = Math.max(5, tenPercentIncrease); // Min 5km increase

    let targetKm: number;
    let increasePercent: number;

    // Taper logic
    if (phase.phase === 'taper') {
      const taperReduction = 0.4 * (1 - phase.progress); // Progressive taper
      targetKm = peakVolume * (0.6 + taperReduction);
      increasePercent = ((targetKm - previousWeekKm) / previousWeekKm) * 100;

      reasoning.push(
        `Taper Phase: Volumen auf ${Math.round((0.6 + taperReduction) * 100)}% des Peaks reduzieren`
      );
      reasoning.push('Intensität beibehalten, aber Gesamtvolumen reduzieren');
    }
    // Normal progression
    else {
      // Smooth progression towards phase target
      // Start from current volume and progress to phase target
      const startVolume = weekNumber === 1 ? phaseTargetKm * 0.6 : previousWeekKm;
      const progressionTarget = startVolume + (phaseTargetKm - startVolume) * 0.3;

      // Apply 10% rule cap
      targetKm = Math.min(progressionTarget, previousWeekKm + maxSafeIncrease);
      increasePercent = ((targetKm - previousWeekKm) / previousWeekKm) * 100;

      reasoning.push(
        `${phase.description} (Woche ${phase.weekInPhase}/${phase.totalWeeksInPhase})`
      );
      reasoning.push(
        `Ziel-Volumen für ${phase.phase}-Phase: ~${Math.round(phaseTargetKm)}km/Woche`
      );

      // Check if increase is too aggressive
      if (increasePercent > 10) {
        warnings.push(
          `⚠️ Steigerung von ${Math.round(increasePercent)}% überschreitet 10%-Regel`
        );
        warnings.push('Risiko für Überlastung - erwäge moderatere Steigerung');
        targetKm = previousWeekKm * 1.1; // Cap at 10%
        increasePercent = 10;
      }

      // Check if increase is too slow for peak volume goal
      const weeksRemaining = this.plan.weeks.length - weekNumber;
      const volumeGap = phaseTargetKm - targetKm;
      const weeksToReachGoal = volumeGap / maxSafeIncrease;

      if (
        phase.phase === 'peak' &&
        weeksToReachGoal > weeksRemaining &&
        increasePercent < 8
      ) {
        reasoning.push(
          'Erhöhte Progression empfohlen um Peak-Volumen rechtzeitig zu erreichen'
        );
      }
    }

    // Previous week comparison
    if (weekNumber > 1) {
      reasoning.push(
        `Vorwoche: ${Math.round(previousWeekKm)}km → Diese Woche: ${Math.round(targetKm)}km (${increasePercent > 0 ? '+' : ''}${Math.round(increasePercent)}%)`
      );
    }

    // Warn about consecutive high-volume weeks
    if (this.hasConsecutiveHighVolumeWeeks(weekNumber)) {
      warnings.push(
        '⚠️ Mehrere aufeinanderfolgende Wochen mit hohem Volumen'
      );
      warnings.push('Erwäge eine Regenerationswoche in den nächsten 1-2 Wochen');
    }

    return {
      targetWeeklyKm: Math.round(targetKm * 10) / 10,
      minKm: Math.round(targetKm * 0.9 * 10) / 10,
      maxKm: Math.round(targetKm * 1.1 * 10) / 10,
      isRecoveryWeek: false,
      increaseFromLastWeek: Math.round(increasePercent * 10) / 10,
      reasoning,
      warnings,
    };
  }

  /**
   * Estimate peak weekly volume based on race distance
   */
  private estimatePeakVolume(): number {
    // Rule of thumb: peak volume based on race distance and experience level
    const baseVolumes: Record<string, number> = {
      '5K': 50, // 40-60km for 5k
      '10K': 60, // 50-70km for 10k
      'HM': 75, // 65-85km for half marathon
      'M': 90, // 75-105km for marathon
    };

    let baseVolume =
      baseVolumes[this.plan.event.distance] ||
      this.raceDistance * 2.5;

    // Adjust based on current average (if plan already has data)
    const currentAvg = this.getAverageWeeklyKm(this.plan.weeks.length);
    if (currentAvg > 0) {
      // Use higher of estimated or current trajectory
      baseVolume = Math.max(baseVolume, currentAvg * 1.3);
    }

    return baseVolume;
  }

  /**
   * Get previous week's total km
   */
  private getPreviousWeekKm(weekNumber: number): number {
    if (weekNumber <= 1) return 0;

    const previousWeek = this.plan.weeks.find(
      (w) => w.weekNumber === weekNumber - 1
    );
    return previousWeek?.totalKm || 0;
  }

  /**
   * Get average weekly km up to a certain week
   */
  private getAverageWeeklyKm(upToWeek: number): number {
    const weeks = this.plan.weeks.filter(
      (w) => w.weekNumber < upToWeek && w.totalKm > 0
    );
    if (weeks.length === 0) return 0;

    const total = weeks.reduce((sum, week) => sum + week.totalKm, 0);
    return total / weeks.length;
  }

  /**
   * Check if there are consecutive high-volume weeks
   */
  private hasConsecutiveHighVolumeWeeks(currentWeek: number): boolean {
    if (currentWeek < 3) return false;

    const recentWeeks = this.plan.weeks
      .filter(
        (w) =>
          w.weekNumber >= currentWeek - 2 && w.weekNumber < currentWeek
      )
      .sort((a, b) => a.weekNumber - b.weekNumber);

    if (recentWeeks.length < 2) return false;

    const avgKm = this.getAverageWeeklyKm(currentWeek);
    const highVolumeThreshold = avgKm * 1.1;

    // Check if last 2 weeks were both above average
    return recentWeeks.every((week) => week.totalKm > highVolumeThreshold);
  }

  /**
   * Analyze entire plan and suggest optimal progression
   */
  analyzePlanProgression(): {
    overallRating: 'excellent' | 'good' | 'needs_adjustment' | 'risky';
    issues: string[];
    suggestions: string[];
    weeklyBreakdown: {
      week: number;
      actualKm: number;
      recommendedKm: number;
      diff: number;
      status: 'good' | 'high' | 'low';
    }[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    const weeklyBreakdown: {
      week: number;
      actualKm: number;
      recommendedKm: number;
      diff: number;
      status: 'good' | 'high' | 'low';
    }[] = [];

    let violationsCount = 0;

    for (const week of this.plan.weeks) {
      const recommendation = this.getWeeklyVolumeRecommendation(week.weekNumber);
      const diff = week.totalKm - recommendation.targetWeeklyKm;
      const diffPercent = Math.abs(diff / recommendation.targetWeeklyKm) * 100;

      let status: 'good' | 'high' | 'low' = 'good';
      if (diffPercent > 15) {
        status = week.totalKm > recommendation.targetWeeklyKm ? 'high' : 'low';
        violationsCount++;
      }

      weeklyBreakdown.push({
        week: week.weekNumber,
        actualKm: week.totalKm,
        recommendedKm: recommendation.targetWeeklyKm,
        diff: Math.round(diff * 10) / 10,
        status,
      });

      // Check for 10% rule violations
      if (week.weekNumber > 1) {
        const prevWeek = this.plan.weeks.find(
          (w) => w.weekNumber === week.weekNumber - 1
        );
        if (prevWeek) {
          const increase = ((week.totalKm - prevWeek.totalKm) / prevWeek.totalKm) * 100;
          if (increase > 15 && !recommendation.isRecoveryWeek) {
            issues.push(
              `Woche ${week.weekNumber}: Zu hohe Steigerung (${Math.round(increase)}%)`
            );
          }
        }
      }
    }

    // Overall suggestions
    if (violationsCount > this.plan.weeks.length * 0.3) {
      suggestions.push(
        'Überarbeite die Volumen-Verteilung für einen konsistenteren Aufbau'
      );
    }

    const peakVolume = Math.max(...this.plan.weeks.map((w) => w.totalKm));
    const estimatedPeak = this.estimatePeakVolume();

    if (peakVolume < estimatedPeak * 0.8) {
      suggestions.push(
        `Erwäge höheres Peak-Volumen (~${Math.round(estimatedPeak)}km) für optimale Wettkampfvorbereitung`
      );
    }

    // Determine overall rating
    let overallRating: 'excellent' | 'good' | 'needs_adjustment' | 'risky';
    if (violationsCount === 0 && issues.length === 0) {
      overallRating = 'excellent';
    } else if (violationsCount <= 2 && issues.length <= 2) {
      overallRating = 'good';
    } else if (violationsCount <= 4 || issues.length <= 4) {
      overallRating = 'needs_adjustment';
    } else {
      overallRating = 'risky';
    }

    return {
      overallRating,
      issues,
      suggestions,
      weeklyBreakdown,
    };
  }
}

/**
 * Quick helper for volume recommendation
 */
export function getVolumeRecommendation(
  plan: TrainingPlan,
  weekNumber: number
): VolumeRecommendation {
  const analyzer = new VolumeProgressionAnalyzer(plan, weekNumber);
  return analyzer.getWeeklyVolumeRecommendation(weekNumber);
}
