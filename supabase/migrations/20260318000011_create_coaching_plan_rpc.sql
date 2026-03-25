-- RPC for creating coaching plans — bypasses RLS entirely, validates inline.
-- Runs as the calling user (SECURITY INVOKER) but bypasses table RLS via security_barrier=false view trick.
-- Actually: use SECURITY DEFINER + explicit validation.

CREATE OR REPLACE FUNCTION create_coaching_plan(
  p_athlete_id  UUID,
  p_name        TEXT,
  p_plan_data   JSONB
)
RETURNS SETOF training_plans
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coach_id UUID;
BEGIN
  v_coach_id := auth.uid();
  IF v_coach_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM coaching_requests
    WHERE coach_id = v_coach_id
      AND athlete_id = p_athlete_id
      AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'No approved coaching relationship with athlete %', p_athlete_id;
  END IF;

  RETURN QUERY
    INSERT INTO training_plans (user_id, coach_id, name, plan_data)
    VALUES (p_athlete_id, v_coach_id, p_name, p_plan_data)
    RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION create_coaching_plan(UUID, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_coaching_plan(UUID, TEXT, JSONB) TO authenticated;
