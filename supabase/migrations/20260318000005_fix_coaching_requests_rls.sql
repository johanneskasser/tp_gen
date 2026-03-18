-- Fix athlete_update_request_status policy to restrict column changes
-- Athletes should only be able to change status (to 'approved' or 'rejected')

DROP POLICY IF EXISTS "athlete_update_request_status" ON coaching_requests;

CREATE POLICY "athlete_update_request_status" ON coaching_requests
  FOR UPDATE USING (athlete_id = auth.uid())
  WITH CHECK (
    athlete_id = auth.uid()
    AND status IN ('approved', 'rejected')
  );

-- Prevent column tampering via trigger
CREATE OR REPLACE FUNCTION prevent_coaching_request_column_tampering()
RETURNS TRIGGER AS $$
BEGIN
  -- Athletes can only change status; all other columns must remain unchanged
  IF NEW.coach_id IS DISTINCT FROM OLD.coach_id THEN
    RAISE EXCEPTION 'Cannot modify coach_id';
  END IF;
  IF NEW.athlete_id IS DISTINCT FROM OLD.athlete_id THEN
    RAISE EXCEPTION 'Cannot modify athlete_id';
  END IF;
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Cannot modify created_at';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER coaching_request_protect_columns
BEFORE UPDATE ON coaching_requests
FOR EACH ROW EXECUTE FUNCTION prevent_coaching_request_column_tampering();
