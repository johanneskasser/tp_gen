-- Add is_active column to training_plans
-- Only one plan can be active per user at a time

-- Add the column
ALTER TABLE training_plans
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster queries
CREATE INDEX idx_training_plans_user_active ON training_plans(user_id, is_active) WHERE is_active = true;

-- Add unique constraint to ensure only one active plan per user
CREATE UNIQUE INDEX idx_one_active_plan_per_user ON training_plans(user_id) WHERE is_active = true;

-- Add comment
COMMENT ON COLUMN training_plans.is_active IS 'Whether this plan is the user''s currently active training plan. Only one plan can be active per user.';

-- Function to set a plan as active (deactivates all other plans for that user)
CREATE OR REPLACE FUNCTION set_active_plan(plan_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  plan_user_id UUID;
BEGIN
  -- Get the user_id of the plan
  SELECT user_id INTO plan_user_id
  FROM training_plans
  WHERE id = plan_uuid;

  -- Ensure user can only set their own plans as active
  IF plan_user_id != auth.uid() THEN
    RAISE EXCEPTION 'You can only set your own plans as active';
  END IF;

  -- Deactivate all plans for this user
  UPDATE training_plans
  SET is_active = false
  WHERE user_id = plan_user_id;

  -- Activate the specified plan
  UPDATE training_plans
  SET is_active = true
  WHERE id = plan_uuid;
END;
$$;

-- Function to toggle active status
CREATE OR REPLACE FUNCTION toggle_active_plan(plan_uuid UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  plan_user_id UUID;
  current_status BOOLEAN;
  new_status BOOLEAN;
BEGIN
  -- Get the user_id and current status
  SELECT user_id, is_active INTO plan_user_id, current_status
  FROM training_plans
  WHERE id = plan_uuid;

  -- Ensure user can only toggle their own plans
  IF plan_user_id != auth.uid() THEN
    RAISE EXCEPTION 'You can only toggle your own plans';
  END IF;

  -- If currently active, deactivate it
  IF current_status THEN
    UPDATE training_plans
    SET is_active = false
    WHERE id = plan_uuid;
    new_status := false;
  ELSE
    -- If not active, deactivate all other plans and activate this one
    UPDATE training_plans
    SET is_active = false
    WHERE user_id = plan_user_id;

    UPDATE training_plans
    SET is_active = true
    WHERE id = plan_uuid;
    new_status := true;
  END IF;

  RETURN new_status;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION set_active_plan TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_active_plan TO authenticated;
