/*
  # Stripe Billing Integration

  1. New Tables
    - `subscription_plans` - Store plan details and pricing
    - `customer_subscriptions` - Track active subscriptions
    - `subscription_usage` - Monitor usage for billing
    - `billing_history` - Store payment and invoice history

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add policies for system operations

  3. Changes
    - Add subscription-related functions and triggers
    - Add usage tracking and billing calculation functions
*/

-- Create subscription plan type enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan_type') THEN
    CREATE TYPE subscription_plan_type AS ENUM (
      'freemium',
      'core',
      'premium'
    );
  END IF;
END $$;

-- Create billing interval enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_interval_type') THEN
    CREATE TYPE billing_interval_type AS ENUM (
      'monthly',
      'annual'
    );
  END IF;
END $$;

-- Create subscription status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_type') THEN
    CREATE TYPE subscription_status_type AS ENUM (
      'active',
      'past_due',
      'canceled',
      'incomplete',
      'incomplete_expired',
      'trialing',
      'unpaid'
    );
  END IF;
END $$;

-- Create payment status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_type') THEN
    CREATE TYPE payment_status_type AS ENUM (
      'pending',
      'succeeded',
      'failed',
      'refunded'
    );
  END IF;
END $$;

-- Create subscription_plans table
CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_price_id text NOT NULL,
  name text NOT NULL,
  description text,
  type subscription_plan_type NOT NULL,
  interval billing_interval_type NOT NULL,
  amount integer NOT NULL, -- Amount in cents
  currency text NOT NULL DEFAULT 'usd',
  features jsonb NOT NULL DEFAULT '[]',
  limits jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create customer_subscriptions table
CREATE TABLE customer_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text NOT NULL,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  status subscription_status_type NOT NULL DEFAULT 'incomplete',
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  canceled_at timestamptz,
  ended_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customer_subscriptions_stripe_unique UNIQUE (stripe_subscription_id)
);

-- Create subscription_usage table
CREATE TABLE subscription_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES customer_subscriptions(id) ON DELETE CASCADE,
  billing_period_start timestamptz NOT NULL,
  billing_period_end timestamptz NOT NULL,
  rows_processed bigint NOT NULL DEFAULT 0,
  data_processed_bytes bigint NOT NULL DEFAULT 0,
  files_uploaded integer NOT NULL DEFAULT 0,
  cleaning_jobs_run integer NOT NULL DEFAULT 0,
  overage_amount integer, -- Amount in cents
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create billing_history table
CREATE TABLE billing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES customer_subscriptions(id) ON DELETE SET NULL,
  stripe_invoice_id text,
  stripe_payment_intent_id text,
  amount integer NOT NULL, -- Amount in cents
  currency text NOT NULL DEFAULT 'usd',
  status payment_status_type NOT NULL,
  billing_reason text,
  invoice_pdf text,
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

-- Create policies for subscription_plans
CREATE POLICY "Anyone can view active plans"
  ON subscription_plans
  FOR SELECT
  USING (is_active = true);

-- Create policies for customer_subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON customer_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions"
  ON customer_subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create policies for subscription_usage
CREATE POLICY "Users can view their own usage"
  ON subscription_usage
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customer_subscriptions
      WHERE id = subscription_usage.subscription_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage usage"
  ON subscription_usage
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create policies for billing_history
CREATE POLICY "Users can view their own billing history"
  ON billing_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage billing history"
  ON billing_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX idx_customer_subscriptions_user ON customer_subscriptions(user_id);
CREATE INDEX idx_customer_subscriptions_status ON customer_subscriptions(status);
CREATE INDEX idx_subscription_usage_subscription ON subscription_usage(subscription_id);
CREATE INDEX idx_subscription_usage_period ON subscription_usage(billing_period_start, billing_period_end);
CREATE INDEX idx_billing_history_user ON billing_history(user_id);
CREATE INDEX idx_billing_history_subscription ON billing_history(subscription_id);

-- Create function to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_subscriptions_updated_at
  BEFORE UPDATE ON customer_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_usage_updated_at
  BEFORE UPDATE ON subscription_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to get current subscription
CREATE OR REPLACE FUNCTION get_current_subscription(user_uuid uuid)
RETURNS TABLE (
  subscription_id uuid,
  plan_type subscription_plan_type,
  status subscription_status_type,
  current_period_end timestamptz,
  cancel_at_period_end boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cs.id as subscription_id,
    sp.type as plan_type,
    cs.status,
    cs.current_period_end,
    cs.cancel_at_period_end
  FROM customer_subscriptions cs
  JOIN subscription_plans sp ON cs.plan_id = sp.id
  WHERE cs.user_id = user_uuid
  AND cs.status NOT IN ('canceled', 'incomplete_expired')
  ORDER BY cs.created_at DESC
  LIMIT 1;
END;
$$;

-- Create function to calculate usage
CREATE OR REPLACE FUNCTION calculate_subscription_usage(
  subscription_uuid uuid,
  start_date timestamptz,
  end_date timestamptz
)
RETURNS TABLE (
  rows_processed bigint,
  data_processed_bytes bigint,
  files_uploaded integer,
  cleaning_jobs_run integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(rows_processed), 0) as rows_processed,
    COALESCE(SUM(data_processed_bytes), 0) as data_processed_bytes,
    COALESCE(SUM(files_uploaded), 0) as files_uploaded,
    COALESCE(SUM(cleaning_jobs_run), 0) as cleaning_jobs_run
  FROM subscription_usage
  WHERE subscription_id = subscription_uuid
  AND billing_period_start >= start_date
  AND billing_period_end <= end_date;
END;
$$;

-- Insert default plans
INSERT INTO subscription_plans (
  stripe_price_id,
  name,
  description,
  type,
  interval,
  amount,
  features,
  limits
) VALUES
-- Freemium Plan
(
  'price_free',
  'Freemium',
  'Free plan with basic features',
  'freemium',
  'monthly',
  0,
  '[
    "Basic data cleaning",
    "Up to 5,000 records/month",
    "Email support"
  ]'::jsonb,
  '{
    "max_rows_per_month": 5000,
    "max_storage_bytes": 104857600,
    "max_file_size_bytes": 52428800
  }'::jsonb
),
-- Core Plan Monthly
(
  'price_core_monthly',
  'Core',
  'Perfect for growing businesses',
  'core',
  'monthly',
  9900,
  '[
    "Advanced data cleaning",
    "Up to 1M records/month",
    "Priority support",
    "Custom validation rules"
  ]'::jsonb,
  '{
    "max_rows_per_month": 1000000,
    "max_storage_bytes": 5368709120,
    "max_file_size_bytes": 524288000
  }'::jsonb
),
-- Core Plan Annual
(
  'price_core_annual',
  'Core',
  'Perfect for growing businesses',
  'core',
  'annual',
  79900,
  '[
    "Advanced data cleaning",
    "Up to 1M records/month",
    "Priority support",
    "Custom validation rules"
  ]'::jsonb,
  '{
    "max_rows_per_month": 1000000,
    "max_storage_bytes": 5368709120,
    "max_file_size_bytes": 524288000
  }'::jsonb
),
-- Premium Plan Monthly
(
  'price_premium_monthly',
  'Premium',
  'For large-scale operations',
  'premium',
  'monthly',
  29900,
  '[
    "Enterprise-grade cleaning",
    "Up to 5M records/month",
    "24/7 priority support",
    "API access",
    "Real-time integrations"
  ]'::jsonb,
  '{
    "max_rows_per_month": 5000000,
    "max_storage_bytes": 21474836480,
    "max_file_size_bytes": 1073741824
  }'::jsonb
),
-- Premium Plan Annual
(
  'price_premium_annual',
  'Premium',
  'For large-scale operations',
  'premium',
  'annual',
  299900,
  '[
    "Enterprise-grade cleaning",
    "Up to 5M records/month",
    "24/7 priority support",
    "API access",
    "Real-time integrations"
  ]'::jsonb,
  '{
    "max_rows_per_month": 5000000,
    "max_storage_bytes": 21474836480,
    "max_file_size_bytes": 1073741824
  }'::jsonb
);
