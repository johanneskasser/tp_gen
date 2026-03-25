-- Allow coaches to SELECT plans they created
CREATE POLICY "coach_select_coaching_plans" ON training_plans
  FOR SELECT USING (coach_id = auth.uid());
