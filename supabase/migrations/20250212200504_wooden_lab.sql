/*
  # Create rate limits table

  1. New Tables
    - `rate_limits`
      - `key` (text, primary key) - Unique identifier for the rate limit (e.g., "upload_rate_limit:user_id")
      - `count` (integer) - Number of requests in the current window
      - `timestamp` (bigint) - Start time of the current window in milliseconds
      - `created_at` (timestamptz) - When the rate limit record was created
      - `updated_at` (timestamptz) - When the rate limit record was last updated

  2. Security
    - Enable RLS on `rate_limits` table
    - Add policy for authenticated users to read/write their own rate limits
*/

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  timestamp bigint NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can manage their own rate limits"
  ON rate_limits
  FOR ALL
  USING (
    key LIKE 'upload_rate_limit:' || auth.uid() || '%'
  );

-- Create function to update updated_at on change
CREATE OR REPLACE FUNCTION update_rate_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
CREATE TRIGGER update_rate_limits_timestamp
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_rate_limits_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_rate_limits_key ON rate_limits(key);