-- supabase/migrations/20260318000001_add_username.sql

-- Add username column
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Auto-generate usernames for existing users:
-- lowercase(full_name, alphanum only) + 4-digit random suffix
UPDATE user_profiles
SET username = lower(
    regexp_replace(coalesce(full_name, 'user'), '[^a-zA-Z0-9]', '', 'g')
  ) || floor(random() * 9000 + 1000)::text
WHERE username IS NULL;

-- Ensure the column is always populated going forward
ALTER TABLE user_profiles ALTER COLUMN username SET NOT NULL;

-- Index for fast username lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles (username);
