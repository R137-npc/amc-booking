/*
  # User Management and Authentication Setup

  1. New Tables
    - `profiles` - Extended user profile information
      - `id` (uuid, references auth.users)
      - `name` (text)
      - `role` (enum: startup, amc_admin, ima_admin)
      - `tokens_given` (integer)
      - `tokens_consumed` (integer) 
      - `tokens_remaining` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for user access control
    - Create role-based access policies

  3. Functions
    - Auto-create profile on user signup
    - Update tokens_remaining automatically
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('startup', 'amc_admin', 'ima_admin');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role user_role NOT NULL DEFAULT 'startup',
  tokens_given integer NOT NULL DEFAULT 0,
  tokens_consumed integer NOT NULL DEFAULT 0,
  tokens_remaining integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('amc_admin', 'ima_admin')
    )
  );

CREATE POLICY "AMC admins can manage all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'amc_admin'
    )
  );

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'startup')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update tokens_remaining automatically
CREATE OR REPLACE FUNCTION update_tokens_remaining()
RETURNS trigger AS $$
BEGIN
  NEW.tokens_remaining = NEW.tokens_given - NEW.tokens_consumed;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update tokens_remaining
DROP TRIGGER IF EXISTS update_tokens_remaining_trigger ON profiles;
CREATE TRIGGER update_tokens_remaining_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_tokens_remaining();