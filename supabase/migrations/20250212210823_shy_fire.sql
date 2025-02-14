/*
  # Add plan-specific fields to files table

  1. Changes
    - Add plan_type column to files table
    - Add row_count column to files table
    - Add expiration_at column for Freemium users
    - Add check constraint for file size based on plan
    - Add trigger to set expiration for Freemium users

  2. Security
    - Maintains existing RLS policies
    - Adds plan-specific constraints
*/

-- Add plan type enum if not exists
DO $$ BEGIN
  CREATE TYPE user_plan_type AS ENUM ('freemium', 'core', 'premium');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to files table
ALTER TABLE files
ADD COLUMN IF NOT EXISTS plan_type user_plan_type NOT NULL DEFAULT 'freemium',
ADD COLUMN IF NOT EXISTS row_count integer,
ADD COLUMN IF NOT EXISTS expiration_at timestamptz;

-- Add check constraint for file size based on plan
ALTER TABLE files
ADD CONSTRAINT check_file_size_limit
CHECK (
  (plan_type = 'freemium' AND size_bytes <= 100 * 1024 * 1024) OR  -- 100MB for freemium
  (plan_type = 'core' AND size_bytes <= 500 * 1024 * 1024) OR      -- 500MB for core
  (plan_type = 'premium')                                           -- No limit for premium
);

-- Create function to set expiration for freemium files
CREATE OR REPLACE FUNCTION set_freemium_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan_type = 'freemium' THEN
    NEW.expiration_at := NOW() + INTERVAL '12 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for setting expiration
CREATE TRIGGER set_freemium_expiration_trigger
  BEFORE INSERT ON files
  FOR EACH ROW
  EXECUTE FUNCTION set_freemium_expiration();

-- Create index for expiration lookup
CREATE INDEX IF NOT EXISTS idx_files_expiration ON files(expiration_at)
  WHERE expiration_at IS NOT NULL;

-- Create function to clean up expired files
CREATE OR REPLACE FUNCTION cleanup_expired_files()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE files
  SET status = 'deleted'
  WHERE expiration_at < NOW()
  AND status != 'deleted';
END;
$$;