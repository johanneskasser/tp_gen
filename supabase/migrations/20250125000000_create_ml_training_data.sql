-- Create training_data_points table for ML data collection
CREATE TABLE IF NOT EXISTS training_data_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Timestamp
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Context (stored as JSONB for flexibility)
  context JSONB NOT NULL,

  -- Suggestion that was shown
  suggestion JSONB NOT NULL,

  -- User action
  user_action TEXT NOT NULL CHECK (user_action IN ('accepted', 'modified', 'rejected', 'ignored')),

  -- Modifications made by user (if any)
  modifications JSONB,

  -- Outcome (filled in later when session is completed)
  outcome JSONB,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create training_patterns table for pattern recognition
CREATE TABLE IF NOT EXISTS training_patterns (
  id TEXT PRIMARY KEY,

  -- Pattern sequence (array of session types)
  sequence TEXT[] NOT NULL,

  -- Context hash for grouping similar contexts
  context_hash TEXT NOT NULL,

  -- How often this pattern appears
  frequency INTEGER NOT NULL DEFAULT 1,

  -- Success metrics
  success_metrics JSONB,

  -- Metadata about the pattern
  metadata JSONB NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_data_points_user_id ON training_data_points(user_id);
CREATE INDEX IF NOT EXISTS idx_training_data_points_timestamp ON training_data_points(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_training_data_points_user_action ON training_data_points(user_action);
CREATE INDEX IF NOT EXISTS idx_training_data_points_context ON training_data_points USING GIN(context);

CREATE INDEX IF NOT EXISTS idx_training_patterns_context_hash ON training_patterns(context_hash);
CREATE INDEX IF NOT EXISTS idx_training_patterns_frequency ON training_patterns(frequency DESC);
CREATE INDEX IF NOT EXISTS idx_training_patterns_sequence ON training_patterns USING GIN(sequence);

-- Enable Row Level Security
ALTER TABLE training_data_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_data_points
-- Users can only read their own data points
CREATE POLICY "Users can view own training data points"
  ON training_data_points
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own data points
CREATE POLICY "Users can insert own training data points"
  ON training_data_points
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own data points (for outcome updates)
CREATE POLICY "Users can update own training data points"
  ON training_data_points
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for training_patterns
-- Patterns are global (read by all authenticated users for recommendations)
CREATE POLICY "Authenticated users can view patterns"
  ON training_patterns
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update patterns (aggregated from data points)
-- This will be done via a backend function or cron job

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_training_data_points_updated_at
  BEFORE UPDATE ON training_data_points
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_patterns_updated_at
  BEFORE UPDATE ON training_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for ML export (aggregated statistics)
CREATE OR REPLACE VIEW ml_training_stats AS
SELECT
  user_id,
  COUNT(*) as total_data_points,
  COUNT(*) FILTER (WHERE user_action = 'accepted') as accepted_count,
  COUNT(*) FILTER (WHERE user_action = 'modified') as modified_count,
  COUNT(*) FILTER (WHERE user_action = 'rejected') as rejected_count,
  COUNT(*) FILTER (WHERE user_action = 'ignored') as ignored_count,
  ROUND(
    COUNT(*) FILTER (WHERE user_action = 'accepted')::NUMERIC / NULLIF(COUNT(*), 0),
    3
  ) as acceptance_rate,
  ROUND(
    COUNT(*) FILTER (WHERE user_action = 'modified')::NUMERIC / NULLIF(COUNT(*), 0),
    3
  ) as modification_rate,
  MIN(timestamp) as first_data_point,
  MAX(timestamp) as last_data_point
FROM training_data_points
GROUP BY user_id;

-- Grant access to the view
GRANT SELECT ON ml_training_stats TO authenticated;

-- Create function to get user-specific patterns
CREATE OR REPLACE FUNCTION get_recommended_patterns_for_context(
  context_hash_param TEXT,
  limit_param INTEGER DEFAULT 5
)
RETURNS TABLE (
  id TEXT,
  sequence TEXT[],
  frequency INTEGER,
  success_metrics JSONB,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.sequence,
    p.frequency,
    p.success_metrics,
    p.metadata
  FROM training_patterns p
  WHERE p.context_hash = context_hash_param
  ORDER BY p.frequency DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_recommended_patterns_for_context TO authenticated;

-- Add comment to tables for documentation
COMMENT ON TABLE training_data_points IS 'Stores ML training data for suggestion system - tracks what suggestions were shown and user actions';
COMMENT ON TABLE training_patterns IS 'Stores recognized training patterns for pattern-based recommendations';
COMMENT ON VIEW ml_training_stats IS 'Aggregated statistics about user interactions with suggestions for ML training';
