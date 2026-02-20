-- ============================================
-- ADD BIOMARKER FIELDS TO USER PROFILES
-- Enhanced health & training metrics for better personalization
-- ============================================

-- Add physical characteristics and biomarkers
alter table public.user_profiles
  -- Physical Metrics (optional for BMI calculation and training recommendations)
  add column if not exists height_cm integer,
  add column if not exists weight_kg numeric(5,2),

  -- Heart Rate Metrics (optional for HR-based training zones)
  add column if not exists resting_heart_rate_bpm integer,
  add column if not exists max_heart_rate_bpm integer,

  -- Running Experience
  add column if not exists longest_run_km numeric(6,2),

  -- Motivation & Goals (free text for personalized recommendations)
  add column if not exists motivation_text text,

  -- Injury History (array of text for training adaptations)
  add column if not exists injury_history text[];

-- Add constraints for data validation
-- Height: reasonable range 100-250 cm
alter table public.user_profiles
  add constraint check_height_range
  check (height_cm is null or (height_cm >= 100 and height_cm <= 250));

-- Weight: reasonable range 30-200 kg
alter table public.user_profiles
  add constraint check_weight_range
  check (weight_kg is null or (weight_kg >= 30 and weight_kg <= 200));

-- Resting HR: reasonable range 30-120 bpm
alter table public.user_profiles
  add constraint check_resting_hr_range
  check (resting_heart_rate_bpm is null or (resting_heart_rate_bpm >= 30 and resting_heart_rate_bpm <= 120));

-- Max HR: reasonable range 100-220 bpm
alter table public.user_profiles
  add constraint check_max_hr_range
  check (max_heart_rate_bpm is null or (max_heart_rate_bpm >= 100 and max_heart_rate_bpm <= 220));

-- Longest run: must be positive
alter table public.user_profiles
  add constraint check_longest_run_positive
  check (longest_run_km is null or longest_run_km > 0);

-- Ensure max HR is greater than resting HR if both are provided
alter table public.user_profiles
  add constraint check_hr_relationship
  check (
    max_heart_rate_bpm is null or
    resting_heart_rate_bpm is null or
    max_heart_rate_bpm > resting_heart_rate_bpm
  );

-- Comment on new columns for documentation
comment on column public.user_profiles.height_cm is 'User height in centimeters (optional, for BMI calculation)';
comment on column public.user_profiles.weight_kg is 'User weight in kilograms (optional, for BMI calculation)';
comment on column public.user_profiles.resting_heart_rate_bpm is 'Resting heart rate in beats per minute (optional, for HR-based training)';
comment on column public.user_profiles.max_heart_rate_bpm is 'Maximum heart rate in beats per minute (optional, for HR-based training)';
comment on column public.user_profiles.longest_run_km is 'Longest run distance in kilometers (for beginners without PBs)';
comment on column public.user_profiles.motivation_text is 'Free text describing user motivation and goals';
comment on column public.user_profiles.injury_history is 'Array of past injuries for training adaptations';
