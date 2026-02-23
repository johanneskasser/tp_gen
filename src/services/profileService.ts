import { supabase } from '../lib/supabase';
import { UserProfile } from '../types/profile';

export const profileService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    // If no profile exists, create one
    if (!data) {
      return await this.createProfile(userId);
    }

    return data;
  },

  async createProfile(userId: string): Promise<UserProfile | null> {
    // Get user email for default name
    const { data: { user } } = await supabase.auth.getUser();
    const defaultName = user?.email?.split('@')[0] || 'Unbenannt';

    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        full_name: defaultName,
        avatar_url: null,
        bio: null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return null;
    }

    return data;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    return data;
  },

  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  async deleteAvatar(avatarUrl: string): Promise<void> {
    // Extract file path from URL
    const urlParts = avatarUrl.split('/avatars/');
    if (urlParts.length < 2) return;

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting avatar:', error);
      throw error;
    }
  },
};
