-- Search athletes by username prefix (public-safe: returns only id, username, full_name)
-- Uses SECURITY DEFINER to bypass RLS, but only exposes non-sensitive fields.
-- Only authenticated users can call this function.

CREATE OR REPLACE FUNCTION search_athletes_by_username(prefix TEXT)
RETURNS TABLE(id UUID, username TEXT, full_name TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT up.id, up.username, up.full_name
  FROM user_profiles up
  WHERE up.username ILIKE prefix || '%'
    AND up.id != auth.uid()
  ORDER BY up.username
  LIMIT 8;
$$;

REVOKE ALL ON FUNCTION search_athletes_by_username(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION search_athletes_by_username(TEXT) TO authenticated;

-- Fetch public profiles by a list of user IDs (used by coach to resolve athlete names)
-- Only exposes non-sensitive fields: id, username, full_name.

CREATE OR REPLACE FUNCTION get_public_profiles_by_ids(user_ids UUID[])
RETURNS TABLE(id UUID, username TEXT, full_name TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT up.id, up.username, up.full_name
  FROM user_profiles up
  WHERE up.id = ANY(user_ids);
$$;

REVOKE ALL ON FUNCTION get_public_profiles_by_ids(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_public_profiles_by_ids(UUID[]) TO authenticated;
