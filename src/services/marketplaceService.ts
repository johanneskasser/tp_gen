import { supabase } from '../lib/supabase';
import {
  MarketplacePlan,
  MarketplaceFilters,
  PublishPlanRequest,
  PlanStats,
  UserInteraction,
  PlanLike,
  PlanRating,
  PlanComment,
} from '../types/marketplace';
import { TrainingPlan } from '../types';

export const marketplaceService = {
  // ============================================
  // MARKETPLACE BROWSING
  // ============================================

  /**
   * Browse public training plans with filters
   */
  async browsePlans(filters: MarketplaceFilters = {}): Promise<{
    plans: MarketplacePlan[];
    total: number;
  }> {
    const {
      search,
      tags,
      distance,
      duration_weeks,
      from_following,
      creator_id,
      sort_by = 'recent',
      page = 1,
      page_size = 12,
    } = filters;

    let query = supabase
      .from('training_plans')
      .select('*', { count: 'exact' })
      .in('visibility', ['public', 'public_anonymous']);

    // Filter by creator
    if (creator_id) {
      query = query.eq('user_id', creator_id);
    }

    // Filter by following users
    if (from_following) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Get list of user IDs that current user follows
        const { data: followingData } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);

        const followingIds = (followingData || []).map((f) => f.following_id);

        if (followingIds.length > 0) {
          query = query.in('user_id', followingIds);
        } else {
          // User doesn't follow anyone, return empty result
          return { plans: [], total: 0 };
        }
      } else {
        // Not authenticated, can't show following feed
        return { plans: [], total: 0 };
      }
    }

    // Search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Tags filter
    if (tags && tags.length > 0) {
      query = query.contains('tags', tags);
    }

    // Distance filter
    if (distance && distance.length === 2) {
      // Filter by distance in plan_data JSON
      // Note: This is a simplified approach. For production, consider indexing distance.
      query = query.gte('plan_data->event->>distance', distance[0].toString());
      query = query.lte('plan_data->event->>distance', distance[1].toString());
    }

    // Duration filter
    // Note: This requires calculating weeks count from plan_data
    // For now, we'll fetch and filter in memory

    // Sorting
    switch (sort_by) {
      case 'popular':
        query = query.order('view_count', { ascending: false });
        break;
      case 'rating':
        // Will need to join with ratings and sort by average
        // For now, use clone_count as proxy
        query = query.order('clone_count', { ascending: false });
        break;
      case 'clones':
        query = query.order('clone_count', { ascending: false });
        break;
      case 'recent':
      default:
        query = query.order('published_at', { ascending: false });
    }

    // Pagination
    const from = (page - 1) * page_size;
    const to = from + page_size - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    // Get unique user IDs for public plans
    const publicPlanUserIds = (data || [])
      .filter((plan) => plan.visibility === 'public')
      .map((plan) => plan.user_id);
    const uniqueUserIds = Array.from(new Set(publicPlanUserIds));

    // Fetch user profiles for creators
    let userProfiles: Record<string, any> = {};
    if (uniqueUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', uniqueUserIds);

      if (profiles) {
        userProfiles = profiles.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // Fetch stats for each plan
    const plansWithStats = await Promise.all(
      (data || []).map(async (plan) => {
        const stats = await this.getPlanStats(plan.id);
        const creator = plan.visibility === 'public' ? userProfiles[plan.user_id] : null;

        return {
          ...plan,
          creator,
          stats,
        };
      })
    );

    return {
      plans: plansWithStats,
      total: count || 0,
    };
  },

  /**
   * Get a single marketplace plan by ID
   */
  async getPlanById(planId: string): Promise<MarketplacePlan | null> {
    const { data, error } = await supabase
      .from('training_plans')
      .select('*')
      .eq('id', planId)
      .in('visibility', ['public', 'public_anonymous'])
      .maybeSingle();

    if (error) {
      console.error('Error fetching plan:', error);
      throw error;
    }

    if (!data) return null;

    // Increment view count
    await this.incrementViewCount(planId);

    // Get creator profile if plan is public
    let creator = null;
    if (data.visibility === 'public') {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user_id)
        .maybeSingle();
      creator = profile;
    }

    // Get stats
    const stats = await this.getPlanStats(planId);

    // Get user interaction if authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let user_interaction: UserInteraction | undefined;

    if (user) {
      user_interaction = await this.getUserInteraction(planId, user.id);
    }

    return {
      ...data,
      creator,
      stats,
      user_interaction,
    };
  },

  /**
   * Get plan statistics
   */
  async getPlanStats(planId: string): Promise<PlanStats> {
    const { data, error } = await supabase.rpc('get_plan_stats', {
      plan_uuid: planId,
    });

    if (error) {
      console.error('Error fetching plan stats:', error);
      return {
        likes_count: 0,
        rating_avg: null,
        rating_count: 0,
        comments_count: 0,
      };
    }

    return {
      likes_count: Number(data[0].likes_count) || 0,
      rating_avg: data[0].rating_avg ? Number(data[0].rating_avg) : null,
      rating_count: Number(data[0].rating_count) || 0,
      comments_count: Number(data[0].comments_count) || 0,
    };
  },

  /**
   * Get user's interaction with a plan
   */
  async getUserInteraction(planId: string, userId: string): Promise<UserInteraction> {
    // Check if user has liked
    const { data: likeData } = await supabase
      .from('plan_likes')
      .select('id')
      .eq('plan_id', planId)
      .eq('user_id', userId)
      .maybeSingle();

    // Check if user has rated
    const { data: ratingData } = await supabase
      .from('plan_ratings')
      .select('rating')
      .eq('plan_id', planId)
      .eq('user_id', userId)
      .maybeSingle();

    return {
      has_liked: !!likeData,
      user_rating: ratingData?.rating || null,
    };
  },

  /**
   * Increment view count for a plan
   */
  async incrementViewCount(planId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_view_count', {
      plan_uuid: planId,
    });

    if (error) {
      console.error('Error incrementing view count:', error);
    }
  },

  /**
   * Increment clone count for a plan
   */
  async incrementCloneCount(planId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_clone_count', {
      plan_uuid: planId,
    });

    if (error) {
      console.error('Error incrementing clone count:', error);
    }
  },

  // ============================================
  // PUBLISHING
  // ============================================

  /**
   * Publish a training plan
   */
  async publishPlan(planId: string, request: PublishPlanRequest): Promise<void> {
    const { data: plan } = await supabase
      .from('training_plans')
      .select('plan_data')
      .eq('id', planId)
      .single();

    if (!plan) throw new Error('Plan not found');

    // Generate automatic tags
    const { data: autoTags, error: tagsError } = await supabase.rpc(
      'generate_automatic_tags',
      {
        plan_data: plan.plan_data,
      }
    );

    if (tagsError) {
      console.error('Error generating tags:', tagsError);
    }

    // Combine auto and manual tags
    const allTags = [...(autoTags || []), ...request.manual_tags];
    const uniqueTags = Array.from(new Set(allTags));

    // Update plan
    const { error } = await supabase
      .from('training_plans')
      .update({
        visibility: request.visibility,
        description: request.description,
        tags: uniqueTags,
        published_at: new Date().toISOString(),
      })
      .eq('id', planId);

    if (error) throw error;
  },

  /**
   * Unpublish a training plan
   */
  async unpublishPlan(planId: string): Promise<void> {
    const { error } = await supabase
      .from('training_plans')
      .update({
        visibility: 'private',
        published_at: null,
      })
      .eq('id', planId);

    if (error) throw error;
  },

  // ============================================
  // CLONING
  // ============================================

  /**
   * Clone a marketplace plan to user's plans
   */
  async clonePlan(planId: string, newPlan: TrainingPlan): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    // Create new plan
    const { data, error } = await supabase
      .from('training_plans')
      .insert({
        user_id: user.id,
        name: newPlan.event.name,
        plan_data: newPlan,
        visibility: 'private',
      })
      .select('id')
      .single();

    if (error) throw error;

    // Increment clone count on original plan
    await this.incrementCloneCount(planId);

    return data.id;
  },

  // ============================================
  // LIKES
  // ============================================

  /**
   * Toggle like on a plan
   */
  async toggleLike(planId: string): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('plan_likes')
      .select('id')
      .eq('plan_id', planId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingLike) {
      // Unlike
      const { error } = await supabase.from('plan_likes').delete().eq('id', existingLike.id);

      if (error) throw error;
      return false;
    } else {
      // Like
      const { error } = await supabase.from('plan_likes').insert({
        plan_id: planId,
        user_id: user.id,
      });

      if (error) throw error;
      return true;
    }
  },

  /**
   * Get likes for a plan
   */
  async getLikes(planId: string): Promise<PlanLike[]> {
    const { data, error } = await supabase
      .from('plan_likes')
      .select('*')
      .eq('plan_id', planId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // ============================================
  // RATINGS
  // ============================================

  /**
   * Rate a plan (1-5 stars)
   */
  async ratePlan(planId: string, rating: number): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    // Upsert rating
    const { error } = await supabase.from('plan_ratings').upsert(
      {
        plan_id: planId,
        user_id: user.id,
        rating,
      },
      {
        onConflict: 'plan_id,user_id',
      }
    );

    if (error) throw error;
  },

  /**
   * Delete user's rating
   */
  async deleteRating(planId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('plan_ratings')
      .delete()
      .eq('plan_id', planId)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  /**
   * Get ratings for a plan
   */
  async getRatings(planId: string): Promise<PlanRating[]> {
    const { data, error } = await supabase
      .from('plan_ratings')
      .select('*')
      .eq('plan_id', planId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // ============================================
  // COMMENTS
  // ============================================

  /**
   * Add a comment to a plan
   */
  async addComment(planId: string, comment: string): Promise<PlanComment> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('plan_comments')
      .insert({
        plan_id: planId,
        user_id: user.id,
        comment,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a comment
   */
  async updateComment(commentId: string, comment: string): Promise<void> {
    const { error } = await supabase
      .from('plan_comments')
      .update({ comment })
      .eq('id', commentId);

    if (error) throw error;
  },

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase.from('plan_comments').delete().eq('id', commentId);

    if (error) throw error;
  },

  /**
   * Get comments for a plan
   */
  async getComments(planId: string): Promise<PlanComment[]> {
    const { data, error } = await supabase
      .from('plan_comments')
      .select('*')
      .eq('plan_id', planId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get unique user IDs
    const userIds = Array.from(new Set((data || []).map((c) => c.user_id)));

    // Fetch user profiles
    let userProfiles: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', userIds);

      if (profiles) {
        userProfiles = profiles.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    return (data || []).map((comment) => ({
      ...comment,
      user: userProfiles[comment.user_id],
    }));
  },
};
