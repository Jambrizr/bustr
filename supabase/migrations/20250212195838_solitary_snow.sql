/*
  # User Profiles Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `first_name` (text)
      - `last_name` (text)
      - `company` (text)
      - `birthday` (date)
      - `state` (text)
      - `subscription_plan` (text)
      - `role` (text)
      - `data_retention_preference` (text)
      - `remember_me` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `last_login` (timestamptz)

  2. Security
    - Enable RLS on user_profiles table
    - Add policies for:
      - Users can read their own profile
      - Users can update their own profile
      - Service role can manage all profiles
*/

-- Create enum for subscription plans
CREATE TYPE subscription_plan_type AS ENUM (
  'freemium',
  'core',
  'premium'
);

-- Create enum for data retention preferences
CREATE TYPE data_retention_type AS ENUM (
  'immediate',
  '6 hours',
  '7 days',
  '30 days',
  '60 days'
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  company text,
  birthday date,
  state text,
  subscription_plan subscription_plan_type DEFAULT 'freemium',
  role text DEFAULT 'user',
  data_retention_preference data_retention_type DEFAULT '7 days',
  remember_me boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating the updated_at timestamp
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_user_profiles_subscription ON user_profiles(subscription_plan);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);