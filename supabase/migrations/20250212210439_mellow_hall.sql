/*
  # File Management System Tables

  1. New Tables
    - `files`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `file_path` (text, unique)
      - `original_name` (text)
      - `size_bytes` (bigint)
      - `mime_type` (text)
      - `status` (enum)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `cleaning_jobs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `file_id` (uuid, foreign key to files)
      - `status` (enum)
      - `settings` (jsonb)
      - `results` (jsonb)
      - `started_at` (timestamptz)
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `usage_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `file_id` (uuid, foreign key to files)
      - `action` (text)
      - `details` (jsonb)
      - `created_at` (timestamptz)

  2. Indexes
    - Files table:
      - `user_id` for quick user-specific queries
      - `file_path` for uniqueness checks
      - `status` for status-based queries
    
    - Cleaning jobs table:
      - `user_id` for user-specific job queries
      - `file_id` for file-specific job queries
      - `status` for status-based queries
      - Composite index on (user_id, file_id) for unique constraint
    
    - Usage logs table:
      - `user_id` for user activity queries
      - `file_id` for file activity queries
      - `action` for action-based queries

  3. Security
    - RLS enabled on all tables
    - Policies for authenticated users to manage their own data
*/

-- Create file status enum
CREATE TYPE file_status AS ENUM (
  'uploading',
  'processing',
  'ready',
  'error',
  'deleted'
);

-- Create job status enum
CREATE TYPE job_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled'
);

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  original_name text NOT NULL,
  size_bytes bigint NOT NULL,
  mime_type text NOT NULL,
  status file_status NOT NULL DEFAULT 'uploading',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT files_file_path_unique UNIQUE (file_path)
);

-- Create cleaning_jobs table
CREATE TABLE IF NOT EXISTS cleaning_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_id uuid NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  status job_status NOT NULL DEFAULT 'pending',
  settings jsonb NOT NULL DEFAULT '{}',
  results jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT cleaning_jobs_user_file_unique UNIQUE (user_id, file_id)
);

-- Create usage_logs table
CREATE TABLE IF NOT EXISTS usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_id uuid NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for files table
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_status ON files(status);

-- Create indexes for cleaning_jobs table
CREATE INDEX idx_cleaning_jobs_user_id ON cleaning_jobs(user_id);
CREATE INDEX idx_cleaning_jobs_file_id ON cleaning_jobs(file_id);
CREATE INDEX idx_cleaning_jobs_status ON cleaning_jobs(status);

-- Create indexes for usage_logs table
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_file_id ON usage_logs(file_id);
CREATE INDEX idx_usage_logs_action ON usage_logs(action);

-- Enable Row Level Security
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for files table
CREATE POLICY "Users can view their own files"
  ON files
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own files"
  ON files
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files"
  ON files
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
  ON files
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for cleaning_jobs table
CREATE POLICY "Users can view their own cleaning jobs"
  ON cleaning_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cleaning jobs"
  ON cleaning_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cleaning jobs"
  ON cleaning_jobs
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cleaning jobs"
  ON cleaning_jobs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for usage_logs table
CREATE POLICY "Users can view their own usage logs"
  ON usage_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage logs"
  ON usage_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_files_updated_at
  BEFORE UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cleaning_jobs_updated_at
  BEFORE UPDATE ON cleaning_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();