// src/types/coaching.ts

export type CoachingRequestStatus = 'pending' | 'approved' | 'rejected';
export type NotificationType = 'coaching_request' | 'coaching_plan_received';

export interface CoachingRequest {
  id: string;
  coach_id: string;
  athlete_id: string;
  status: CoachingRequestStatus;
  created_at: string;
  responded_at: string | null;
}

export interface CoachingRequestWithProfiles extends CoachingRequest {
  coach: PublicAthleteProfile;
  athlete: PublicAthleteProfile;
}

/** Minimal public profile shown in search results and notification payloads */
export interface PublicAthleteProfile {
  id: string;
  username: string;
  full_name: string | null;
}

export interface CoachingRequestNotificationPayload {
  request_id: string;
  coach: PublicAthleteProfile;
}

export interface CoachingPlanNotificationPayload {
  plan_id: string;
  plan_name: string;
  distance: string;
  weeks: number;
  coach: PublicAthleteProfile;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  payload: CoachingRequestNotificationPayload | CoachingPlanNotificationPayload;
  read: boolean;
  created_at: string;
}
