import { supabase } from '../lib/supabase';
import {
  TrainingDataPoint,
  TrainingPattern,
  TrainingSuggestion,
  TrainingContext,
} from '../types/suggestions';
import { TrainingSession } from '../types';

/**
 * Service for syncing training suggestion data with Supabase
 *
 * This service handles:
 * 1. Logging suggestion events to Supabase
 * 2. Syncing patterns for ML training
 * 3. Retrieving recommended patterns from backend
 */
export class SuggestionService {
  /**
   * Log a suggestion event to Supabase
   */
  static async logSuggestion(
    context: Partial<TrainingContext>,
    suggestion: TrainingSuggestion,
    userAction: 'accepted' | 'modified' | 'rejected' | 'ignored',
    modifications?: Partial<TrainingSession>
  ): Promise<{ success: boolean; error?: string; dataPointId?: string }> {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Prepare data point
      const dataPoint = {
        user_id: user.id,
        timestamp: new Date().toISOString(),
        context: this.sanitizeContext(context),
        suggestion: this.sanitizeSuggestion(suggestion),
        user_action: userAction,
        modifications: modifications ? (JSON.parse(JSON.stringify(modifications)) as any) : null,
      };

      // Insert into Supabase
      const { data, error } = await supabase
        .from('training_data_points')
        .insert(dataPoint)
        .select('id')
        .single();

      if (error) {
        console.error('Error logging suggestion to Supabase:', error);
        return { success: false, error: error.message };
      }

      return { success: true, dataPointId: data.id };
    } catch (error) {
      console.error('Error in logSuggestion:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update a data point with session outcome
   */
  static async logSessionOutcome(
    dataPointId: string,
    outcome: {
      sessionCompleted: boolean;
      userRating?: number;
      notes?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('training_data_points')
        .update({
          outcome,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dataPointId);

      if (error) {
        console.error('Error updating session outcome:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in logSessionOutcome:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sync a pattern to Supabase
   */
  static async syncPattern(pattern: TrainingPattern): Promise<{ success: boolean; error?: string }> {
    try {
      // Use upsert to update frequency if pattern already exists
      const { error } = await supabase
        .from('training_patterns')
        .upsert(
          {
            id: pattern.id,
            sequence: pattern.sequence,
            context_hash: pattern.contextHash,
            frequency: pattern.frequency,
            success_metrics: pattern.successMetrics || null,
            metadata: pattern.metadata,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'id',
          }
        );

      if (error) {
        console.error('Error syncing pattern to Supabase:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in syncPattern:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get recommended patterns from Supabase
   */
  static async getRecommendedPatterns(
    contextHash: string,
    limit: number = 5
  ): Promise<{ success: boolean; patterns?: TrainingPattern[]; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('get_recommended_patterns_for_context', {
        context_hash_param: contextHash,
        limit_param: limit,
      });

      if (error) {
        console.error('Error fetching patterns from Supabase:', error);
        return { success: false, error: error.message };
      }

      // Convert database format to TrainingPattern format
      const patterns: TrainingPattern[] = (data || []).map((row: any) => ({
        id: row.id,
        sequence: row.sequence,
        contextHash: contextHash,
        frequency: row.frequency,
        successMetrics: row.success_metrics,
        metadata: row.metadata,
      }));

      return { success: true, patterns };
    } catch (error) {
      console.error('Error in getRecommendedPatterns:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get ML training statistics for current user
   */
  static async getMLStats(): Promise<{
    success: boolean;
    stats?: {
      totalDataPoints: number;
      acceptedCount: number;
      modifiedCount: number;
      rejectedCount: number;
      ignoredCount: number;
      acceptanceRate: number;
      modificationRate: number;
    };
    error?: string;
  }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('ml_training_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no data exists yet, return zeros
        if (error.code === 'PGRST116') {
          return {
            success: true,
            stats: {
              totalDataPoints: 0,
              acceptedCount: 0,
              modifiedCount: 0,
              rejectedCount: 0,
              ignoredCount: 0,
              acceptanceRate: 0,
              modificationRate: 0,
            },
          };
        }
        console.error('Error fetching ML stats:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        stats: {
          totalDataPoints: data.total_data_points,
          acceptedCount: data.accepted_count,
          modifiedCount: data.modified_count,
          rejectedCount: data.rejected_count,
          ignoredCount: data.ignored_count,
          acceptanceRate: parseFloat(data.acceptance_rate),
          modificationRate: parseFloat(data.modification_rate),
        },
      };
    } catch (error) {
      console.error('Error in getMLStats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Batch sync local data points to Supabase
   * Useful for syncing data that was collected offline
   */
  static async batchSyncDataPoints(
    dataPoints: TrainingDataPoint[]
  ): Promise<{ success: boolean; synced: number; failed: number; error?: string }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, synced: 0, failed: dataPoints.length, error: 'User not authenticated' };
      }

      let synced = 0;
      let failed = 0;

      // Sync in batches of 10
      const batchSize = 10;
      for (let i = 0; i < dataPoints.length; i += batchSize) {
        const batch = dataPoints.slice(i, i + batchSize);

        const insertData = batch.map((dp) => ({
          user_id: user.id,
          timestamp: dp.timestamp,
          context: this.sanitizeContext(dp.context),
          suggestion: this.sanitizeSuggestion(dp.suggestion),
          user_action: dp.userAction,
          modifications: dp.modifications ? (JSON.parse(JSON.stringify(dp.modifications)) as any) : null,
          outcome: dp.outcome ? (JSON.parse(JSON.stringify(dp.outcome)) as any) : null,
        }));

        const { error } = await supabase.from('training_data_points').insert(insertData);

        if (error) {
          console.error(`Error syncing batch ${i / batchSize + 1}:`, error);
          failed += batch.length;
        } else {
          synced += batch.length;
        }
      }

      return {
        success: failed === 0,
        synced,
        failed,
        error: failed > 0 ? `Failed to sync ${failed} data points` : undefined,
      };
    } catch (error) {
      console.error('Error in batchSyncDataPoints:', error);
      return {
        success: false,
        synced: 0,
        failed: dataPoints.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Batch sync local patterns to Supabase
   */
  static async batchSyncPatterns(
    patterns: TrainingPattern[]
  ): Promise<{ success: boolean; synced: number; failed: number; error?: string }> {
    try {
      let synced = 0;
      let failed = 0;

      // Sync in batches of 20
      const batchSize = 20;
      for (let i = 0; i < patterns.length; i += batchSize) {
        const batch = patterns.slice(i, i + batchSize);

        const upsertData = batch.map((pattern) => ({
          id: pattern.id,
          sequence: pattern.sequence,
          context_hash: pattern.contextHash,
          frequency: pattern.frequency,
          success_metrics: pattern.successMetrics || null,
          metadata: pattern.metadata,
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase.from('training_patterns').upsert(upsertData, {
          onConflict: 'id',
        });

        if (error) {
          console.error(`Error syncing pattern batch ${i / batchSize + 1}:`, error);
          failed += batch.length;
        } else {
          synced += batch.length;
        }
      }

      return {
        success: failed === 0,
        synced,
        failed,
        error: failed > 0 ? `Failed to sync ${failed} patterns` : undefined,
      };
    } catch (error) {
      console.error('Error in batchSyncPatterns:', error);
      return {
        success: false,
        synced: 0,
        failed: patterns.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ========== Private Helper Methods ==========

  /**
   * Sanitize context for storage (remove circular references, etc.)
   */
  private static sanitizeContext(context: Partial<TrainingContext>): any {
    // Create a clean copy without circular references
    return {
      weekNumber: context.weekNumber,
      totalWeeks: context.totalWeeks,
      raceDistance: context.raceDistance,
      daysUntilRace: context.daysUntilRace,
      targetPace: context.targetPace,
      weeklyKm: context.weeklyKm,
      weeklyIntensityScore: context.weeklyIntensityScore,
      hardSessionsThisWeek: context.hardSessionsThisWeek,
      previousWeekKm: context.previousWeekKm,
      averageWeeklyKm: context.averageWeeklyKm,
      peakWeeklyKm: context.peakWeeklyKm,
      currentPhase: context.currentPhase,
      phaseProgress: context.phaseProgress,
      recentSessionTypes: context.recentSessionTypes,
      lastHardSessionDay: context.lastHardSessionDay,
      hasLongRunThisWeek: context.hasLongRunThisWeek,
    };
  }

  /**
   * Sanitize suggestion for storage
   */
  private static sanitizeSuggestion(suggestion: TrainingSuggestion): any {
    return {
      type: suggestion.type,
      distance: suggestion.distance,
      duration: suggestion.duration,
      warmUp: suggestion.warmUp,
      warmUpUnit: suggestion.warmUpUnit,
      coolDown: suggestion.coolDown,
      coolDownUnit: suggestion.coolDownUnit,
      confidence: suggestion.confidence,
      reason: suggestion.reason,
      priority: suggestion.priority,
      dayOfWeek: suggestion.dayOfWeek,
      suggestedTitle: suggestion.suggestedTitle,
      notes: suggestion.notes,
      intensityLevel: suggestion.intensityLevel,
    };
  }
}
