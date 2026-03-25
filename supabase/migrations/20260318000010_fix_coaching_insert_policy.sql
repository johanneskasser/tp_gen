-- SECURITY DEFINER helper: bypasses coaching_requests RLS inside the training_plans policy.
-- Checks whether auth.uid() has an approved coaching relationship with p_athlete_id.
CREATE OR REPLACE FUNCTION coach_has_approved_athlete(p_athlete_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM coaching_requests
    WHERE coach_id = auth.uid()
      AND athlete_id = p_athlete_id
      AND status = 'approved'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Rebuild the two coaching policies to use the helper function
DROP POLICY IF EXISTS "coach_insert_coaching_plans" ON training_plans;
CREATE POLICY "coach_insert_coaching_plans" ON training_plans
  FOR INSERT WITH CHECK (
    coach_id = auth.uid() AND
    coach_has_approved_athlete(training_plans.user_id)
  );

DROP POLICY IF EXISTS "coach_update_coaching_plans" ON training_plans;
CREATE POLICY "coach_update_coaching_plans" ON training_plans
  FOR UPDATE USING (
    coach_id = auth.uid() AND
    coach_has_approved_athlete(training_plans.user_id)
  );
