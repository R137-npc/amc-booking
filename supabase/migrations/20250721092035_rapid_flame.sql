/*
  # Booking System Schema

  1. New Tables
    - `bookings` - Machine booking requests
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `machine_id` (text, foreign key to machines)
      - `start_datetime` (timestamptz)
      - `end_datetime` (timestamptz)
      - `booking_type` (enum)
      - `status` (enum)
      - `justification` (text, optional)
      - `tokens_consumed` (integer)
      - `approved_by` (uuid, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `availability_blocks` - IMA internal blocks
      - `id` (uuid, primary key)
      - `machine_id` (text, foreign key)
      - `start_datetime` (timestamptz)
      - `end_datetime` (timestamptz)
      - `block_type` (enum)
      - `created_by` (uuid)
      - `reason` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can read own bookings
    - Admins can manage all bookings

  3. Functions
    - Auto-update user token consumption
    - Booking validation functions
*/

-- Create booking enums
CREATE TYPE booking_type AS ENUM ('weekly_planning', 'same_week_exceptional', 'monthly_provisional');
CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE block_type AS ENUM ('ima_internal', 'maintenance', 'training');

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  machine_id text NOT NULL REFERENCES machines(id) ON DELETE RESTRICT,
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz NOT NULL,
  booking_type booking_type NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  justification text,
  tokens_consumed integer NOT NULL DEFAULT 0,
  approved_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_datetime_range CHECK (end_datetime > start_datetime),
  CONSTRAINT valid_tokens CHECK (tokens_consumed >= 0)
);

-- Create availability_blocks table
CREATE TABLE IF NOT EXISTS availability_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id text NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz NOT NULL,
  block_type block_type NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id),
  reason text NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_block_datetime_range CHECK (end_datetime > start_datetime)
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;

-- Policies for bookings
CREATE POLICY "Users can read own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pending bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can read all bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('amc_admin', 'ima_admin')
    )
  );

CREATE POLICY "Admins can manage all bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('amc_admin', 'ima_admin')
    )
  );

-- Policies for availability_blocks
CREATE POLICY "Anyone can read availability blocks"
  ON availability_blocks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "IMA admins can manage availability blocks"
  ON availability_blocks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'ima_admin'
    )
  );

-- Function to update booking updated_at
CREATE OR REPLACE FUNCTION update_booking_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for bookings updated_at
DROP TRIGGER IF EXISTS update_booking_updated_at_trigger ON bookings;
CREATE TRIGGER update_booking_updated_at_trigger
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_booking_updated_at();

-- Function to update user token consumption when booking status changes
CREATE OR REPLACE FUNCTION update_user_tokens_on_booking_change()
RETURNS trigger AS $$
BEGIN
  -- If booking is approved, add to tokens_consumed
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE profiles 
    SET tokens_consumed = tokens_consumed + NEW.tokens_consumed
    WHERE id = NEW.user_id;
  END IF;
  
  -- If booking was approved but now rejected/cancelled, subtract from tokens_consumed
  IF OLD.status = 'approved' AND NEW.status IN ('rejected', 'cancelled') THEN
    UPDATE profiles 
    SET tokens_consumed = GREATEST(0, tokens_consumed - OLD.tokens_consumed)
    WHERE id = OLD.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update user tokens on booking status change
DROP TRIGGER IF EXISTS update_user_tokens_trigger ON bookings;
CREATE TRIGGER update_user_tokens_trigger
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_user_tokens_on_booking_change();