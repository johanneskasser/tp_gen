export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  onboarding_completed?: boolean | null;

  // Biomarker fields
  age?: number | null;
  gender?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  resting_heart_rate_bpm?: number | null;
  max_heart_rate_bpm?: number | null;
  motivation_text?: string | null;

  // Running metrics
  vdot?: number | null;
  weekly_km_base?: number | null;
  years_running?: number | null;
  longest_run_km?: number | null;
  estimated_vo2_max?: number | null;
}
