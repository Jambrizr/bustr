-- Create notification type enum
CREATE TYPE notification_type AS ENUM (
  'duplicate_detected',
  'cleaning_complete',
  'suspicious_data',
  'system_alert',
  'billing_alert'
);

-- Create notification status enum
CREATE TYPE notification_status AS ENUM (
  'unread',
  'read',
  'archived'
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  status notification_status NOT NULL DEFAULT 'unread',
  requires_action boolean NOT NULL DEFAULT false,
  action_taken boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  archived_at timestamptz
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications boolean NOT NULL DEFAULT true,
  browser_notifications boolean NOT NULL DEFAULT true,
  in_app_notifications boolean NOT NULL DEFAULT true,
  notification_types jsonb NOT NULL DEFAULT '["duplicate_detected", "cleaning_complete", "suspicious_data"]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create websocket connections table
CREATE TABLE IF NOT EXISTS websocket_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  connected_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  disconnected_at timestamptz,
  CONSTRAINT websocket_connections_conn_unique UNIQUE (connection_id)
);

-- Create indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created ON notifications(created_at);
CREATE INDEX idx_websocket_connections_user ON websocket_connections(user_id);
CREATE INDEX idx_websocket_connections_active ON websocket_connections(user_id) 
  WHERE disconnected_at IS NULL;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE websocket_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their notification preferences"
  ON notification_preferences
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their websocket connections"
  ON websocket_connections
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create function to update notification preferences
CREATE OR REPLACE FUNCTION update_notification_preferences(
  p_user_id uuid,
  p_preferences jsonb
)
RETURNS notification_preferences
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result notification_preferences;
BEGIN
  INSERT INTO notification_preferences (
    user_id,
    email_notifications,
    browser_notifications,
    in_app_notifications,
    notification_types
  )
  VALUES (
    p_user_id,
    COALESCE((p_preferences->>'email_notifications')::boolean, true),
    COALESCE((p_preferences->>'browser_notifications')::boolean, true),
    COALESCE((p_preferences->>'in_app_notifications')::boolean, true),
    COALESCE((p_preferences->>'notification_types')::jsonb, '["duplicate_detected", "cleaning_complete", "suspicious_data"]'::jsonb)
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    email_notifications = COALESCE((p_preferences->>'email_notifications')::boolean, notification_preferences.email_notifications),
    browser_notifications = COALESCE((p_preferences->>'browser_notifications')::boolean, notification_preferences.browser_notifications),
    in_app_notifications = COALESCE((p_preferences->>'in_app_notifications')::boolean, notification_preferences.in_app_notifications),
    notification_types = COALESCE((p_preferences->>'notification_types')::jsonb, notification_preferences.notification_types),
    updated_at = now()
  WHERE notification_preferences.user_id = p_user_id
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

-- Create function to create a new notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type notification_type,
  p_title text,
  p_message text,
  p_metadata jsonb DEFAULT '{}',
  p_requires_action boolean DEFAULT false
)
RETURNS notifications
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification notifications;
  v_preferences notification_preferences;
BEGIN
  -- Get user's notification preferences
  SELECT * INTO v_preferences
  FROM notification_preferences
  WHERE user_id = p_user_id;

  -- Check if user wants this type of notification
  IF v_preferences.notification_types ? p_type::text THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      requires_action
    )
    VALUES (
      p_user_id,
      p_type,
      p_title,
      p_message,
      p_metadata,
      p_requires_action
    )
    RETURNING * INTO v_notification;

    -- Trigger real-time notification via websocket (handled by Edge Function)
    PERFORM pg_notify(
      'new_notification',
      json_build_object(
        'user_id', p_user_id,
        'notification_id', v_notification.id,
        'type', p_type,
        'title', p_title,
        'message', p_message,
        'requires_action', p_requires_action
      )::text
    );
  END IF;

  RETURN v_notification;
END;
$$;