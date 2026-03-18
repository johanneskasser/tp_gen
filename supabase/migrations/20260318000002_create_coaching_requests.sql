-- supabase/migrations/20260318000002_create_coaching_requests.sql

CREATE TABLE IF NOT EXISTS coaching_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  athlete_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status       TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE(coach_id, athlete_id)
);

-- Auto-set responded_at when status changes from pending
CREATE OR REPLACE FUNCTION set_coaching_request_responded_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status <> 'pending' AND OLD.status = 'pending' THEN
    NEW.responded_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER coaching_request_responded_at_trigger
BEFORE UPDATE ON coaching_requests
FOR EACH ROW EXECUTE FUNCTION set_coaching_request_responded_at();

-- Enable RLS
ALTER TABLE coaching_requests ENABLE ROW LEVEL SECURITY;

-- Coach: read and create own requests
CREATE POLICY "coach_select_own_requests" ON coaching_requests
  FOR SELECT USING (coach_id = auth.uid());

CREATE POLICY "coach_insert_requests" ON coaching_requests
  FOR INSERT WITH CHECK (coach_id = auth.uid());

-- Coach: delete own rejected/pending requests (for re-request flow)
CREATE POLICY "coach_delete_own_requests" ON coaching_requests
  FOR DELETE USING (coach_id = auth.uid());

-- Athlete: read incoming requests
CREATE POLICY "athlete_select_incoming_requests" ON coaching_requests
  FOR SELECT USING (athlete_id = auth.uid());

-- Athlete: update status of incoming requests
CREATE POLICY "athlete_update_request_status" ON coaching_requests
  FOR UPDATE USING (athlete_id = auth.uid())
  WITH CHECK (athlete_id = auth.uid());
