/**
 * Training Expert System Rule Engine
 *
 * Central engine that evaluates all training rules and generates suggestions.
 * Combines knowledge from:
 * - Jack Daniels (VDOT, intensity zones)
 * - Pete Pfitzinger (periodization, volume)
 * - Hansons (cumulative fatigue)
 * - Herbert Steffny (German training principles)
 * - Dr. Matthias Marquardt (injury prevention)
 */

import { TrainingPlan, TrainingWeek, SessionType } from '../types';
import { TrainingSuggestion } from '../types/suggestions';
import { TrainingZones, UserProfile } from '../types/userProfile';
import { detectTrainingPhase } from '../utils/phaseDetection';
import { VolumeProgressionAnalyzer } from '../utils/volumeProgression';
import { getRaceDistanceKm } from '../utils/calculationUtils';
import { calculateTrainingZones, getBestVDOT } from '../utils/vdotCalculator';
import { SESSION_CHARACTERISTICS } from '../config/sessionCharacteristics';
import {
  RuleContext,
  RuleResult,
  SessionSuggestion,
  DailyAnalysis,
  WeeklyAnalysis,
  RuleViolation,
} from './types';
import { TrainingPhase } from '../types/suggestions';
import { getRulesByPriority } from './rules';
import {
  calculateTrainingPacesFromVDOT,
  suggestIntervalWorkout,
  formatPace,
} from './vdotPaceCalculator';

// ============ Rule Engine ============

export class TrainingRuleEngine {
  private plan: TrainingPlan;
  private userProfile?: UserProfile;
  private zones?: TrainingZones;
  private volumeAnalyzer: VolumeProgressionAnalyzer;

  constructor(plan: TrainingPlan, userProfile?: UserProfile) {
    this.plan = plan;
    this.userProfile = userProfile;

    // Calculate zones from user profile or defaults
    if (userProfile?.personalBests && userProfile.personalBests.length > 0) {
      const vdot = getBestVDOT(userProfile.personalBests);
      this.zones = calculateTrainingZones(vdot);
    }

    this.volumeAnalyzer = new VolumeProgressionAnalyzer(plan, 1);
  }

  /**
   * Build rule context for a specific day
   */
  private buildContext(
    currentWeek: TrainingWeek,
    dayOfWeek: number
  ): RuleContext {
    const weekNumber = currentWeek.weekNumber;
    const raceDistance = getRaceDistanceKm(
      this.plan.event.distance,
      this.plan.event.customDistance
    );

    // Phase detection
    const phaseInfo = detectTrainingPhase(this.plan, weekNumber);

    // Days until race
    const raceDate = new Date(this.plan.event.date);
    const weekStartDate = new Date(currentWeek.startDate);
    const daysUntilRace = Math.ceil(
      (raceDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Session analysis
    const existingSessions = currentWeek.sessions;
    const previousDaySession = existingSessions.find(
      (s) => s.dayOfWeek === dayOfWeek - 1
    );

    // Find last hard session
    const hardSessions = existingSessions.filter((s) => {
      const char = SESSION_CHARACTERISTICS[s.type];
      return char.intensityLevel === 'hard' || char.intensityLevel === 'very_hard';
    });
    const lastHardSessionDay =
      hardSessions.length > 0
        ? Math.max(...hardSessions.map((s) => s.dayOfWeek))
        : null;
    const daysSinceLastHardSession =
      lastHardSessionDay !== null ? dayOfWeek - lastHardSessionDay : 7;

    // Historical data
    const previousWeek = this.plan.weeks.find(
      (w) => w.weekNumber === weekNumber - 1
    );
    const previousWeekKm = previousWeek?.totalKm || 0;

    const completedWeeks = this.plan.weeks.filter(
      (w) => w.weekNumber < weekNumber && w.totalKm > 0
    );
    const averageWeeklyKm =
      completedWeeks.length > 0
        ? completedWeeks.reduce((sum, w) => w.totalKm + sum, 0) / completedWeeks.length
        : 40; // Default
    const peakWeeklyKm = Math.max(...this.plan.weeks.map((w) => w.totalKm), 0);

    // Consecutive hard weeks
    let consecutiveHardWeeks = 0;
    for (let i = weekNumber - 1; i > 0; i--) {
      const week = this.plan.weeks.find((w) => w.weekNumber === i);
      if (week && week.totalKm > previousWeekKm * 0.85) {
        consecutiveHardWeeks++;
      } else {
        break;
      }
    }

    // Volume recommendation
    const volumeRec = this.volumeAnalyzer.getWeeklyVolumeRecommendation(weekNumber);

    // Cumulative fatigue (simplified)
    const cumulativeFatigueScore = this.calculateCumulativeFatigue(
      currentWeek,
      dayOfWeek
    );

    // Weekly load
    const weeklyLoadScore = this.calculateWeeklyLoad(currentWeek);

    return {
      currentWeekNumber: weekNumber,
      totalWeeks: this.plan.weeks.length,
      currentPhase: phaseInfo.phase,
      phaseProgress: phaseInfo.progress,
      daysUntilRace,

      dayOfWeek,
      existingSessions,
      previousDaySession,
      lastHardSessionDay,
      daysSinceLastHardSession,

      weeklyKm: currentWeek.totalKm,
      targetWeeklyKm: volumeRec.targetWeeklyKm,
      hardSessionsThisWeek: hardSessions.length,
      hasLongRunThisWeek: existingSessions.some((s) => s.type === 'long'),
      weeklyIntensityScore: weeklyLoadScore,

      previousWeekKm,
      averageWeeklyKm,
      peakWeeklyKm,
      consecutiveHardWeeks,

      raceDistance,
      vdot: this.zones?.vdot,
      zones: this.zones,
      weeklyKmBase: this.userProfile?.weeklyKmBase,
      runningExperience: this.userProfile?.yearsRunning,

      cumulativeFatigueScore,
      weeklyLoadScore,
    };
  }

  /**
   * Calculate cumulative fatigue score (0-100)
   * Based on Hansons principle
   */
  private calculateCumulativeFatigue(
    week: TrainingWeek,
    currentDay: number
  ): number {
    let fatigue = 0;

    // Add fatigue from sessions earlier in the week
    for (const session of week.sessions) {
      if (session.dayOfWeek < currentDay) {
        const char = SESSION_CHARACTERISTICS[session.type];
        const daysSince = currentDay - session.dayOfWeek;

        // Fatigue decays over time
        const decayFactor = Math.exp(-0.3 * daysSince);
        fatigue += char.intensityScore * 5 * decayFactor;
      }
    }

    // Cap at 100
    return Math.min(100, fatigue);
  }

  /**
   * Calculate weekly training load
   */
  private calculateWeeklyLoad(week: TrainingWeek): number {
    let load = 0;

    for (const session of week.sessions) {
      const char = SESSION_CHARACTERISTICS[session.type];
      const distance = session.distance || 0;

      // Load = intensity * volume
      load += char.intensityScore * distance;
    }

    return load;
  }

  /**
   * Evaluate all rules for a specific day
   */
  evaluateRulesForDay(
    currentWeek: TrainingWeek,
    dayOfWeek: number
  ): RuleResult[] {
    const context = this.buildContext(currentWeek, dayOfWeek);
    const results: RuleResult[] = [];

    // Evaluate rules in priority order
    const criticalRules = getRulesByPriority('critical');
    const highRules = getRulesByPriority('high');
    const mediumRules = getRulesByPriority('medium');
    const lowRules = getRulesByPriority('low');

    const orderedRules = [...criticalRules, ...highRules, ...mediumRules, ...lowRules];

    for (const rule of orderedRules) {
      if (rule.appliesTo(context)) {
        const result = rule.evaluate(context);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Get suggestions for a specific day
   */
  getSuggestionsForDay(
    currentWeek: TrainingWeek,
    dayOfWeek: number
  ): DailyAnalysis {
    const context = this.buildContext(currentWeek, dayOfWeek);
    const ruleResults = this.evaluateRulesForDay(currentWeek, dayOfWeek);

    // Collect suggestions from rules
    const suggestions: SessionSuggestion[] = [];
    const violations: RuleViolation[] = [];
    const appliedRules: string[] = [];
    const reasoning: string[] = [];

    for (const result of ruleResults) {
      appliedRules.push(result.ruleName);

      if (result.suggestion) {
        suggestions.push(result.suggestion);
      }

      if (result.violation) {
        violations.push(result.violation);
      }

      if (!result.passed) {
        reasoning.push(result.message);
      }
    }

    // Add VDOT-based suggestions if zones available
    if (this.zones && context.currentPhase !== 'recovery') {
      this.addVDOTBasedSuggestions(suggestions, context);
    }

    // Sort suggestions by confidence and priority
    suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.confidence - a.confidence;
    });

    // Determine overall recommendation
    const recommendation = this.determineRecommendation(context, violations);

    // Calculate date
    const weekStart = new Date(currentWeek.startDate);
    const sessionDate = new Date(weekStart);
    sessionDate.setDate(weekStart.getDate() + dayOfWeek);

    return {
      dayOfWeek,
      date: sessionDate.toISOString().split('T')[0],
      suggestions: suggestions.slice(0, 5), // Top 5 suggestions
      violations,
      recommendation,
      reasoning,
      appliedRules,
    };
  }

  /**
   * Add VDOT-based interval suggestions
   */
  private addVDOTBasedSuggestions(
    suggestions: SessionSuggestion[],
    context: RuleContext
  ): void {
    if (!this.zones?.vdot) return;

    const paces = calculateTrainingPacesFromVDOT(this.zones.vdot);

    // Add interval suggestion if appropriate
    if (
      context.daysSinceLastHardSession >= 2 &&
      context.hardSessionsThisWeek < 2 &&
      (context.currentPhase === 'build' || context.currentPhase === 'peak') &&
      [1, 2, 3].includes(context.dayOfWeek)
    ) {
      const intervals = suggestIntervalWorkout(
        this.zones.vdot,
        context.raceDistance,
        context.currentPhase as 'base' | 'build' | 'peak'
      );

      if (intervals.length > 0) {
        const interval = intervals[0];
        suggestions.push({
          type: 'intervals',
          warmUp: 2,
          warmUpUnit: 'km',
          coolDown: 2,
          coolDownUnit: 'km',
          intervals: intervals,
          confidence: 0.8,
          reasoning: `VDOT-basiertes Intervalltraining: ${interval.repetitions}x${interval.distance * 1000}m @ ${formatPace(interval.pace)}/km`,
          priority: 'medium',
          intensityLevel: 'very_hard',
          notes: `Trabpause: ${interval.recovery} ${interval.recoveryUnit === 'min' ? 'Min' : 'km'}`,
        });
      }
    }

    // Add tempo suggestion
    if (
      context.daysSinceLastHardSession >= 1 &&
      context.hardSessionsThisWeek < 2 &&
      context.currentPhase === 'build'
    ) {
      suggestions.push({
        type: 'tempo',
        distance: context.raceDistance >= 42 ? 12 : context.raceDistance >= 21 ? 10 : 8,
        warmUp: 2,
        warmUpUnit: 'km',
        coolDown: 2,
        coolDownUnit: 'km',
        targetPace: paces.thresholdPace,
        confidence: 0.75,
        reasoning: `Tempodauerlauf @ ${formatPace(paces.thresholdPace)}/km (Schwellentempo)`,
        priority: 'medium',
        intensityLevel: 'hard',
      });
    }

    // Add easy run suggestion with pace
    if (context.daysSinceLastHardSession === 1 || context.dayOfWeek === 0) {
      suggestions.push({
        type: 'recovery',
        distance: Math.min(8, context.raceDistance * 0.15),
        targetPace: (paces.recoveryPace.min + paces.recoveryPace.max) / 2,
        confidence: 0.85,
        reasoning: `Regenerationslauf @ ${formatPace(paces.recoveryPace.min)}-${formatPace(paces.recoveryPace.max)}/km`,
        priority: 'high',
        intensityLevel: 'easy',
      });
    }
  }

  /**
   * Determine overall recommendation for the day
   */
  private determineRecommendation(
    context: RuleContext,
    violations: RuleViolation[]
  ): 'rest' | 'easy' | 'moderate' | 'hard' {
    // Check for critical violations
    const hasError = violations.some((v) => v.severity === 'error');
    if (hasError) {
      return 'rest';
    }

    // Check phase
    if (context.currentPhase === 'recovery' || context.currentPhase === 'taper') {
      return 'easy';
    }

    // Check fatigue
    if (context.cumulativeFatigueScore > 80) {
      return 'rest';
    }
    if (context.cumulativeFatigueScore > 60) {
      return 'easy';
    }

    // Check days since hard session
    if (context.daysSinceLastHardSession < 2) {
      return 'easy';
    }

    // Check hard sessions this week
    if (context.hardSessionsThisWeek >= 2) {
      return 'easy';
    }

    // In build/peak phases, allow hard days
    if (context.currentPhase === 'build' || context.currentPhase === 'peak') {
      if ([1, 2, 3].includes(context.dayOfWeek)) {
        return 'hard';
      }
    }

    return 'moderate';
  }

  /**
   * Analyze entire week
   */
  analyzeWeek(currentWeek: TrainingWeek): WeeklyAnalysis {
    const phaseInfo = detectTrainingPhase(this.plan, currentWeek.weekNumber);
    const volumeRec = this.volumeAnalyzer.getWeeklyVolumeRecommendation(
      currentWeek.weekNumber
    );

    // Analyze each day
    const days = new Map<number, DailyAnalysis>();
    for (let day = 0; day <= 6; day++) {
      const hasSession = currentWeek.sessions.some((s) => s.dayOfWeek === day);
      if (!hasSession) {
        days.set(day, this.getSuggestionsForDay(currentWeek, day));
      }
    }

    // Calculate intensity distribution
    const distribution = this.calculateIntensityDistribution(currentWeek);

    // Determine volume status
    let volumeStatus: 'under' | 'on_track' | 'over';
    const volumeRatio = currentWeek.totalKm / volumeRec.targetWeeklyKm;
    if (volumeRatio < 0.85) {
      volumeStatus = 'under';
    } else if (volumeRatio > 1.15) {
      volumeStatus = 'over';
    } else {
      volumeStatus = 'on_track';
    }

    // Determine overall health
    let overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
    const allViolations = Array.from(days.values()).flatMap((d) => d.violations);
    const errorCount = allViolations.filter((v) => v.severity === 'error').length;
    const warningCount = allViolations.filter((v) => v.severity === 'warning').length;

    if (errorCount > 0) {
      overallHealth = 'critical';
    } else if (warningCount > 2) {
      overallHealth = 'warning';
    } else if (warningCount > 0) {
      overallHealth = 'good';
    } else {
      overallHealth = 'excellent';
    }

    // Key recommendations
    const keyRecommendations = this.generateKeyRecommendations(
      phaseInfo.phase,
      distribution,
      volumeStatus,
      allViolations
    );

    return {
      weekNumber: currentWeek.weekNumber,
      phase: phaseInfo.phase,
      days,
      targetVolume: volumeRec.targetWeeklyKm,
      currentVolume: currentWeek.totalKm,
      volumeStatus,
      intensityDistribution: distribution,
      overallHealth,
      keyRecommendations,
    };
  }

  /**
   * Calculate intensity distribution for the week
   */
  private calculateIntensityDistribution(week: TrainingWeek): {
    easy: number;
    moderate: number;
    hard: number;
  } {
    let easyKm = 0;
    let moderateKm = 0;
    let hardKm = 0;

    for (const session of week.sessions) {
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

  /**
   * Generate key recommendations for the week
   */
  private generateKeyRecommendations(
    phase: TrainingPhase,
    distribution: { easy: number; moderate: number; hard: number },
    volumeStatus: string,
    violations: RuleViolation[]
  ): string[] {
    const recommendations: string[] = [];

    // Phase-specific
    const phaseRecs: Record<TrainingPhase, string> = {
      base: 'Fokus auf aerobe Basisentwicklung und schrittweise Volumenerhöhung.',
      build: 'Integriere Tempo- und Intervalltraining bei stabiler Volumenbasis.',
      peak: 'Wettkampfspezifische Einheiten bei maximalem Volumen.',
      taper: 'Reduziere Volumen, behalte Intensität. Erholung vor dem Wettkampf!',
      recovery: 'Regeneration priorisieren. Nur lockere Läufe.',
    };
    recommendations.push(phaseRecs[phase]);

    // Intensity distribution
    if (distribution.hard > 0.25) {
      recommendations.push(
        'Reduziere den Anteil harter Einheiten. Ziel: 80% locker, 20% intensiv.'
      );
    }
    if (distribution.easy < 0.7 && phase !== 'taper') {
      recommendations.push('Erhöhe den Anteil lockerer Läufe für bessere Regeneration.');
    }

    // Volume
    if (volumeStatus === 'under') {
      recommendations.push('Wochenvolumen unter Ziel. Erwäge zusätzliche Easy Runs.');
    } else if (volumeStatus === 'over') {
      recommendations.push('Wochenvolumen über Ziel. Achte auf ausreichend Erholung.');
    }

    // From violations
    for (const violation of violations.slice(0, 2)) {
      recommendations.push(violation.recommendation);
    }

    return recommendations.slice(0, 5);
  }

  /**
   * Convert SessionSuggestion to TrainingSuggestion (for compatibility)
   */
  convertToTrainingSuggestion(
    suggestion: SessionSuggestion,
    dayOfWeek: number
  ): TrainingSuggestion {
    return {
      type: suggestion.type,
      distance: suggestion.distance,
      duration: suggestion.duration,
      warmUp: suggestion.warmUp,
      warmUpUnit: suggestion.warmUpUnit,
      coolDown: suggestion.coolDown,
      coolDownUnit: suggestion.coolDownUnit,
      confidence: suggestion.confidence,
      reason: suggestion.reasoning,
      priority: suggestion.priority,
      dayOfWeek,
      suggestedTitle: this.getSessionTitle(suggestion.type),
      notes: suggestion.notes,
      intensityLevel: suggestion.intensityLevel,
    };
  }

  private getSessionTitle(type: SessionType): string {
    const titles: Record<SessionType, string> = {
      easy: 'Lockerer Dauerlauf',
      recovery: 'Regenerationslauf',
      long: 'Langer Lauf',
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
    return titles[type];
  }
}

// ============ Exports ============

export { ALL_RULES } from './rules';
export * from './types';
export * from './vdotPaceCalculator';
