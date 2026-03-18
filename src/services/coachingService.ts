// src/services/coachingService.ts
import { supabase } from '../lib/supabase';
import {
  CoachingRequest,
  PublicAthleteProfile,
  AppNotification,
} from '../types/coaching';
import { TrainingZones } from '../types/userProfile';
import { calculateTrainingPacesFromVDOT, vdotPacesToTrainingZones } from '../expertSystem/vdotPaceCalculator';

// ─── Athlete Search ───────────────────────────────────────────────────────────

export async function searchAthleteByUsername(
  username: string
): Promise<PublicAthleteProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, username, full_name')
    .ilike('username', username.replace('@', ''))
    .maybeSingle();

  if (error) throw error;
  return data as PublicAthleteProfile | null;
}

// ─── Coaching Requests ────────────────────────────────────────────────────────

export async function sendCoachingRequest(athleteId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Delete any previous rejected request to allow re-requesting
  await supabase
    .from('coaching_requests')
    .delete()
    .eq('coach_id', user.id)
    .eq('athlete_id', athleteId)
    .eq('status', 'rejected');

  const { data: request, error } = await supabase
    .from('coaching_requests')
    .insert({ coach_id: user.id, athlete_id: athleteId })
    .select()
    .single();

  if (error) throw error;

  // Trigger email edge function (fire-and-forget, don't fail on email error)
  supabase.functions
    .invoke('send-coaching-request-email', { body: { requestId: request.id } })
    .catch((err) => console.error('Email send failed (non-fatal):', err));
}

export async function getOutgoingRequests(): Promise<
  (CoachingRequest & { athlete: PublicAthleteProfile })[]
> {
  const { data, error } = await supabase
    .from('coaching_requests')
    .select('*, athlete:user_profiles!athlete_id(id, username, full_name)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as unknown as (CoachingRequest & { athlete: PublicAthleteProfile })[];
}

export async function getApprovedAthletes(): Promise<
  (CoachingRequest & { athlete: PublicAthleteProfile })[]
> {
  const { data, error } = await supabase
    .from('coaching_requests')
    .select('*, athlete:user_profiles!athlete_id(id, username, full_name)')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as unknown as (CoachingRequest & { athlete: PublicAthleteProfile })[];
}

export async function respondToRequest(
  requestId: string,
  status: 'approved' | 'rejected'
): Promise<void> {
  const { error } = await supabase
    .from('coaching_requests')
    .update({ status })
    .eq('id', requestId);

  if (error) throw error;
}

// ─── Athlete Training Zones ───────────────────────────────────────────────────

export async function getAthleteTrainingZones(
  athleteId: string
): Promise<TrainingZones | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('vdot')
    .eq('id', athleteId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.vdot) return null;

  const paces = calculateTrainingPacesFromVDOT(data.vdot);
  return vdotPacesToTrainingZones(paces);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data || []) as unknown as AppNotification[];
}

export async function getUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('read', false);

  if (error) throw error;
  return count || 0;
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .in('id', ids);

  if (error) throw error;
}
