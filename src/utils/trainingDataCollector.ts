import { TrainingSuggestion, TrainingDataPoint, TrainingPattern, TrainingContext } from '../types/suggestions';
import { TrainingSession, SessionType } from '../types';
import { SuggestionService } from '../services/suggestionService';

/**
 * Training Data Collector for ML
 *
 * This module collects training data that will be used later for:
 * 1. Pattern recognition
 * 2. ML model training
 * 3. Personalized recommendations
 *
 * Data is stored both locally (for offline support) and synced to Supabase (for ML training).
 */
export class TrainingDataCollector {
  private static STORAGE_KEY = 'training_data_points';
  private static PATTERN_KEY = 'training_patterns';
  private static SYNC_QUEUE_KEY = 'training_data_sync_queue';
  private static AUTO_SYNC = true; // Set to false to disable auto-sync

  /**
   * Log a suggestion that was shown to the user
   */
  static async logSuggestion(
    context: Partial<TrainingContext>,
    suggestion: TrainingSuggestion,
    userAction: 'accepted' | 'modified' | 'rejected' | 'ignored',
    modifications?: Partial<TrainingSession>
  ): Promise<string | null> {
    const dataPoint: TrainingDataPoint = {
      timestamp: new Date().toISOString(),
      context,
      suggestion,
      userAction,
      modifications,
    };

    // Save locally first
    this.saveDataPoint(dataPoint);

    // If accepted, also log as a successful pattern
    if (userAction === 'accepted') {
      this.logSuccessfulPattern(context, suggestion);
    }

    // Sync to Supabase if auto-sync is enabled
    let dataPointId: string | null = null;
    if (this.AUTO_SYNC) {
      const result = await SuggestionService.logSuggestion(
        context,
        suggestion,
        userAction,
        modifications
      );

      if (result.success && result.dataPointId) {
        dataPointId = result.dataPointId;
      } else {
        // If sync fails, add to queue for later
        this.addToSyncQueue({ dataPoint, type: 'data_point' });
        console.warn('Failed to sync suggestion to Supabase, added to queue:', result.error);
      }
    }

    return dataPointId;
  }

  /**
   * Log session completion and user feedback
   */
  static async logSessionOutcome(
    dataPointId: string,
    outcome: {
      sessionCompleted: boolean;
      userRating?: number;
      notes?: string;
    }
  ): Promise<void> {
    // Update local storage
    const dataPoints = this.getDataPoints();
    const dataPoint = dataPoints.find((dp) => this.generateId(dp) === dataPointId);

    if (dataPoint) {
      dataPoint.outcome = outcome;
      this.saveAllDataPoints(dataPoints);
    }

    // Sync to Supabase if auto-sync is enabled
    if (this.AUTO_SYNC) {
      const result = await SuggestionService.logSessionOutcome(dataPointId, outcome);

      if (!result.success) {
        console.warn('Failed to sync outcome to Supabase:', result.error);
        // Add to sync queue for later
        this.addToSyncQueue({ dataPointId, outcome, type: 'outcome' });
      }
    }
  }

  /**
   * Record a successful training pattern
   */
  private static async logSuccessfulPattern(
    context: Partial<TrainingContext>,
    suggestion: TrainingSuggestion
  ): Promise<void> {
    if (!context.recentSessionTypes || !context.currentPhase) return;

    // Create pattern from recent sessions + suggested session
    const sequence = [...context.recentSessionTypes, suggestion.type];
    const contextHash = this.hashContext(context);

    const patterns = this.getPatterns();
    const existingPattern = patterns.find(
      (p) => p.contextHash === contextHash && this.arraysEqual(p.sequence, sequence)
    );

    let pattern: TrainingPattern;

    if (existingPattern) {
      // Increment frequency
      existingPattern.frequency++;
      if (existingPattern.successMetrics) {
        existingPattern.successMetrics.completionRate =
          (existingPattern.successMetrics.completionRate * (existingPattern.frequency - 1) + 1) /
          existingPattern.frequency;
      }
      pattern = existingPattern;
    } else {
      // Create new pattern
      const newPattern: TrainingPattern = {
        id: this.generatePatternId(sequence, contextHash),
        sequence,
        contextHash,
        frequency: 1,
        successMetrics: {
          completionRate: 1.0,
        },
        metadata: {
          raceDistance: context.plan?.event.distance || 'UNKNOWN',
          phase: context.currentPhase,
          weekInPlan: context.weekNumber || 0,
          totalWeeks: context.totalWeeks || 0,
        },
      };
      patterns.push(newPattern);
      pattern = newPattern;
    }

    // Save locally
    this.savePatterns(patterns);

    // Sync to Supabase if auto-sync is enabled
    if (this.AUTO_SYNC) {
      const result = await SuggestionService.syncPattern(pattern);

      if (!result.success) {
        console.warn('Failed to sync pattern to Supabase:', result.error);
        this.addToSyncQueue({ pattern, type: 'pattern' });
      }
    }
  }

  /**
   * Get most common patterns for a context
   */
  static getRecommendedPatterns(context: Partial<TrainingContext>, limit: number = 5): TrainingPattern[] {
    const contextHash = this.hashContext(context);
    const patterns = this.getPatterns();

    // Filter patterns matching context and sort by frequency
    return patterns
      .filter((p) => p.contextHash === contextHash)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }

  /**
   * Get all collected data points
   */
  static getDataPoints(): TrainingDataPoint[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading training data:', error);
      return [];
    }
  }

  /**
   * Get all patterns
   */
  static getPatterns(): TrainingPattern[] {
    try {
      const data = localStorage.getItem(this.PATTERN_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading patterns:', error);
      return [];
    }
  }

  /**
   * Export data for ML training (future)
   */
  static exportDataForML(): {
    dataPoints: TrainingDataPoint[];
    patterns: TrainingPattern[];
    stats: {
      totalDataPoints: number;
      totalPatterns: number;
      acceptanceRate: number;
      modificationRate: number;
    };
  } {
    const dataPoints = this.getDataPoints();
    const patterns = this.getPatterns();

    const accepted = dataPoints.filter((dp) => dp.userAction === 'accepted').length;
    const modified = dataPoints.filter((dp) => dp.userAction === 'modified').length;
    const total = dataPoints.length;

    return {
      dataPoints,
      patterns,
      stats: {
        totalDataPoints: total,
        totalPatterns: patterns.length,
        acceptanceRate: total > 0 ? accepted / total : 0,
        modificationRate: total > 0 ? modified / total : 0,
      },
    };
  }

  /**
   * Clear all data (for testing or privacy)
   */
  static clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.PATTERN_KEY);
    localStorage.removeItem(this.SYNC_QUEUE_KEY);
  }

  /**
   * Manually sync all local data to Supabase
   * Useful for syncing data that was collected offline
   */
  static async syncToSupabase(): Promise<{
    success: boolean;
    dataPointsSynced: number;
    patternsSynced: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let dataPointsSynced = 0;
    let patternsSynced = 0;

    try {
      // Sync data points
      const dataPoints = this.getDataPoints();
      if (dataPoints.length > 0) {
        const result = await SuggestionService.batchSyncDataPoints(dataPoints);
        dataPointsSynced = result.synced;
        if (!result.success) {
          errors.push(result.error || 'Failed to sync data points');
        }
      }

      // Sync patterns
      const patterns = this.getPatterns();
      if (patterns.length > 0) {
        const result = await SuggestionService.batchSyncPatterns(patterns);
        patternsSynced = result.synced;
        if (!result.success) {
          errors.push(result.error || 'Failed to sync patterns');
        }
      }

      // Process sync queue
      const queueResult = await this.processSyncQueue();
      if (!queueResult.success) {
        errors.push(...queueResult.errors);
      }

      return {
        success: errors.length === 0,
        dataPointsSynced,
        patternsSynced,
        errors,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error during sync');
      return {
        success: false,
        dataPointsSynced,
        patternsSynced,
        errors,
      };
    }
  }

  /**
   * Get sync queue items
   */
  private static getSyncQueue(): any[] {
    try {
      const data = localStorage.getItem(this.SYNC_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading sync queue:', error);
      return [];
    }
  }

  /**
   * Add item to sync queue
   */
  private static addToSyncQueue(item: any): void {
    try {
      const queue = this.getSyncQueue();
      queue.push({ ...item, addedAt: new Date().toISOString() });

      // Keep only last 100 items
      if (queue.length > 100) {
        queue.shift();
      }

      localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  }

  /**
   * Process sync queue (retry failed syncs)
   */
  static async processSyncQueue(): Promise<{ success: boolean; processed: number; errors: string[] }> {
    const queue = this.getSyncQueue();
    const errors: string[] = [];
    let processed = 0;

    if (queue.length === 0) {
      return { success: true, processed: 0, errors: [] };
    }

    const newQueue: any[] = [];

    for (const item of queue) {
      try {
        if (item.type === 'data_point') {
          const result = await SuggestionService.logSuggestion(
            item.dataPoint.context,
            item.dataPoint.suggestion,
            item.dataPoint.userAction,
            item.dataPoint.modifications
          );
          if (result.success) {
            processed++;
          } else {
            newQueue.push(item); // Keep in queue
            errors.push(result.error || 'Unknown error');
          }
        } else if (item.type === 'pattern') {
          const result = await SuggestionService.syncPattern(item.pattern);
          if (result.success) {
            processed++;
          } else {
            newQueue.push(item); // Keep in queue
            errors.push(result.error || 'Unknown error');
          }
        } else if (item.type === 'outcome') {
          const result = await SuggestionService.logSessionOutcome(item.dataPointId, item.outcome);
          if (result.success) {
            processed++;
          } else {
            newQueue.push(item); // Keep in queue
            errors.push(result.error || 'Unknown error');
          }
        }
      } catch (error) {
        newQueue.push(item); // Keep in queue on error
        errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // Update queue with items that still need to be synced
    localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(newQueue));

    return {
      success: newQueue.length === 0,
      processed,
      errors,
    };
  }

  /**
   * Get sync status
   */
  static getSyncStatus(): {
    queueLength: number;
    autoSyncEnabled: boolean;
    lastSyncAttempt: string | null;
  } {
    const queue = this.getSyncQueue();
    return {
      queueLength: queue.length,
      autoSyncEnabled: this.AUTO_SYNC,
      lastSyncAttempt: queue.length > 0 ? queue[queue.length - 1].addedAt : null,
    };
  }

  /**
   * Get insights from collected data
   */
  static getInsights(): {
    mostAcceptedSessionTypes: { type: SessionType; count: number }[];
    mostModifiedSessionTypes: { type: SessionType; count: number }[];
    bestPhaseForSuggestions: string;
    averageUserRating: number;
  } {
    const dataPoints = this.getDataPoints();

    // Most accepted session types
    const acceptedTypes = dataPoints
      .filter((dp) => dp.userAction === 'accepted')
      .map((dp) => dp.suggestion.type);

    const typeCounts = this.countOccurrences(acceptedTypes);
    const mostAcceptedSessionTypes = Object.entries(typeCounts)
      .map(([type, count]) => ({ type: type as SessionType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Most modified session types
    const modifiedTypes = dataPoints
      .filter((dp) => dp.userAction === 'modified')
      .map((dp) => dp.suggestion.type);

    const modifiedCounts = this.countOccurrences(modifiedTypes);
    const mostModifiedSessionTypes = Object.entries(modifiedCounts)
      .map(([type, count]) => ({ type: type as SessionType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Best phase for suggestions (highest acceptance rate)
    const phaseAcceptance: Record<string, { accepted: number; total: number }> = {};
    for (const dp of dataPoints) {
      const phase = dp.context.currentPhase || 'unknown';
      if (!phaseAcceptance[phase]) {
        phaseAcceptance[phase] = { accepted: 0, total: 0 };
      }
      phaseAcceptance[phase].total++;
      if (dp.userAction === 'accepted') {
        phaseAcceptance[phase].accepted++;
      }
    }

    const bestPhase = Object.entries(phaseAcceptance)
      .map(([phase, stats]) => ({
        phase,
        rate: stats.total > 0 ? stats.accepted / stats.total : 0,
      }))
      .sort((a, b) => b.rate - a.rate)[0]?.phase || 'unknown';

    // Average user rating
    const ratings = dataPoints
      .map((dp) => dp.outcome?.userRating)
      .filter((r): r is number => r !== undefined);
    const averageUserRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    return {
      mostAcceptedSessionTypes,
      mostModifiedSessionTypes,
      bestPhaseForSuggestions: bestPhase,
      averageUserRating,
    };
  }

  // ========== Private Helper Methods ==========

  private static saveDataPoint(dataPoint: TrainingDataPoint): void {
    const dataPoints = this.getDataPoints();
    dataPoints.push(dataPoint);

    // Keep only last 1000 data points to avoid storage bloat
    if (dataPoints.length > 1000) {
      dataPoints.shift();
    }

    this.saveAllDataPoints(dataPoints);
  }

  private static saveAllDataPoints(dataPoints: TrainingDataPoint[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataPoints));
    } catch (error) {
      console.error('Error saving training data:', error);
    }
  }

  private static savePatterns(patterns: TrainingPattern[]): void {
    try {
      // Keep only top 500 patterns by frequency
      const topPatterns = patterns.sort((a, b) => b.frequency - a.frequency).slice(0, 500);
      localStorage.setItem(this.PATTERN_KEY, JSON.stringify(topPatterns));
    } catch (error) {
      console.error('Error saving patterns:', error);
    }
  }

  private static hashContext(context: Partial<TrainingContext>): string {
    // Create a hash from key context properties
    const key = [
      context.currentPhase || 'unknown',
      context.plan?.event.distance || 'unknown',
      Math.floor((context.weekNumber || 0) / (context.totalWeeks || 1) * 10), // Normalize to 0-10
    ].join('_');

    return key;
  }

  private static generateId(dataPoint: TrainingDataPoint): string {
    return `${dataPoint.timestamp}_${dataPoint.suggestion.type}`;
  }

  private static generatePatternId(sequence: SessionType[], contextHash: string): string {
    return `${contextHash}_${sequence.join('-')}`;
  }

  private static arraysEqual(a: SessionType[], b: SessionType[]): boolean {
    return a.length === b.length && a.every((val, idx) => val === b[idx]);
  }

  private static countOccurrences(arr: SessionType[]): Record<string, number> {
    return arr.reduce(
      (acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }
}

/**
 * Hook for React components to use data collector
 */
export function useTrainingDataCollector() {
  return {
    logSuggestion: TrainingDataCollector.logSuggestion.bind(TrainingDataCollector),
    logSessionOutcome: TrainingDataCollector.logSessionOutcome.bind(TrainingDataCollector),
    getInsights: TrainingDataCollector.getInsights.bind(TrainingDataCollector),
    exportData: TrainingDataCollector.exportDataForML.bind(TrainingDataCollector),
    syncToSupabase: TrainingDataCollector.syncToSupabase.bind(TrainingDataCollector),
    processSyncQueue: TrainingDataCollector.processSyncQueue.bind(TrainingDataCollector),
    getSyncStatus: TrainingDataCollector.getSyncStatus.bind(TrainingDataCollector),
  };
}
