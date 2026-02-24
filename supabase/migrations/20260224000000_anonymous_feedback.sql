-- Migration: Support anonymous feedback submissions
-- Created: 2026-02-24
-- Description: Make user_id nullable, add anonymous fields (name, email, ip),
--              add IP-based rate limiting, update "once ever" submission logic

-- 1. Make user_id nullable (allow anonymous inserts)
ALTER TABLE public.user_feedback
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add anonymous submission fields
ALTER TABLE public.user_feedback
  ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS anonymous_name text,
  ADD COLUMN IF NOT EXISTS anonymous_email text,
  ADD COLUMN IF NOT EXISTS ip_address text;

-- 3. Index for IP-based rate limiting
CREATE INDEX IF NOT EXISTS idx_user_feedback_ip_address
  ON public.user_feedback(ip_address)
  WHERE ip_address IS NOT NULL;

-- 4. RLS: Allow anonymous inserts (no auth session, is_anonymous flag set)
CREATE POLICY "Anonymous users can create feedback"
  ON public.user_feedback
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL
    AND is_anonymous = true
    AND user_id IS NULL
  );

-- 5. Replace the 24h rate limit with "once ever" per user
CREATE OR REPLACE FUNCTION public.check_feedback_rate_limit(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Returns true  → user CAN submit (has never submitted)
  -- Returns false → user CANNOT submit (already submitted)
  RETURN NOT EXISTS (
    SELECT 1
    FROM public.user_feedback
    WHERE user_id = user_uuid
  );
END;
$$;

COMMENT ON FUNCTION public.check_feedback_rate_limit IS
  'Returns true if user has never submitted feedback (once-ever limit per user_id)';

-- 6. New function: IP-based once-ever rate limit for anonymous submissions
CREATE OR REPLACE FUNCTION public.check_feedback_rate_limit_by_ip(client_ip text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Returns true  → IP CAN submit (no previous anon submission from this IP)
  -- Returns false → IP CANNOT submit (already submitted anonymously from this IP)
  RETURN NOT EXISTS (
    SELECT 1
    FROM public.user_feedback
    WHERE ip_address = client_ip
      AND is_anonymous = true
  );
END;
$$;

COMMENT ON FUNCTION public.check_feedback_rate_limit_by_ip IS
  'Returns true if the given IP address has not yet submitted anonymous feedback';
