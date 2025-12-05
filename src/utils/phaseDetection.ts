import { TrainingPlan } from '../types';
import { TrainingPhase } from '../types/suggestions';
import { getRaceDistanceKm } from './calculationUtils';

interface PhaseInfo {
  phase: TrainingPhase;
  progress: number; // 0-1 within this phase
  weekInPhase: number;
  totalWeeksInPhase: number;
  description: string;
  focusAreas: string[];
}

/**
 * Intelligent phase detection based on training periodization
 * Adapts to plan length and race distance
 */
export class PhaseDetector {
  private totalWeeks: number;
  private raceDistance: number;
  private daysUntilRace: number;

  constructor(plan: TrainingPlan, currentWeekNumber: number) {
    this.totalWeeks = plan.weeks.length;
    this.raceDistance = getRaceDistanceKm(
      plan.event.distance,
      plan.event.customDistance
    );

    // Calculate days until race from current week
    const currentWeek = plan.weeks.find((w) => w.weekNumber === currentWeekNumber);
    if (currentWeek) {
      const currentDate = new Date(currentWeek.startDate);
      const raceDate = new Date(plan.event.date);
      this.daysUntilRace = Math.ceil(
        (raceDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    } else {
      this.daysUntilRace = this.totalWeeks * 7;
    }
  }

  /**
   * Detect current phase based on multiple factors
   */
  detectPhase(weekNumber: number): PhaseInfo {
    const weekProgress = weekNumber / this.totalWeeks;

    // Taper phase: last 2-3 weeks
    if (this.daysUntilRace <= 21) {
      return this.getTaperPhaseInfo(weekNumber);
    }

    // Recovery week detection (every 3-4 weeks)
    if (this.isRecoveryWeek(weekNumber)) {
      return this.getRecoveryWeekInfo(weekNumber);
    }

    // Race-distance specific phase detection
    if (this.raceDistance >= 42) {
      return this.getMarathonPhase(weekNumber, weekProgress);
    } else if (this.raceDistance >= 21) {
      return this.getHalfMarathonPhase(weekNumber, weekProgress);
    } else {
      return this.getShortDistancePhase(weekNumber, weekProgress);
    }
  }

  /**
   * Marathon-specific phase progression (42.2k)
   */
  private getMarathonPhase(weekNumber: number, progress: number): PhaseInfo {
    if (progress <= 0.3) {
      return {
        phase: 'base',
        progress: progress / 0.3,
        weekInPhase: weekNumber,
        totalWeeksInPhase: Math.ceil(this.totalWeeks * 0.3),
        description: 'Grundlagenausdauer aufbauen',
        focusAreas: [
          'Aerobe Basis aufbauen',
          'Easy runs mit steigendem Volumen',
          'Lauftechnik und Ökonomie',
          'Long runs progressiv steigern',
        ],
      };
    } else if (progress <= 0.7) {
      return {
        phase: 'build',
        progress: (progress - 0.3) / 0.4,
        weekInPhase: weekNumber - Math.ceil(this.totalWeeks * 0.3),
        totalWeeksInPhase: Math.ceil(this.totalWeeks * 0.4),
        description: 'Spezifisches Training & Intensität',
        focusAreas: [
          'Marathon-Pace Läufe',
          'Tempo runs aufbauen',
          'Long runs mit race-pace Abschnitten',
          'Kraft und Stabilität',
        ],
      };
    } else {
      return {
        phase: 'peak',
        progress: (progress - 0.7) / 0.3,
        weekInPhase: weekNumber - Math.ceil(this.totalWeeks * 0.7),
        totalWeeksInPhase: Math.ceil(this.totalWeeks * 0.3),
        description: 'Peak-Training & Vorbereitung',
        focusAreas: [
          'Maximales Long run Volumen',
          'Race-specific workouts',
          'Mentale Vorbereitung',
          'Wettkampfsimulation',
        ],
      };
    }
  }

  /**
   * Half Marathon phase progression (21.1k)
   */
  private getHalfMarathonPhase(weekNumber: number, progress: number): PhaseInfo {
    if (progress <= 0.35) {
      return {
        phase: 'base',
        progress: progress / 0.35,
        weekInPhase: weekNumber,
        totalWeeksInPhase: Math.ceil(this.totalWeeks * 0.35),
        description: 'Aerobe Basis aufbauen',
        focusAreas: [
          'Easy runs steigern',
          'Lauf-ABC und Steigerungen',
          'Grundlagenausdauer',
        ],
      };
    } else if (progress <= 0.75) {
      return {
        phase: 'build',
        progress: (progress - 0.35) / 0.4,
        weekInPhase: weekNumber - Math.ceil(this.totalWeeks * 0.35),
        totalWeeksInPhase: Math.ceil(this.totalWeeks * 0.4),
        description: 'Tempo & Schwellentraining',
        focusAreas: [
          'Tempo runs @ Halbmarathon-Pace',
          'Intervalle für VO2max',
          'Long runs progressiv',
        ],
      };
    } else {
      return {
        phase: 'peak',
        progress: (progress - 0.75) / 0.25,
        weekInPhase: weekNumber - Math.ceil(this.totalWeeks * 0.75),
        totalWeeksInPhase: Math.ceil(this.totalWeeks * 0.25),
        description: 'Wettkampfvorbereitung',
        focusAreas: [
          'Race-pace Tempoläufe',
          'Tune-up races (optional)',
          'Peak long runs',
        ],
      };
    }
  }

  /**
   * Short distance phase progression (5k-10k)
   */
  private getShortDistancePhase(weekNumber: number, progress: number): PhaseInfo {
    if (progress <= 0.4) {
      return {
        phase: 'base',
        progress: progress / 0.4,
        weekInPhase: weekNumber,
        totalWeeksInPhase: Math.ceil(this.totalWeeks * 0.4),
        description: 'Aerobe Basis & Technik',
        focusAreas: [
          'Easy runs',
          'Steigerungen & Lauf-ABC',
          'Basis-Kilometer aufbauen',
        ],
      };
    } else if (progress <= 0.8) {
      return {
        phase: 'build',
        progress: (progress - 0.4) / 0.4,
        weekInPhase: weekNumber - Math.ceil(this.totalWeeks * 0.4),
        totalWeeksInPhase: Math.ceil(this.totalWeeks * 0.4),
        description: 'Speed & VO2max Training',
        focusAreas: [
          'Intervalltraining steigern',
          'Tempo runs @ 10k pace',
          'Hill repeats für Kraft',
          'Fartlek für Tempowechsel',
        ],
      };
    } else {
      return {
        phase: 'peak',
        progress: (progress - 0.8) / 0.2,
        weekInPhase: weekNumber - Math.ceil(this.totalWeeks * 0.8),
        totalWeeksInPhase: Math.ceil(this.totalWeeks * 0.2),
        description: 'Wettkampfschärfe',
        focusAreas: [
          'Race-specific intervals',
          'Tune-up races',
          'Sharpening workouts',
        ],
      };
    }
  }

  /**
   * Taper phase info
   */
  private getTaperPhaseInfo(_weekNumber: number): PhaseInfo {
    return {
      phase: 'taper',
      progress: (21 - this.daysUntilRace) / 21,
      weekInPhase: Math.ceil((21 - this.daysUntilRace) / 7),
      totalWeeksInPhase: 3,
      description: 'Regeneration & Wettkampfvorbereitung',
      focusAreas: [
        'Volumen reduzieren (50-70%)',
        'Intensität beibehalten (kurze, schnelle Einheiten)',
        'Schlaf und Ernährung optimieren',
        'Mentale Vorbereitung',
        'Race-day logistics',
      ],
    };
  }

  /**
   * Recovery week detection
   */
  private isRecoveryWeek(weekNumber: number): boolean {
    // Recovery week every 3-4 weeks, but not in taper
    if (this.daysUntilRace <= 21) return false;

    const recoveryFrequency = this.raceDistance >= 42 ? 4 : 3;
    return weekNumber % recoveryFrequency === 0 && weekNumber > 0;
  }

  /**
   * Recovery week info
   */
  private getRecoveryWeekInfo(_weekNumber: number): PhaseInfo {
    return {
      phase: 'recovery',
      progress: 1.0,
      weekInPhase: 1,
      totalWeeksInPhase: 1,
      description: 'Regenerationswoche',
      focusAreas: [
        'Volumen um 20-30% reduzieren',
        'Nur lockere und regenerative Läufe',
        'Keine harten Einheiten',
        'Schlaf und Ernährung priorisieren',
      ],
    };
  }

  /**
   * Get recommended weekly volume based on phase
   */
  getPhaseVolumeMultiplier(phase: TrainingPhase): number {
    const multipliers: Record<TrainingPhase, number> = {
      base: 0.7, // 70% of peak volume
      build: 0.85, // 85% of peak volume
      peak: 1.0, // 100% peak volume
      taper: 0.6, // 60% of peak volume
      recovery: 0.75, // 75% of previous week
    };

    return multipliers[phase];
  }

  /**
   * Get recommended session types for phase
   */
  getPhaseSessionTypes(phase: TrainingPhase): {
    recommended: string[];
    avoid: string[];
  } {
    const phaseTypes: Record<
      TrainingPhase,
      { recommended: string[]; avoid: string[] }
    > = {
      base: {
        recommended: [
          'Easy runs (Mehrzahl)',
          'Long run (progressiv steigern)',
          'Strides (Technik)',
          'Strength training',
        ],
        avoid: ['Intervals', 'Tempo runs', 'Races'],
      },
      build: {
        recommended: [
          'Easy runs',
          'Tempo runs (1x/Woche)',
          'Intervals oder Hill repeats (1x/Woche)',
          'Long run',
          'Recovery runs',
        ],
        avoid: ['Zu viele harte Einheiten', '3+ Quality sessions/Woche'],
      },
      peak: {
        recommended: [
          'Race-specific workouts',
          'Long runs mit race-pace',
          'Tempo runs',
          'Tune-up races (optional)',
        ],
        avoid: ['Neue Workouts', 'Experimente'],
      },
      taper: {
        recommended: [
          'Easy runs (reduziert)',
          'Kurze, schnelle Einheiten (Sharpeners)',
          'Strides',
          'Recovery',
        ],
        avoid: ['Long runs', 'Hohes Volumen', 'Neue Intensitäten'],
      },
      recovery: {
        recommended: ['Easy runs', 'Recovery runs', 'Optional: Strength light'],
        avoid: ['Intervals', 'Tempo', 'Long run', 'Alle harten Einheiten'],
      },
    };

    return phaseTypes[phase];
  }
}

/**
 * Quick helper to detect phase
 */
export function detectTrainingPhase(
  plan: TrainingPlan,
  weekNumber: number
): PhaseInfo {
  const detector = new PhaseDetector(plan, weekNumber);
  return detector.detectPhase(weekNumber);
}
