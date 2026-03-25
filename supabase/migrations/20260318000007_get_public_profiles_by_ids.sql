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
