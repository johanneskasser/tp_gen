-- Ensure coaching RLS policies are in place.
-- Safe to re-run: drops before creating.

-- training_plans: coach INSERT
DROP POLICY IF EXISTS "coach_insert_coaching_plans" ON training_plans;
CREATE POLICY "coach_insert_coaching_plans" ON training_plans
  FOR INSERT WITH CHECK (
    coach_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM coaching_requests cr
      WHERE cr.coach_id = auth.uid()
        AND cr.athlete_id = training_plans.user_id
        AND cr.status = 'approved'
    )
  );

-- training_plans: coach UPDATE
DROP POLICY IF EXISTS "coach_update_coaching_plans" ON training_plans;
CREATE POLICY "coach_update_coaching_plans" ON training_plans
  FOR UPDATE USING (
    coach_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM coaching_requests cr
      WHERE cr.coach_id = auth.uid()
        AND cr.athlete_id = training_plans.user_id
        AND cr.status = 'approved'
    )
  );

-- user_profiles: combined self + coach read
DROP POLICY IF EXISTS "user_or_approved_coach_read_profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
CREATE POLICY "user_or_approved_coach_read_profile" ON user_profiles
  FOR SELECT USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM coaching_requests cr
      WHERE cr.coach_id = auth.uid()
        AND cr.athlete_id = user_profiles.id
        AND cr.status = 'approved'
    )
  );
