/*
  # Add Usage Tracking

  1. New Tables
    - `usage_tracking`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `action_type` (text)
      - `records_processed` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `usage_tracking` table
    - Add policies for authenticated users to:
      - Insert their own usage records
      - Read their own usage history
*/

-- Create usage tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  records_processed integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for usage tracking
CREATE POLICY "Users can insert their own usage records"
  ON usage_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own usage history"
  ON usage_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_created_at ON usage_tracking(created_at);
CREATE INDEX idx_usage_tracking_action_type ON usage_tracking(action_type);

-- Create function to get user's total records processed
CREATE OR REPLACE FUNCTION get_user_total_records(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(records_processed), 0)
    FROM usage_tracking
    WHERE user_id = user_uuid
    AND created_at >= date_trunc('month', CURRENT_DATE)
  );
END;
$$;