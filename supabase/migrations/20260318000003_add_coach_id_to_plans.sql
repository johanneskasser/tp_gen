-- supabase/migrations/20260318000003_add_coach_id_to_plans.sql

-- Add coach_id to training_plans
ALTER TABLE training_plans ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for coach plan queries
CREATE INDEX IF NOT EXISTS idx_training_plans_coach_id ON training_plans (coach_id) WHERE coach_id IS NOT NULL;

-- Coach can insert a plan for an athlete only if approved relationship exists
CREATE POLICY "coach_insert_coaching_plans" ON training_plans
  FOR INSERT WITH CHECK (
    coach_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM coaching_requests
      WHERE coach_id = auth.uid()
        AND athlete_id = training_plans.user_id
        AND status = 'approved'
    )
  );

-- Coach can update a coaching plan only while relationship is still approved
CREATE POLICY "coach_update_coaching_plans" ON training_plans
  FOR UPDATE USING (
    coach_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM coaching_requests
      WHERE coach_id = auth.uid()
        AND athlete_id = training_plans.user_id
        AND status = 'approved'
    )
  );

-- Update user_profiles RLS: replace ALL existing SELECT policies with a single
-- restrictive one that allows self-read OR approved coach read.
-- IMPORTANT: The existing DB has TWO select policies:
--   "Users can view own profile" (id = auth.uid())
--   "Users can view all profiles" (USING (true)) -- this MUST be dropped
-- Drop both before creating the new combined policy:
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;

-- Recreate with coaching extension:
CREATE POLICY "user_or_approved_coach_read_profile" ON user_profiles
  FOR SELECT USING (
    id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM coaching_requests
      WHERE coach_id = auth.uid()
        AND athlete_id = user_profiles.id
        AND status = 'approved'
    )
  );
