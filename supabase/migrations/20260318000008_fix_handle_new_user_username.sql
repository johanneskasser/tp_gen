-- Fix handle_new_user trigger to generate username on signup
-- (needed because username is NOT NULL since migration 20260318000001)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_name TEXT;
  generated_username TEXT;
BEGIN
  -- Build a URL-safe base from full_name or email prefix
  base_name := lower(
    regexp_replace(
      coalesce(
        new.raw_user_meta_data->>'full_name',
        split_part(new.email, '@', 1)
      ),
      '[^a-zA-Z0-9]', '', 'g'
    )
  );

  -- Ensure base is non-empty
  IF base_name = '' THEN
    base_name := 'user';
  END IF;

  -- Append 4-digit random suffix
  generated_username := base_name || floor(random() * 9000 + 1000)::text;

  INSERT INTO public.user_profiles (id, full_name, avatar_url, username)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    generated_username
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
