import { TrainingPlan, TrainingWeek, SessionType } from '../types';
import { TrainingSuggestion, TrainingContext } from '../types/suggestions';
import { detectTrainingPhase } from './phaseDetection';
import { VolumeProgressionAnalyzer } from './volumeProgression';
import { IntensityAnalyzer, getIntensityRecommendation } from './intensityAnalyzer';
import { SESSION_CHARACTERISTICS } from '../config/sessionCharacteristics';
import { getRaceDistanceKm } from './calculationUtils';
import { calculatePace } from './paceCalculator';
import { TrainingZones } from '../types/userProfile';
import { calculateSessionRPE } from './sessionRPECalculator';

/**
 * Main Training Suggestion Engine
 * Combines phase detection, volume progression, and intensity analysis
 * to generate intelligent training suggestions
 */
export class TrainingSuggestionEngine {
  private context: TrainingContext;
  private volumeAnalyzer: VolumeProgressionAnalyzer;
  private zones?: TrainingZones; // Optional: for dynamic RPE-based suggestions

  constructor(plan: TrainingPlan, currentWeek: TrainingWeek, zones?: TrainingZones) {
    this.zones = zones;
    this.context = this.buildContext(plan, currentWeek);
    this.volumeAnalyzer = new VolumeProgressionAnalyzer(plan, currentWeek.weekNumber);
  }

  /**
   * Build comprehensive training context
   */
  private buildContext(plan: TrainingPlan, currentWeek: TrainingWeek): TrainingContext {
    const weekNumber = currentWeek.weekNumber;
    const totalWeeks = plan.weeks.length;
    const raceDistance = getRaceDistanceKm(plan.event.distance, plan.event.customDistance);

    // Calculate days until race
    const raceDate = new Date(plan.event.date);
    const weekStartDate = new Date(currentWeek.startDate);
    const daysUntilRace = Math.max(0, Math.ceil(
      (raceDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24)
    ));

    // Target pace (convert string to number)
    let targetPace: number | undefined;
    if (plan.event.targetTime) {
      const paceString = calculatePace(plan.event.targetTime, raceDistance);
      // Parse pace string "5:30" to number 5.5
      if (paceString) {
        const [minutes, seconds] = paceString.split(':').map(Number);
        targetPace = minutes + (seconds || 0) / 60;
      }
    }

    // Historical data
    const previousWeek = plan.weeks.find((w) => w.weekNumber === weekNumber - 1);
    const previousWeekKm = previousWeek?.totalKm || 0;

    const completedWeeks = plan.weeks.filter((w) => w.weekNumber < weekNumber && w.totalKm > 0);
    const averageWeeklyKm =
      completedWeeks.length > 0
        ? completedWeeks.reduce((sum, w) => w.totalKm + sum, 0) / completedWeeks.length
        : 0;
    const peakWeeklyKm = Math.max(...plan.weeks.map((w) => w.totalKm), 0);

    // Phase detection
    const phaseInfo = detectTrainingPhase(plan, weekNumber);

    // Week analysis
    const weekSessions = currentWeek.sessions;
    const weeklyKm = currentWeek.totalKm;

    // Use dynamic RPE if zones available
    const weekIntensityAnalyzer = new IntensityAnalyzer(weekSessions, this.zones);
    const weeklyIntensityScore = weekIntensityAnalyzer.calculateWeeklyIntensityScore(weekSessions);

    const hardSessionsThisWeek = weekSessions.filter((s) => {
      if (this.zones) {
        // Use dynamic RPE
        const rpe = calculateSessionRPE(s, this.zones);
        return rpe >= 6; // RPE 6+ is hard
      } else {
        // Fallback to static
        const char = SESSION_CHARACTERISTICS[s.type];
        return char.intensityLevel === 'hard' || char.intensityLevel === 'very_hard';
      }
    }).length;

    // Recent patterns
    const recentSessionTypes = weekSessions
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
      .map((s) => s.type);

    const hardSessions = weekSessions.filter((s) => {
      if (this.zones) {
        const rpe = calculateSessionRPE(s, this.zones);
        return rpe >= 6;
      } else {
        const char = SESSION_CHARACTERISTICS[s.type];
        return char.intensityLevel === 'hard' || char.intensityLevel === 'very_hard';
      }
    });
    const lastHardSessionDay =
      hardSessions.length > 0
        ? Math.max(...hardSessions.map((s) => s.dayOfWeek))
        : null;

    const hasLongRunThisWeek = weekSessions.some((s) => s.type === 'long');

    return {
      plan,
      currentWeek,
      weekNumber,
      totalWeeks,
      raceDistance,
      daysUntilRace,
      targetPace,
      weekSessions,
      weeklyKm,
      weeklyIntensityScore,
      hardSessionsThisWeek,
      previousWeekKm,
      averageWeeklyKm,
      peakWeeklyKm,
      currentPhase: phaseInfo.phase,
      phaseProgress: phaseInfo.progress,
      recentSessionTypes,
      lastHardSessionDay,
      hasLongRunThisWeek,
    };
  }

  /**
   * Get suggestions for a specific day of week
   */
  getSuggestionsForDay(dayOfWeek: number): TrainingSuggestion[] {
    const suggestions: TrainingSuggestion[] = [];

    // Get sessions before this day
    const sessionsBeforeDay = this.context.weekSessions.filter((s) => s.dayOfWeek < dayOfWeek);
    const previousDaySession = this.context.weekSessions.find(
      (s) => s.dayOfWeek === dayOfWeek - 1
    );

    // Intensity recommendation
    const intensityRec = getIntensityRecommendation(sessionsBeforeDay);

    // Phase info
    const phaseInfo = detectTrainingPhase(this.context.plan, this.context.weekNumber);

    // Rule 1: Recovery after hard sessions
    if (previousDaySession && this.isHardSession(previousDaySession.type)) {
      suggestions.push(
        this.createRecoverySuggestion(
          dayOfWeek,
          `Erholung nach gestrigem ${this.getSessionTypeName(previousDaySession.type)}`,
          0.9
        )
      );
    }

    // Rule 2: Long run on weekend (if not done yet)
    if ([5, 6].includes(dayOfWeek) && !this.context.hasLongRunThisWeek) {
      suggestions.push(this.createLongRunSuggestion(dayOfWeek, phaseInfo.phase));
    }

    // Rule 3: Quality session midweek (if < 2 hard sessions)
    if (
      [2, 3].includes(dayOfWeek) &&
      this.context.hardSessionsThisWeek < 2 &&
      phaseInfo.phase !== 'recovery' &&
      phaseInfo.phase !== 'taper'
    ) {
      // Intervals suggestion
      if (phaseInfo.phase === 'build' || phaseInfo.phase === 'peak') {
        suggestions.push(this.createIntervalsSuggestion(dayOfWeek, phaseInfo.phase));
      }

      // Tempo suggestion
      if (phaseInfo.phase === 'build' || phaseInfo.phase === 'peak') {
        suggestions.push(this.createTempoSuggestion(dayOfWeek, phaseInfo.phase));
      }
    }

    // Rule 4: Easy run (always a good option)
    if (intensityRec.preferEasy || dayOfWeek === 0 || dayOfWeek === 4) {
      suggestions.push(this.createEasyRunSuggestion(dayOfWeek, intensityRec.reasoning));
    }

    // Rule 5: Strides (technique work)
    if ([1, 3, 5].includes(dayOfWeek) && phaseInfo.phase !== 'taper') {
      suggestions.push(this.createStridesSuggestion(dayOfWeek));
    }

    // Rule 6: Hill repeats in base phase
    if (
      [2, 3].includes(dayOfWeek) &&
      phaseInfo.phase === 'base' &&
      this.context.hardSessionsThisWeek < 1
    ) {
      suggestions.push(this.createHillRepeatsSuggestion(dayOfWeek));
    }

    // Sort by confidence and priority
    return suggestions.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.confidence - a.confidence;
    });
  }

  /**
   * Get suggestions for entire week
   */
  getSuggestionsForWeek(): Map<number, TrainingSuggestion[]> {
    const weekSuggestions = new Map<number, TrainingSuggestion[]>();

    for (let day = 0; day <= 6; day++) {
      // Skip days that already have sessions
      const hasSession = this.context.weekSessions.some((s) => s.dayOfWeek === day);
      if (!hasSession) {
        weekSuggestions.set(day, this.getSuggestionsForDay(day));
      }
    }

    return weekSuggestions;
  }

  // ========== Suggestion Creators ==========

  private createEasyRunSuggestion(
    dayOfWeek: number,
    reasoning: string
  ): TrainingSuggestion {
    const volumeRec = this.volumeAnalyzer.getWeeklyVolumeRecommendation(
      this.context.weekNumber
    );
    const remainingDays = 7 - dayOfWeek;
    const avgDistance = (volumeRec.targetWeeklyKm - this.context.weeklyKm) / remainingDays;

    return {
      type: 'easy',
      distance: Math.max(5, Math.round(avgDistance * 0.8 * 10) / 10),
      confidence: 0.85,
      reason: reasoning || 'Lockerer Dauerlauf für aerobe Basis',
      priority: 'high',
      dayOfWeek,
      intensityLevel: 'easy',
      suggestedTitle: 'Lockerer Dauerlauf',
    };
  }

  private createRecoverySuggestion(
    dayOfWeek: number,
    reasoning: string,
    confidence: number
  ): TrainingSuggestion {
    return {
      type: 'recovery',
      distance: Math.min(8, this.context.raceDistance * 0.2),
      confidence,
      reason: reasoning,
      priority: 'high',
      dayOfWeek,
      intensityLevel: 'easy',
      suggestedTitle: 'Regenerationslauf',
      notes: 'Ganz locker, Fokus auf Erholung',
    };
  }

  private createLongRunSuggestion(dayOfWeek: number, phase: string): TrainingSuggestion {
    let distance: number;

    // Calculate long run distance based on race distance and phase
    if (this.context.raceDistance >= 42) {
      // Marathon
      distance = phase === 'peak' ? 32 : phase === 'build' ? 28 : 20;
    } else if (this.context.raceDistance >= 21) {
      // Half Marathon
      distance = phase === 'peak' ? 20 : phase === 'build' ? 18 : 14;
    } else {
      // 10k or less
      distance = phase === 'peak' ? 14 : phase === 'build' ? 12 : 10;
    }

    // Adjust for taper
    if (phase === 'taper') {
      distance *= 0.6;
    }

    return {
      type: 'long',
      distance: Math.round(distance * 10) / 10,
      confidence: 0.9,
      reason: 'Wöchentlicher langer Lauf - wichtigste Trainingseinheit der Woche',
      priority: 'high',
      dayOfWeek,
      intensityLevel: 'moderate',
      suggestedTitle: 'Langer Lauf',
      notes: 'Ziel: Ausdauer und mentale Stärke aufbauen. Pace: gemütlich!',
    };
  }

  private createIntervalsSuggestion(dayOfWeek: number, _phase: string): TrainingSuggestion {
    const targetPaceMin = this.context.targetPace || 5.0;
    const intervalPace = targetPaceMin - 0.3; // 10-20s faster than race pace

    const paceStr = `${Math.floor(intervalPace)}:${Math.round((intervalPace % 1) * 60)
      .toString()
      .padStart(2, '0')}`;

    return {
      type: 'intervals',
      warmUp: 2,
      warmUpUnit: 'km',
      coolDown: 2,
      coolDownUnit: 'km',
      confidence: 0.75,
      reason: 'Intervalltraining für VO2max und Geschwindigkeit',
      priority: 'medium',
      dayOfWeek,
      intensityLevel: 'very_hard',
      suggestedTitle: 'Intervalltraining',
      notes: `Vorschlag: 6x1000m @ ${paceStr} /km mit 400m Trabpause`,
    };
  }

  private createTempoSuggestion(dayOfWeek: number, _phase: string): TrainingSuggestion {
    let tempoDistance: number;

    if (this.context.raceDistance >= 42) {
      tempoDistance = 12; // Marathon
    } else if (this.context.raceDistance >= 21) {
      tempoDistance = 10; // Half Marathon
    } else {
      tempoDistance = 6; // 10k or less
    }

    return {
      type: 'tempo',
      distance: tempoDistance,
      warmUp: 2,
      warmUpUnit: 'km',
      coolDown: 2,
      coolDownUnit: 'km',
      confidence: 0.8,
      reason: 'Tempodauerlauf für Laktattoleranz und Wettkampfhärte',
      priority: 'medium',
      dayOfWeek,
      intensityLevel: 'hard',
      suggestedTitle: 'Tempodauerlauf',
      notes: 'Komfortabel hart - könnte theoretisch 1 Stunde halten',
    };
  }

  private createStridesSuggestion(dayOfWeek: number): TrainingSuggestion {
    return {
      type: 'strides',
      confidence: 0.6,
      reason: 'Steigerungen für Lauftechnik und neuromuskuläre Aktivierung',
      priority: 'low',
      dayOfWeek,
      intensityLevel: 'moderate',
      suggestedTitle: 'Easy Run + Steigerungen',
      notes: '6x 15-20 Sekunden Steigerungen am Ende des Easy Runs',
    };
  }

  private createHillRepeatsSuggestion(dayOfWeek: number): TrainingSuggestion {
    return {
      type: 'hill_repeats',
      warmUp: 2,
      warmUpUnit: 'km',
      coolDown: 2,
      coolDownUnit: 'km',
      confidence: 0.7,
      reason: 'Bergwiederholungen für Kraft und Laufökonomie',
      priority: 'medium',
      dayOfWeek,
      intensityLevel: 'very_hard',
      suggestedTitle: 'Bergwiederholungen',
      notes: 'Vorschlag: 8x 90s Berganläufe mit Trabpause bergab',
    };
  }

  // ========== Helper Methods ==========

  private isHardSession(type: SessionType): boolean {
    const char = SESSION_CHARACTERISTICS[type];
    return char.intensityLevel === 'hard' || char.intensityLevel === 'very_hard';
  }

  private getSessionTypeName(type: SessionType): string {
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
