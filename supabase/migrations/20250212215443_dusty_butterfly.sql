/*
  # CRM Integration Schema

  1. New Tables
    - `crm_connections`
      - Stores CRM connection details and credentials
    - `crm_webhooks`
      - Stores webhook configurations and secrets
    - `crm_contacts`
      - Stores synced contacts from CRMs
    - `crm_sync_logs`
      - Tracks sync history and issues

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Secure credential storage
*/

-- Create enum for CRM types
CREATE TYPE crm_provider_type AS ENUM (
  'salesforce',
  'hubspot',
  'activecampaign',
  'marketo',
  'zoho'
);

-- Create enum for sync status
CREATE TYPE sync_status_type AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'failed'
);

-- Create enum for contact status
CREATE TYPE contact_status_type AS ENUM (
  'new',
  'cleaned',
  'duplicate',
  'suspicious',
  'approved',
  'rejected'
);

-- Create CRM connections table
CREATE TABLE IF NOT EXISTS crm_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider crm_provider_type NOT NULL,
  credentials jsonb NOT NULL DEFAULT '{}',
  settings jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_connections_user_provider_unique UNIQUE (user_id, provider)
);

-- Create CRM webhooks table
CREATE TABLE IF NOT EXISTS crm_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES crm_connections(id) ON DELETE CASCADE,
  webhook_url text NOT NULL,
  secret_key text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create CRM contacts table
CREATE TABLE IF NOT EXISTS crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES crm_connections(id) ON DELETE CASCADE,
  crm_contact_id text NOT NULL,
  raw_data jsonb NOT NULL DEFAULT '{}',
  cleaned_data jsonb,
  status contact_status_type NOT NULL DEFAULT 'new',
  duplicate_of uuid REFERENCES crm_contacts(id),
  cleaning_job_id uuid REFERENCES cleaning_jobs(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_contacts_connection_contact_unique UNIQUE (connection_id, crm_contact_id)
);

-- Create CRM sync logs table
CREATE TABLE IF NOT EXISTS crm_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES crm_connections(id) ON DELETE CASCADE,
  sync_type text NOT NULL,
  status sync_status_type NOT NULL DEFAULT 'pending',
  contacts_processed integer NOT NULL DEFAULT 0,
  contacts_cleaned integer NOT NULL DEFAULT 0,
  contacts_failed integer NOT NULL DEFAULT 0,
  error_details jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE crm_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own CRM connections"
  ON crm_connections
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage webhooks for their connections"
  ON crm_webhooks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM crm_connections
      WHERE id = crm_webhooks.connection_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage contacts from their connections"
  ON crm_contacts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM crm_connections
      WHERE id = crm_contacts.connection_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view sync logs for their connections"
  ON crm_sync_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crm_connections
      WHERE id = crm_sync_logs.connection_id
      AND user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_crm_connections_user ON crm_connections(user_id);
CREATE INDEX idx_crm_webhooks_connection ON crm_webhooks(connection_id);
CREATE INDEX idx_crm_contacts_connection ON crm_contacts(connection_id);
CREATE INDEX idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX idx_crm_sync_logs_connection ON crm_sync_logs(connection_id);
CREATE INDEX idx_crm_sync_logs_status ON crm_sync_logs(status);

-- Create function to update updated_at timestamp
CREATE TRIGGER update_crm_connections_updated_at
  BEFORE UPDATE ON crm_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_webhooks_updated_at
  BEFORE UPDATE ON crm_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_contacts_updated_at
  BEFORE UPDATE ON crm_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();