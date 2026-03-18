import { supabase } from '../lib/supabase';
import { UserProfile, PersonalBest } from '../types/userProfile';
import { Database } from '../types/database.types';
import { getBestVDOT, estimateVO2Max } from '../utils/vdotCalculator';

type PersonalBestRow = Database['public']['Tables']['personal_bests']['Row'];
type PersonalBestInsert = Database['public']['Tables']['personal_bests']['Insert'];
type TargetRaceInsert = Database['public']['Tables']['target_races']['Insert'];
type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

/**
 * Convert database PersonalBest to app PersonalBest
 */
function dbPersonalBestToPersonalBest(dbPB: PersonalBestRow): PersonalBest {
  return {
    distance: dbPB.distance as PersonalBest['distance'],
    customDistanceKm: dbPB.custom_distance_km || undefined,
    time: dbPB.time,
    date: dbPB.date || undefined,
  };
}

/**
 * Convert app PersonalBest to database PersonalBest insert
 */
function personalBestToDbInsert(pb: PersonalBest, userId: string): PersonalBestInsert {
  return {
    user_id: userId,
    distance: pb.distance,
    custom_distance_km: pb.customDistanceKm || null,
    time: pb.time,
    date: pb.date || null,
  };
}

/**
 * Fetch complete runner profile from database
 */
export async function fetchRunnerProfile(userId: string): Promise<UserProfile | null> {
  try {
    // Fetch user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        // Profile doesn't exist yet
        return null;
      }
      throw profileError;
    }

    // Fetch personal bests
    const { data: pbData, error: pbError } = await supabase
      .from('personal_bests')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (pbError) throw pbError;

    // Fetch target races
    const { data: targetRacesData, error: targetRacesError } = await supabase
      .from('target_races')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (targetRacesError) throw targetRacesError;

    // Convert to UserProfile
    const personalBests = pbData?.map(dbPersonalBestToPersonalBest) || [];

    const profile: UserProfile = {
      id: profileData.id,
      username: profileData.username || undefined,
      name: profileData.full_name || 'Läufer',
      age: profileData.age || undefined,
      gender: profileData.gender as 'male' | 'female' | 'other' | undefined,
      personalBests,
      weeklyKmBase: profileData.weekly_km_base || undefined,
      yearsRunning: profileData.years_running || undefined,
      vdot: profileData.vdot || undefined,
      estimatedVO2Max: profileData.estimated_vo2_max || undefined,
      preferredTrainingDays: profileData.preferred_training_days || undefined,
      availableTimePerWeek: profileData.available_time_per_week || undefined,
      targetRaces: targetRacesData?.map(tr => ({
        distance: tr.distance,
        date: tr.date,
        targetTime: tr.target_time || undefined,
      })) || [],
    };

    return profile;
  } catch (error) {
    console.error('Error fetching runner profile:', error);
    throw error;
  }
}

/**
 * Update or create runner profile in database
 */
export async function saveRunnerProfile(profile: UserProfile): Promise<void> {
  try {
    // Calculate VDOT from personal bests if not set
    const vdot = profile.personalBests.length > 0
      ? getBestVDOT(profile.personalBests)
      : profile.vdot;

    const estimatedVO2Max = vdot ? estimateVO2Max(vdot) : undefined;

    // Cap values to fit database constraints (NUMERIC(5,2) max is 999.99)
    const cappedVdot = vdot ? Math.min(vdot, 999.99) : null;
    const cappedVO2Max = estimatedVO2Max ? Math.min(estimatedVO2Max, 999.99) : null;
    const cappedWeeklyKm = profile.weeklyKmBase ? Math.min(profile.weeklyKmBase, 999.99) : null;
    const cappedYearsRunning = profile.yearsRunning ? Math.min(profile.yearsRunning, 999.99) : null;

    // Update user_profiles table
    const profileUpdate: UserProfileUpdate = {
      full_name: profile.name,
      age: profile.age || null,
      gender: profile.gender || null,
      weekly_km_base: cappedWeeklyKm,
      years_running: cappedYearsRunning,
      vdot: cappedVdot,
      estimated_vo2_max: cappedVO2Max,
      preferred_training_days: profile.preferredTrainingDays || null,
      available_time_per_week: profile.availableTimePerWeek || null,
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update(profileUpdate)
      .eq('id', profile.id);

    if (profileError) throw profileError;

    // Update personal bests
    // First, delete all existing PBs for this user
    const { error: deleteError } = await supabase
      .from('personal_bests')
      .delete()
      .eq('user_id', profile.id);

    if (deleteError) throw deleteError;

    // Then insert new ones
    if (profile.personalBests.length > 0) {
      const pbInserts = profile.personalBests.map(pb =>
        personalBestToDbInsert(pb, profile.id)
      );

      const { error: insertError } = await supabase
        .from('personal_bests')
        .insert(pbInserts);

      if (insertError) throw insertError;
    }

    // Update target races
    // First, delete all existing target races
    const { error: deleteTargetRacesError } = await supabase
      .from('target_races')
      .delete()
      .eq('user_id', profile.id);

    if (deleteTargetRacesError) throw deleteTargetRacesError;

    // Then insert new ones
    if (profile.targetRaces && profile.targetRaces.length > 0) {
      const targetRaceInserts: TargetRaceInsert[] = profile.targetRaces.map(tr => ({
        user_id: profile.id,
        distance: tr.distance,
        date: tr.date,
        target_time: tr.targetTime || null,
      }));

      const { error: insertTargetRacesError } = await supabase
        .from('target_races')
        .insert(targetRaceInserts);

      if (insertTargetRacesError) throw insertTargetRacesError;
    }
  } catch (error) {
    console.error('Error saving runner profile:', error);
    throw error;
  }
}

/**
 * Add a personal best
 */
export async function addPersonalBest(userId: string, pb: PersonalBest): Promise<void> {
  try {
    const pbInsert = personalBestToDbInsert(pb, userId);

    // Use upsert to handle the unique constraint
    const { error } = await supabase
      .from('personal_bests')
      .upsert(pbInsert, {
        onConflict: 'user_id,distance',
      });

    if (error) throw error;

    // Recalculate and update VDOT
    const { data: allPBs, error: fetchError } = await supabase
      .from('personal_bests')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) throw fetchError;

    if (allPBs && allPBs.length > 0) {
      const personalBests = allPBs.map(dbPersonalBestToPersonalBest);
      const vdot = getBestVDOT(personalBests);
      const estimatedVO2Max = estimateVO2Max(vdot);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          vdot,
          estimated_vo2_max: estimatedVO2Max,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;
    }
  } catch (error) {
    console.error('Error adding personal best:', error);
    throw error;
  }
}

/**
 * Delete a personal best
 */
export async function deletePersonalBest(
  userId: string,
  distance: PersonalBest['distance']
): Promise<void> {
  try {
    const { error } = await supabase
      .from('personal_bests')
      .delete()
      .eq('user_id', userId)
      .eq('distance', distance);

    if (error) throw error;

    // Recalculate VDOT
    const { data: allPBs, error: fetchError } = await supabase
      .from('personal_bests')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) throw fetchError;

    let vdot = null;
    let estimatedVO2Max = null;

    if (allPBs && allPBs.length > 0) {
      const personalBests = allPBs.map(dbPersonalBestToPersonalBest);
      vdot = getBestVDOT(personalBests);
      estimatedVO2Max = estimateVO2Max(vdot);
    }

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        vdot,
        estimated_vo2_max: estimatedVO2Max,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error deleting personal best:', error);
    throw error;
  }
}

/**
 * Initialize profile for new user
 */
export async function initializeRunnerProfile(userId: string, email: string): Promise<UserProfile> {
  try {
    // Check if profile already exists
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existing) {
      // Create initial profile
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          full_name: email,
        });

      if (error) throw error;
    }

    // Return default profile
    return {
      id: userId,
      name: email,
      personalBests: [],
    };
  } catch (error) {
    console.error('Error initializing runner profile:', error);
    throw error;
  }
}

/**
 * Check if username is available
 */
export async function checkUsernameAvailable(
  username: string,
  currentUserId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id')
    .ilike('username', username)
    .neq('id', currentUserId)
    .maybeSingle();

  if (error) throw error;
  return data === null; // true = available
}

/**
 * Update user username
 */
export async function updateUsername(
  userId: string,
  username: string
): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ username })
    .eq('id', userId);

  if (error) throw error;
}
