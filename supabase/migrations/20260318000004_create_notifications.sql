-- supabase/migrations/20260318000004_create_notifications.sql

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('coaching_request', 'coaching_plan_received')),
  payload     JSONB NOT NULL DEFAULT '{}',
  read        BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (user_id, read) WHERE read = false;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- User reads and updates only own notifications
CREATE POLICY "user_select_own_notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_update_own_notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- System inserts (from edge functions using service role) -- no RLS restriction on INSERT
-- for service_role; this is fine as edge functions validate before inserting.
