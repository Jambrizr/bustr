/*
  # Usage Tracking Functions

  1. Functions
    - Add track_usage function for logging user actions
    - Add get_usage_summary function for retrieving usage statistics

  2. Security
    - Add RLS policies for usage tracking
    - Functions run with SECURITY DEFINER for system-level access
*/

-- Create RLS policies (if not exist)
DO $$ BEGIN
  CREATE POLICY "Users can view their own usage logs"
    ON usage_logs
    FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "System can insert usage logs"
    ON usage_logs
    FOR INSERT
    WITH CHECK (true);  -- Allow inserts from trusted backend contexts
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create function to track usage
CREATE OR REPLACE FUNCTION track_usage(
  p_user_id uuid,
  p_file_id uuid,
  p_action_type text,
  p_data_processed bigint DEFAULT 0,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  -- Insert usage log
  INSERT INTO usage_logs (
    user_id,
    file_id,
    action_type,
    data_processed,
    metadata
  )
  VALUES (
    p_user_id,
    p_file_id,
    p_action_type,
    p_data_processed,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  -- Update billing metrics
  PERFORM update_usage_metrics(
    p_user_id,
    CASE 
      WHEN p_action_type = 'cleaning_completed' THEN p_data_processed
      ELSE 0
    END,
    p_data_processed,
    CASE 
      WHEN p_action_type = 'file_upload' THEN 1
      ELSE 0
    END,
    CASE 
      WHEN p_action_type = 'cleaning_completed' THEN 1
      ELSE 0
    END
  );

  RETURN v_log_id;
END;
$$;

-- Create function to get usage summary
CREATE OR REPLACE FUNCTION get_usage_summary(
  p_user_id uuid,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
  action_type text,
  total_actions bigint,
  total_data_processed bigint,
  last_action_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ul.action_type,
    COUNT(*)::bigint as total_actions,
    SUM(ul.data_processed) as total_data_processed,
    MAX(ul.timestamp) as last_action_at
  FROM usage_logs ul
  WHERE ul.user_id = p_user_id
    AND (p_start_date IS NULL OR ul.timestamp >= p_start_date)
    AND (p_end_date IS NULL OR ul.timestamp <= p_end_date)
  GROUP BY ul.action_type
  ORDER BY last_action_at DESC;
END;
$$;