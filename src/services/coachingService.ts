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

export async function searchAthletesByUsernamePrefix(
  prefix: string
): Promise<PublicAthleteProfile[]> {
  const { data, error } = await supabase
    .rpc('search_athletes_by_username', { prefix: prefix.replace('@', '') });

  if (error) throw error;
  return (data || []) as PublicAthleteProfile[];
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

async function attachAthleteProfiles(
  requests: CoachingRequest[]
): Promise<(CoachingRequest & { athlete: PublicAthleteProfile })[]> {
  if (requests.length === 0) return [];

  const athleteIds = [...new Set(requests.map((r) => r.athlete_id))];
  const { data: profiles, error: profileError } = await supabase
    .rpc('get_public_profiles_by_ids', { user_ids: athleteIds });

  if (profileError) throw profileError;

  const profileMap = new Map((profiles || []).map((p: PublicAthleteProfile) => [p.id, p]));
  return requests.map((r) => ({
    ...r,
    athlete: (profileMap.get(r.athlete_id) ?? {
      id: r.athlete_id,
      username: 'unknown',
      full_name: null,
    }) as PublicAthleteProfile,
  }));
}

export async function getOutgoingRequests(): Promise<
  (CoachingRequest & { athlete: PublicAthleteProfile })[]
> {
  const { data, error } = await supabase
    .from('coaching_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return attachAthleteProfiles((data || []) as CoachingRequest[]);
}

export async function getApprovedAthletes(): Promise<
  (CoachingRequest & { athlete: PublicAthleteProfile })[]
> {
  const { data, error } = await supabase
    .from('coaching_requests')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return attachAthleteProfiles((data || []) as CoachingRequest[]);
}

export async function respondToRequest(
  requestId: string,
  status: 'approved' | 'rejected'
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase
    .from('coaching_requests')
    .update({ status })
    .eq('id', requestId)
    .eq('athlete_id', user.id);

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
  const notifications = (data || []) as unknown as AppNotification[];

  // Enrich coaching_request notifications with current request status from DB
  const requestIds = notifications
    .filter((n) => n.type === 'coaching_request')
    .map((n) => (n.payload as CoachingRequestNotificationPayload).request_id);

  if (requestIds.length === 0) return notifications;

  const { data: requests } = await supabase
    .from('coaching_requests')
    .select('id, status')
    .in('id', requestIds);

  const statusMap = new Map((requests || []).map((r) => [r.id, r.status]));

  return notifications.map((n) => {
    if (n.type !== 'coaching_request') return n;
    const requestId = (n.payload as CoachingRequestNotificationPayload).request_id;
    return { ...n, request_status: statusMap.get(requestId) ?? 'pending' };
  });
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
