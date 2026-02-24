import { supabase } from '../lib/supabase';

export interface FeedbackSubmission {
  overallRating?: number;
  featuresRating?: number;
  editorRating?: number;
  marketplaceRating?: number;
  individualFeedback?: string;
  featureSuggestion?: string;
  // Optional contact info (anonymous submissions)
  anonymousName?: string;
  anonymousEmail?: string;
  // IP for anon rate limiting (fetched client-side)
  ipAddress?: string;
}

export interface UserFeedback {
  id: string;
  user_id: string | null;
  overall_rating?: number;
  features_rating?: number;
  editor_rating?: number;
  marketplace_rating?: number;
  individual_feedback?: string;
  feature_suggestion?: string;
  is_anonymous: boolean;
  anonymous_name?: string;
  anonymous_email?: string;
  ip_address?: string;
  email_sent: boolean;
  email_sent_at?: string;
  created_at: string;
}

export const feedbackService = {
  /**
   * Check if an authenticated user can submit feedback (once-ever per user_id)
   */
  async canSubmitFeedback(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_feedback_rate_limit', {
        user_uuid: userId,
      });
      if (error) {
        console.error('Error checking user rate limit:', error);
        return false;
      }
      return data === true;
    } catch (err) {
      console.error('Error in canSubmitFeedback:', err);
      return false;
    }
  },

  /**
   * Submit feedback — works for both authenticated and anonymous users.
   * Pass userId=null for anonymous submissions.
   */
  async submitFeedback(
    userId: string | null,
    feedback: FeedbackSubmission
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const hasRating =
        feedback.overallRating ||
        feedback.featuresRating ||
        feedback.editorRating ||
        feedback.marketplaceRating;
      const hasText = feedback.individualFeedback || feedback.featureSuggestion;

      if (!hasRating && !hasText) {
        return { success: false, error: 'Bitte fülle mindestens ein Feld aus.' };
      }

      const isAnonymous = userId === null;

      if (isAnonymous) {
        // Anonymous: call SECURITY DEFINER function (bypasses RLS safely)
        // Rate limiting and validation happen inside the function
        const { data, error: rpcError } = await supabase.rpc('submit_anonymous_feedback', {
          p_overall_rating:      feedback.overallRating      ?? null,
          p_features_rating:     feedback.featuresRating     ?? null,
          p_editor_rating:       feedback.editorRating       ?? null,
          p_marketplace_rating:  feedback.marketplaceRating  ?? null,
          p_individual_feedback: feedback.individualFeedback ?? null,
          p_feature_suggestion:  feedback.featureSuggestion  ?? null,
          p_anonymous_name:      feedback.anonymousName      ?? null,
          p_anonymous_email:     feedback.anonymousEmail     ?? null,
          p_ip_address:          feedback.ipAddress          ?? null,
        });

        if (rpcError) {
          console.error('Error calling submit_anonymous_feedback:', rpcError);
          throw new Error(rpcError.message);
        }

        if (!data?.success) {
          return { success: false, error: data?.error || 'Ein Fehler ist aufgetreten.' };
        }

        // Trigger email notification with the returned feedback id
        if (data.id) this._triggerEmailNotification(data.id);
        return { success: true };
      } else {
        // Authenticated: check user-based once-ever rate limit
        const canSubmit = await this.canSubmitFeedback(userId);
        if (!canSubmit) {
          return {
            success: false,
            error: 'Du hast bereits Feedback eingereicht. Herzlichen Dank!',
          };
        }

        const { data: insertedFeedback, error: insertError } = await supabase
          .from('user_feedback')
          .insert({
            user_id: userId,
            is_anonymous: false,
            overall_rating: feedback.overallRating || null,
            features_rating: feedback.featuresRating || null,
            editor_rating: feedback.editorRating || null,
            marketplace_rating: feedback.marketplaceRating || null,
            individual_feedback: feedback.individualFeedback?.trim() || null,
            feature_suggestion: feedback.featureSuggestion?.trim() || null,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting authenticated feedback:', insertError);
          throw new Error(insertError.message);
        }

        this._triggerEmailNotification(insertedFeedback.id);
        return { success: true };
      }
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      return {
        success: false,
        error: err.message || 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.',
      };
    }
  },

  /** Fire-and-forget email notification */
  async _triggerEmailNotification(feedbackId: string) {
    try {
      const { error } = await supabase.functions.invoke('send-feedback-email', {
        body: { feedbackId },
      });
      if (error) console.error('Email sending failed:', error);
    } catch (err) {
      console.error('Error invoking email function:', err);
    }
  },

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
    } catch (err) {
      console.error('Error in getUserFeedback:', err);
      return [];
    }
  },
};
