/*
  # Data Retention Implementation

  1. New Tables
    - `deleted_files` - Stores soft-deleted files for potential restoration
      - `id` (uuid, primary key)
      - `original_file_id` (uuid) - Reference to original file
      - `user_id` (uuid) - Owner of the file
      - `file_path` (text) - Path in storage
      - `original_name` (text) - Original filename
      - `metadata` (jsonb) - Original file metadata
      - `deleted_at` (timestamptz) - When the file was deleted
      - `expires_at` (timestamptz) - When the file will be permanently deleted
      - `restored` (boolean) - Whether file was restored

  2. Changes
    - Add `soft_deleted` column to `files` table
    - Add `permanent_deletion` column to `files` table

  3. Security
    - Enable RLS on `deleted_files`
    - Add policies for viewing and restoring deleted files
*/

-- Add soft delete columns to files table
ALTER TABLE files
ADD COLUMN soft_deleted boolean NOT NULL DEFAULT false,
ADD COLUMN permanent_deletion timestamptz;

-- Create deleted_files table
CREATE TABLE deleted_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_file_id uuid NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  original_name text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  deleted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  restored boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_deleted_files_user_id ON deleted_files(user_id);
CREATE INDEX idx_deleted_files_expires_at ON deleted_files(expires_at);
CREATE INDEX idx_deleted_files_original_file ON deleted_files(original_file_id);
CREATE INDEX idx_files_soft_deleted ON files(soft_deleted);
CREATE INDEX idx_files_permanent_deletion ON files(permanent_deletion);

-- Enable RLS
ALTER TABLE deleted_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own deleted files"
  ON deleted_files
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create function to soft delete a file
CREATE OR REPLACE FUNCTION soft_delete_file(
  p_file_id uuid,
  p_user_id uuid,
  p_retention_days integer DEFAULT 90
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_file_id uuid;
  v_file record;
BEGIN
  -- Get file details
  SELECT * INTO v_file
  FROM files
  WHERE id = p_file_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'File not found or access denied';
  END IF;

  -- Create deleted file record
  INSERT INTO deleted_files (
    original_file_id,
    user_id,
    file_path,
    original_name,
    metadata,
    expires_at
  )
  VALUES (
    v_file.id,
    v_file.user_id,
    v_file.file_path,
    v_file.original_name,
    jsonb_build_object(
      'size_bytes', v_file.size_bytes,
      'mime_type', v_file.mime_type,
      'row_count', v_file.row_count,
      'plan_type', v_file.plan_type
    ),
    now() + (p_retention_days || ' days')::interval
  )
  RETURNING id INTO v_deleted_file_id;

  -- Mark original file as soft deleted
  UPDATE files
  SET 
    soft_deleted = true,
    permanent_deletion = now() + (p_retention_days || ' days')::interval
  WHERE id = p_file_id;

  -- Add audit log
  PERFORM add_audit_log(
    p_user_id,
    'file_deleted'::audit_action_type,
    jsonb_build_object(
      'file_id', p_file_id,
      'deleted_file_id', v_deleted_file_id,
      'retention_days', p_retention_days
    )
  );

  RETURN v_deleted_file_id;
END;
$$;

-- Create function to restore a deleted file
CREATE OR REPLACE FUNCTION restore_deleted_file(
  p_deleted_file_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_file record;
BEGIN
  -- Get deleted file details
  SELECT * INTO v_deleted_file
  FROM deleted_files
  WHERE id = p_deleted_file_id 
    AND user_id = p_user_id
    AND NOT restored
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deleted file not found, already restored, or expired';
  END IF;

  -- Mark file as restored
  UPDATE deleted_files
  SET restored = true
  WHERE id = p_deleted_file_id;

  -- Restore original file
  UPDATE files
  SET 
    soft_deleted = false,
    permanent_deletion = NULL
  WHERE id = v_deleted_file.original_file_id;

  -- Add audit log
  PERFORM add_audit_log(
    p_user_id,
    'file_restored'::audit_action_type,
    jsonb_build_object(
      'deleted_file_id', p_deleted_file_id,
      'original_file_id', v_deleted_file.original_file_id
    )
  );

  RETURN true;
END;
$$;

-- Create function to permanently delete expired files
CREATE OR REPLACE FUNCTION cleanup_expired_files()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Get files to delete
  UPDATE files
  SET status = 'deleted'
  WHERE soft_deleted = true
    AND permanent_deletion < now()
    AND status != 'deleted';

  -- Mark deleted files as expired
  UPDATE deleted_files
  SET restored = true
  WHERE expires_at < now()
    AND NOT restored;
END;
$$;