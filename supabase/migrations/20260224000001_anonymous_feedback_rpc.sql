-- Migration: Anonymous feedback via SECURITY DEFINER function
-- Created: 2026-02-24
-- Problem: anon role cannot INSERT directly into user_feedback due to RLS
-- Solution: SECURITY DEFINER function that runs with elevated privileges,
--           performs rate limiting internally, and is safely callable by anon

-- Drop the broken RLS policy (we no longer need it; the function handles security)
DROP POLICY IF EXISTS "Anonymous users can create feedback" ON public.user_feedback;

-- Create the anonymous feedback submission function
CREATE OR REPLACE FUNCTION public.submit_anonymous_feedback(
  p_overall_rating      integer DEFAULT NULL,
  p_features_rating     integer DEFAULT NULL,
  p_editor_rating       integer DEFAULT NULL,
  p_marketplace_rating  integer DEFAULT NULL,
  p_individual_feedback text    DEFAULT NULL,
  p_feature_suggestion  text    DEFAULT NULL,
  p_anonymous_name      text    DEFAULT NULL,
  p_anonymous_email     text    DEFAULT NULL,
  p_ip_address          text    DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_feedback_id uuid;
  v_can_submit  boolean;
BEGIN
  -- Validate: at least one field must be filled
  IF p_overall_rating IS NULL
     AND p_features_rating IS NULL
     AND p_editor_rating IS NULL
     AND p_marketplace_rating IS NULL
     AND (p_individual_feedback IS NULL OR trim(p_individual_feedback) = '')
     AND (p_feature_suggestion IS NULL OR trim(p_feature_suggestion) = '')
  THEN
    RETURN json_build_object('success', false, 'error', 'Bitte fülle mindestens ein Feld aus.');
  END IF;

  -- IP-based once-ever rate limit
  IF p_ip_address IS NOT NULL AND p_ip_address <> '' THEN
    SELECT check_feedback_rate_limit_by_ip(p_ip_address) INTO v_can_submit;
    IF NOT v_can_submit THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Von dieser IP-Adresse wurde bereits Feedback eingereicht. Danke!'
      );
    END IF;
  END IF;

  -- Insert the anonymous feedback row
  INSERT INTO public.user_feedback (
    user_id,
    is_anonymous,
    anonymous_name,
    anonymous_email,
    ip_address,
    overall_rating,
    features_rating,
    editor_rating,
    marketplace_rating,
    individual_feedback,
    feature_suggestion
  ) VALUES (
    NULL,
    true,
    nullif(trim(coalesce(p_anonymous_name, '')), ''),
    nullif(trim(coalesce(p_anonymous_email, '')), ''),
    nullif(trim(coalesce(p_ip_address, '')), ''),
    p_overall_rating,
    p_features_rating,
    p_editor_rating,
    p_marketplace_rating,
    nullif(trim(coalesce(p_individual_feedback, '')), ''),
    nullif(trim(coalesce(p_feature_suggestion, '')), '')
  )
  RETURNING id INTO v_feedback_id;

  RETURN json_build_object('success', true, 'id', v_feedback_id);
END;
$$;

COMMENT ON FUNCTION public.submit_anonymous_feedback IS
  'Allows unauthenticated users to submit feedback once per IP address. '
  'Runs as SECURITY DEFINER to bypass RLS safely.';

-- Grant execute to the anon role (unauthenticated Supabase users)
GRANT EXECUTE ON FUNCTION public.submit_anonymous_feedback TO anon;
