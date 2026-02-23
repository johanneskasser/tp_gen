-- Set passwords for Supabase service roles
-- This runs automatically on first DB initialization
-- If the DB already exists, run manually:
--   docker exec -i tp-gen-db psql -U supabase_admin -h 127.0.0.1 -d postgres < docker/db/set-service-passwords.sql
-- (Replace REPLACE_WITH_POSTGRES_PASSWORD with the POSTGRES_PASSWORD from .env)

ALTER USER authenticator          WITH PASSWORD 'REPLACE_WITH_POSTGRES_PASSWORD';
ALTER USER supabase_auth_admin    WITH PASSWORD 'REPLACE_WITH_POSTGRES_PASSWORD';
ALTER USER supabase_storage_admin WITH PASSWORD 'REPLACE_WITH_POSTGRES_PASSWORD';
