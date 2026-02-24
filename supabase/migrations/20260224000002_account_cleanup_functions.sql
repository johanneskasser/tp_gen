-- Migration: Automatic account cleanup for inactive users
-- Created: 2026-02-24
-- Policy: warn at 11 months inactivity, delete at 12 months inactivity
-- Uses last_sign_in_at from auth.users as activity indicator

-- 1. Track whether a warning email has been sent to a user
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS deletion_warning_sent_at timestamptz;

COMMENT ON COLUMN public.user_profiles.deletion_warning_sent_at IS
  'Timestamp when the 30-day inactivity deletion warning email was sent; NULL = not yet warned';

-- 2. Helper: find users to warn (inactive 11–12 months, warning not yet sent)
CREATE OR REPLACE FUNCTION public.get_users_for_inactivity_warning(
  warning_cutoff timestamptz,  -- e.g. NOW() - INTERVAL '11 months'
  delete_cutoff  timestamptz   -- e.g. NOW() - INTERVAL '12 months'
)
RETURNS TABLE(id uuid, email text, full_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    au.id,
    au.email,
    COALESCE(up.full_name, split_part(au.email, '@', 1)) AS full_name
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON up.id = au.id
  WHERE
    -- Inactive for at least 11 months (use last sign-in, fall back to created_at)
    COALESCE(au.last_sign_in_at, au.created_at) <= warning_cutoff
    -- But not yet 12 months (those are handled by deletion)
    AND COALESCE(au.last_sign_in_at, au.created_at) > delete_cutoff
    -- Warning not yet sent
    AND up.deletion_warning_sent_at IS NULL
    -- Only real (confirmed, non-anonymous) accounts with an email
    AND au.email IS NOT NULL
    AND au.confirmed_at IS NOT NULL;
$$;

COMMENT ON FUNCTION public.get_users_for_inactivity_warning IS
  'Returns users inactive for 11–12 months who have not yet received a deletion warning';

-- 3. Helper: find users ready for deletion (inactive 12+ months)
CREATE OR REPLACE FUNCTION public.get_users_for_deletion(
  delete_cutoff timestamptz  -- e.g. NOW() - INTERVAL '12 months'
)
RETURNS TABLE(id uuid, email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT au.id, au.email
  FROM auth.users au
  WHERE
    COALESCE(au.last_sign_in_at, au.created_at) <= delete_cutoff
    AND au.email IS NOT NULL
    AND au.confirmed_at IS NOT NULL;
$$;

COMMENT ON FUNCTION public.get_users_for_deletion IS
  'Returns users inactive for 12+ months who should be automatically deleted';

-- 4. Mark warning as sent (called from Edge Function after email is dispatched)
CREATE OR REPLACE FUNCTION public.mark_deletion_warning_sent(user_uuid uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.user_profiles
  SET deletion_warning_sent_at = NOW()
  WHERE id = user_uuid;
$$;

COMMENT ON FUNCTION public.mark_deletion_warning_sent IS
  'Records the timestamp when the inactivity deletion warning was emailed to a user';
