import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  follower_count: number;
  following_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export const userService = {
  // ============================================
  // USER PROFILE
  // ============================================

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  },

  /**
   * Get multiple user profiles by IDs
   */
  async getUserProfiles(userIds: string[]): Promise<UserProfile[]> {
    if (userIds.length === 0) return [];

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .in('id', userIds);

    if (error) {
      console.error('Error fetching user profiles:', error);
      return [];
    }

    return data || [];
  },

  // ============================================
  // FOLLOW/UNFOLLOW
  // ============================================

  /**
   * Follow a user
   */
  async followUser(followingId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('user_follows').insert({
      follower_id: user.id,
      following_id: followingId,
    });

    if (error) {
      // Check if already following (unique constraint violation)
      if (error.code === '23505') {
        throw new Error('Already following this user');
      }
      throw error;
    }
  },

  /**
   * Unfollow a user
   */
  async unfollowUser(followingId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', followingId);

    if (error) throw error;
  },

  /**
   * Toggle follow/unfollow
   */
  async toggleFollow(followingId: string): Promise<boolean> {
    const isFollowing = await this.isFollowing(followingId);

    if (isFollowing) {
      await this.unfollowUser(followingId);
      return false;
    } else {
      await this.followUser(followingId);
      return true;
    }
  },

  /**
   * Check if current user follows another user
   */
  async isFollowing(followingId: string): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data, error } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', followingId)
      .maybeSingle();

    if (error) {
      console.error('Error checking follow status:', error);
      return false;
    }

    return !!data;
  },

  /**
   * Get list of users that current user follows
   */
  async getFollowing(userId?: string): Promise<UserProfile[]> {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;

    if (!targetUserId) return [];

    const { data, error } = await supabase
      .from('user_follows')
      .select(
        `
        following_id,
        user_profiles:following_id (*)
      `
      )
      .eq('follower_id', targetUserId);

    if (error) {
      console.error('Error fetching following:', error);
      return [];
    }

    return (data || [])
      .map((item: any) => item.user_profiles)
      .filter((profile: any) => profile !== null);
  },

  /**
   * Get list of users that follow a user
   */
  async getFollowers(userId?: string): Promise<UserProfile[]> {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;

    if (!targetUserId) return [];

    const { data, error } = await supabase
      .from('user_follows')
      .select(
        `
        follower_id,
        user_profiles:follower_id (*)
      `
      )
      .eq('following_id', targetUserId);

    if (error) {
      console.error('Error fetching followers:', error);
      return [];
    }

    return (data || [])
      .map((item: any) => item.user_profiles)
      .filter((profile: any) => profile !== null);
  },

  /**
   * Get follower and following counts for a user
   */
  async getFollowCounts(
    userId: string
  ): Promise<{ followerCount: number; followingCount: number }> {
    const profile = await this.getUserProfile(userId);

    return {
      followerCount: profile?.follower_count || 0,
      followingCount: profile?.following_count || 0,
    };
  },
};
