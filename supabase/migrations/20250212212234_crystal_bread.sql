/*
  # Templates Implementation

  1. New Tables
    - `templates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `rules` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `templates` table
    - Add policies for authenticated users to manage their templates

  3. Changes
    - Add template_id reference to cleaning_jobs table
*/

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  rules jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT templates_name_user_unique UNIQUE (user_id, name)
);

-- Add template reference to cleaning_jobs
ALTER TABLE cleaning_jobs
ADD COLUMN template_id uuid REFERENCES templates(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_name ON templates(name);
CREATE INDEX idx_cleaning_jobs_template_id ON cleaning_jobs(template_id);

-- Enable RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own templates"
  ON templates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON templates
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create audit log trigger for templates
CREATE OR REPLACE FUNCTION audit_template_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM add_audit_log(
      NEW.user_id,
      'template_created'::audit_action_type,
      jsonb_build_object(
        'template_id', NEW.id,
        'template_name', NEW.name
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM add_audit_log(
      NEW.user_id,
      'template_updated'::audit_action_type,
      jsonb_build_object(
        'template_id', NEW.id,
        'template_name', NEW.name
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM add_audit_log(
      OLD.user_id,
      'template_deleted'::audit_action_type,
      jsonb_build_object(
        'template_id', OLD.id,
        'template_name', OLD.name
      )
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_template_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION audit_template_changes();