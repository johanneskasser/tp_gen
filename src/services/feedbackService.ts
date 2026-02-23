import { supabase } from '../lib/supabase';

export interface FeedbackSubmission {
  overallRating?: number;
  featuresRating?: number;
  editorRating?: number;
  marketplaceRating?: number;
  individualFeedback?: string;
  featureSuggestion?: string;
}

export interface UserFeedback {
  id: string;
  user_id: string;
  overall_rating?: number;
  features_rating?: number;
  editor_rating?: number;
  marketplace_rating?: number;
  individual_feedback?: string;
  feature_suggestion?: string;
  email_sent: boolean;
  email_sent_at?: string;
  created_at: string;
}

export const feedbackService = {
  /**
   * Check if user can submit feedback (rate limit check)
   * Returns true if user can submit (no feedback in last 24 hours)
   */
  async canSubmitFeedback(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_feedback_rate_limit', {
        user_uuid: userId,
      });

      if (error) {
        console.error('Error checking rate limit:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error in canSubmitFeedback:', error);
      return false;
    }
  },

  /**
   * Submit user feedback
   * Inserts feedback into database and triggers email notification
   */
  async submitFeedback(
    userId: string,
    feedback: FeedbackSubmission
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate that at least one field is filled
      const hasRating =
        feedback.overallRating ||
        feedback.featuresRating ||
        feedback.editorRating ||
        feedback.marketplaceRating;
      const hasText =
        feedback.individualFeedback || feedback.featureSuggestion;

      if (!hasRating && !hasText) {
        return {
          success: false,
          error: 'Bitte fülle mindestens ein Feld aus.',
        };
      }

      // Check rate limit
      const canSubmit = await this.canSubmitFeedback(userId);
      if (!canSubmit) {
        return {
          success: false,
          error:
            'Du hast bereits heute Feedback eingereicht. Bitte versuche es morgen erneut.',
        };
      }

      // Insert feedback into database
      const { data: insertedFeedback, error: insertError } = await supabase
        .from('user_feedback')
        .insert({
          user_id: userId,
          overall_rating: feedback.overallRating || null,
          features_rating: feedback.featuresRating || null,
          editor_rating: feedback.editorRating || null,
          marketplace_rating: feedback.marketplaceRating || null,
          individual_feedback: feedback.individualFeedback || null,
          feature_suggestion: feedback.featureSuggestion || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting feedback:', insertError);
        throw new Error(insertError.message);
      }

      // Trigger email sending via Edge Function
      try {
        const { error: emailError } = await supabase.functions.invoke(
          'send-feedback-email',
          {
            body: { feedbackId: insertedFeedback.id },
          }
        );

        if (emailError) {
          console.error('Email sending failed:', emailError);
          // Don't fail the whole operation if email fails
          // The feedback is already saved successfully
        }
      } catch (emailError) {
        console.error('Error invoking email function:', emailError);
        // Don't fail - feedback is saved
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      return {
        success: false,
        error: error.message || 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.',
      };
    }
  },

  /**
   * Get user's feedback history
   * Returns all feedback submitted by the user, ordered by most recent first
   */
  async getUserFeedback(userId: string): Promise<UserFeedback[]> {
    try {
      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching feedback:', error);
        return [];
      }

      return (data as UserFeedback[]) || [];
    } catch (error) {
      console.error('Error in getUserFeedback:', error);
      return [];
    }
  },
};
