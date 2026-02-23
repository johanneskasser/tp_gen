-- ============================================
-- ADD MISSING USER PROFILE FIELDS
-- Columns expected by frontend but never migrated
-- ============================================

alter table public.user_profiles
  add column if not exists age integer,
  add column if not exists gender text,
  add column if not exists onboarding_completed boolean default false,
  add column if not exists vdot numeric(5,2),
  add column if not exists estimated_vo2_max numeric(5,2),
  add column if not exists available_time_per_week integer,
  add column if not exists preferred_training_days integer[],
  add column if not exists weekly_km_base numeric(6,2),
  add column if not exists years_running integer;

-- Constraints (using DO block for idempotency)
do $$ begin
  alter table public.user_profiles
    add constraint check_age_range
      check (age is null or (age >= 10 and age <= 120));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.user_profiles
    add constraint check_gender_values
      check (gender is null or gender in ('male', 'female', 'other'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.user_profiles
    add constraint check_years_running_positive
      check (years_running is null or years_running >= 0);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.user_profiles
    add constraint check_available_time_positive
      check (available_time_per_week is null or available_time_per_week > 0);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.user_profiles
    add constraint check_weekly_km_positive
      check (weekly_km_base is null or weekly_km_base > 0);
exception when duplicate_object then null;
end $$;
