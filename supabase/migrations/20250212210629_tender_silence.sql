/*
  # Audit Logs System

  1. New Tables
    - `audit_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `action_type` (enum)
      - `metadata` (jsonb)
      - `ip_address` (text)
      - `user_agent` (text)
      - `created_at` (timestamptz)

  2. Indexes
    - `user_id` for quick user activity lookups
    - `action_type` for filtering by action type
    - `created_at` for time-based queries
    - Composite index (user_id, action_type) for common filtering patterns

  3. Security
    - RLS enabled
    - Read-only policies (no updates/deletes allowed)
    - Only admins can view all logs
    - Users can only view their own logs
*/

-- Create audit action type enum
CREATE TYPE audit_action_type AS ENUM (
  -- User actions
  'user_login',
  'user_logout',
  'user_registered',
  'user_deleted',
  'password_changed',
  'profile_updated',
  -- File actions
  'file_uploaded',
  'file_deleted',
  'file_downloaded',
  'file_processed',
  -- Job actions
  'job_started',
  'job_completed',
  'job_failed',
  'job_cancelled',
  -- Settings actions
  'settings_updated',
  'api_key_generated',
  'api_key_revoked'
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type audit_action_type NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action_type);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    -- Allow admins to view all logs
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create policy for inserting logs
CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (true);  -- Allow inserts from trusted backend contexts

-- Create helper function to add audit log
CREATE OR REPLACE FUNCTION add_audit_log(
  p_user_id uuid,
  p_action_type audit_action_type,
  p_metadata jsonb DEFAULT '{}',
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action_type,
    metadata,
    ip_address,
    user_agent
  )
  VALUES (
    p_user_id,
    p_action_type,
    p_metadata,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;