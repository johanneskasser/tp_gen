import { TrainingSession, SessionType } from '../types';
import { IntensityDistribution, IntensityLevel } from '../types/suggestions';
import { SESSION_CHARACTERISTICS, getSessionIntensityScore } from '../config/sessionCharacteristics';
import { calculateSessionDistance } from './calculationUtils';
import { TrainingZones } from '../types/userProfile';
import { calculateSessionRPE, getIntensityLevelFromRPE } from './sessionRPECalculator';

/**
 * Intensity Distribution Analyzer
 * Implements 80/20 principle: 80% easy, 20% hard
 * Provides recommendations for balancing training intensity
 */
export class IntensityAnalyzer {
  private sessions: TrainingSession[];
  private totalDistance: number;
  private zones?: TrainingZones; // Optional: for dynamic RPE calculation

  constructor(sessions: TrainingSession[], zones?: TrainingZones) {
    this.sessions = sessions;
    this.zones = zones;
    this.totalDistance = sessions.reduce(
      (sum, s) => sum + calculateSessionDistance(s),
      0
    );
  }

  /**
   * Analyze intensity distribution of sessions
   */
  analyzeDistribution(): IntensityDistribution {
    const distribution = this.calculateDistribution();
    const target = this.getTargetDistribution();

    const needsRebalancing =
      Math.abs(distribution.easy - target.easy) > 0.1 ||
      Math.abs(distribution.hard - target.hard) > 0.1;

    const recommendation = this.generateRecommendation(distribution, target);

    return {
      easy: target.easy,
      moderate: target.moderate,
      hard: target.hard,
      current: distribution,
      needsRebalancing,
      recommendation,
    };
  }

  /**
   * Calculate current intensity distribution by distance
   * Uses dynamic RPE if zones are available, otherwise falls back to session type
   */
  private calculateDistribution(): {
    easy: number;
    moderate: number;
    hard: number;
  } {
    if (this.totalDistance === 0) {
      return { easy: 0, moderate: 0, hard: 0 };
    }

    let easyKm = 0;
    let moderateKm = 0;
    let hardKm = 0;

    for (const session of this.sessions) {
      const distance = calculateSessionDistance(session);

      // Use dynamic RPE calculation if zones are available
      let level: IntensityLevel;
      if (this.zones) {
        const rpe = calculateSessionRPE(session, this.zones);
        level = getIntensityLevelFromRPE(rpe);
      } else {
        level = this.getSessionIntensityLevel(session.type);
      }

      switch (level) {
        case 'easy':
          easyKm += distance;
          break;
        case 'moderate':
          moderateKm += distance;
          break;
        case 'hard':
        case 'very_hard':
          hardKm += distance;
          break;
      }
    }

    return {
      easy: easyKm / this.totalDistance,
      moderate: moderateKm / this.totalDistance,
      hard: hardKm / this.totalDistance,
    };
  }

  /**
   * Get target distribution (80/20 principle)
   */
  private getTargetDistribution(): {
    easy: number;
    moderate: number;
    hard: number;
  } {
    return {
      easy: 0.8, // 80% easy
      moderate: 0.1, // 10% moderate
      hard: 0.1, // 10% hard
    };
  }

  /**
   * Get intensity level for a session type
   */
  private getSessionIntensityLevel(type: SessionType): IntensityLevel {
    return SESSION_CHARACTERISTICS[type].intensityLevel;
  }

  /**
   * Generate recommendation based on distribution
   */
  private generateRecommendation(
    current: { easy: number; moderate: number; hard: number },
    target: { easy: number; moderate: number; hard: number }
  ): string {
    const easyDiff = current.easy - target.easy;
    const hardDiff = current.hard - target.hard;

    if (Math.abs(easyDiff) < 0.05 && Math.abs(hardDiff) < 0.05) {
      return '✅ Perfekte Balance! Die Intensitätsverteilung entspricht der 80/20-Regel.';
    }

    const recommendations: string[] = [];

    // Too much hard training
    if (hardDiff > 0.1) {
      const hardPercent = Math.round(current.hard * 100);
      recommendations.push(
        `⚠️ Zu viel hartes Training (${hardPercent}%). Risiko für Übertraining!`
      );
      recommendations.push(
        'Empfehlung: Ersetze einige intensive Einheiten durch lockere Läufe.'
      );
      recommendations.push(
        'Die meisten Weltklasse-Athleten trainieren 80% im lockeren Bereich.'
      );
    }

    // Too little hard training
    if (hardDiff < -0.05) {
      const hardPercent = Math.round(current.hard * 100);
      recommendations.push(
        `💪 Zu wenig intensive Einheiten (${hardPercent}%).`
      );
      recommendations.push(
        'Empfehlung: Füge 1-2 Quality-Sessions pro Woche hinzu (Intervalle, Tempo).'
      );
      recommendations.push(
        'Intensität ist wichtig für Wettkampfvorbereitung - aber in Maßen!'
      );
    }

    // Too little easy training
    if (easyDiff < -0.1) {
      const easyPercent = Math.round(current.easy * 100);
      recommendations.push(
        `🏃 Zu wenig lockeres Training (${easyPercent}%).`
      );
      recommendations.push(
        'Empfehlung: Erhöhe den Anteil an Easy/Recovery Runs.'
      );
      recommendations.push(
        'Lockeres Training baut aerobe Basis und ermöglicht Erholung.'
      );
    }

    return recommendations.join('\n');
  }

  /**
   * Get recommended session type to balance intensity
   */
  getRecommendedSessionType(
    existingWeekSessions: TrainingSession[]
  ): {
    preferEasy: boolean;
    preferHard: boolean;
    reasoning: string;
  } {
    // Analyze current week so far (pass zones if available)
    const weekAnalyzer = new IntensityAnalyzer(existingWeekSessions, this.zones);
    const weekDist = weekAnalyzer.calculateDistribution();
    const target = this.getTargetDistribution();

    // Count hard sessions using dynamic RPE if zones available
    const hardSessions = existingWeekSessions.filter((s) => {
      if (this.zones) {
        const rpe = calculateSessionRPE(s, this.zones);
        const level = getIntensityLevelFromRPE(rpe);
        return level === 'hard' || level === 'very_hard';
      } else {
        const level = this.getSessionIntensityLevel(s.type);
        return level === 'hard' || level === 'very_hard';
      }
    }).length;

    // Never more than 2-3 hard sessions per week
    if (hardSessions >= 2) {
      return {
        preferEasy: true,
        preferHard: false,
        reasoning:
          'Bereits 2+ harte Einheiten diese Woche. Empfehle Easy/Recovery für optimale Erholung.',
      };
    }

    // Check if week is too hard so far
    if (weekDist.hard > target.hard * 1.5) {
      return {
        preferEasy: true,
        preferHard: false,
        reasoning: `Woche ist aktuell zu intensiv (${Math.round(weekDist.hard * 100)}% hard). Empfehle lockere Einheit.`,
      };
    }

    // Need more quality
    if (hardSessions === 0 && existingWeekSessions.length >= 2) {
      return {
        preferEasy: false,
        preferHard: true,
        reasoning:
          'Noch keine Quality-Session diese Woche. Zeit für Intervalle oder Tempo!',
      };
    }

    // Balanced
    return {
      preferEasy: true,
      preferHard: false,
      reasoning: 'Woche ist gut balanciert. Fokus auf aerobe Basis.',
    };
  }

  /**
   * Calculate intensity score for a week (0-100)
   * Uses dynamic RPE if zones are available, otherwise falls back to session type
   */
  calculateWeeklyIntensityScore(sessions: TrainingSession[]): number {
    if (sessions.length === 0) return 0;

    let totalScore = 0;
    for (const session of sessions) {
      // Use dynamic RPE if zones are available
      let sessionScore: number;
      if (this.zones) {
        const rpe = calculateSessionRPE(session, this.zones);
        sessionScore = rpe; // RPE is 1-10
      } else {
        sessionScore = getSessionIntensityScore(session); // Fallback to static score
      }

      const distance = calculateSessionDistance(session);
      totalScore += sessionScore * distance;
    }

    const totalDistance = sessions.reduce(
      (sum, s) => sum + calculateSessionDistance(s),
      0
    );

    if (totalDistance === 0) return 0;

    // Normalize to 0-100 scale (intensity score 1-10, so max is 10*distance)
    return (totalScore / totalDistance) * 10;
  }

  /**
   * Check if intensity is sustainable
   */
  isSustainableIntensity(): {
    sustainable: boolean;
    warnings: string[];
  } {
    const dist = this.calculateDistribution();
    const warnings: string[] = [];

    // Too much hard training
    if (dist.hard > 0.25) {
      warnings.push(
        '⚠️ Mehr als 25% hartes Training ist langfristig nicht nachhaltig'
      );
      warnings.push('Risiko für Übertraining, Verletzungen und Burnout');
    }

    // Too little easy training
    if (dist.easy < 0.6) {
      warnings.push(
        '⚠️ Weniger als 60% lockeres Training ist problematisch'
      );
      warnings.push('Aerobe Basis und Erholung werden vernachlässigt');
    }

    // Reasonable hard training range: 10-20%
    const hardPercent = dist.hard * 100;
    if (hardPercent < 5) {
      warnings.push(
        'ℹ️ Sehr konservatives Training - erwäge mehr Intensität für Wettkampfvorbereitung'
      );
    }

    return {
      sustainable: warnings.filter((w) => w.startsWith('⚠️')).length === 0,
      warnings,
    };
  }
}

/**
 * Quick helper to analyze week intensity
 * Pass zones for dynamic RPE-based analysis, or omit for session-type-based analysis
 */
export function analyzeWeekIntensity(
  sessions: TrainingSession[],
  zones?: TrainingZones
): IntensityDistribution {
  const analyzer = new IntensityAnalyzer(sessions, zones);
  return analyzer.analyzeDistribution();
}

/**
 * Get recommended session type based on weekly balance
 * Pass zones for dynamic RPE-based analysis, or omit for session-type-based analysis
 */
export function getIntensityRecommendation(
  weekSessions: TrainingSession[],
  zones?: TrainingZones
): {
  preferEasy: boolean;
  preferHard: boolean;
  reasoning: string;
} {
  const analyzer = new IntensityAnalyzer(weekSessions, zones);
  return analyzer.getRecommendedSessionType(weekSessions);
}
