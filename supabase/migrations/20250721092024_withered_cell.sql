/*
  # Machine Management Schema

  1. New Tables
    - `machine_types` - Categories of machines
      - `id` (text, primary key)
      - `name` (text)
      - `description` (text)
      - `created_at` (timestamp)
    
    - `machines` - Individual machines
      - `id` (text, primary key)
      - `name` (text)
      - `machine_type_id` (text, foreign key)
      - `status` (enum: available, maintenance, offline)
      - `custom_token_cost` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Read access for all authenticated users
    - Write access for admins only

  3. Initial Data
    - Insert default machine types and machines
*/

-- Create machine status enum
CREATE TYPE machine_status AS ENUM ('available', 'maintenance', 'offline');

-- Create machine_types table
CREATE TABLE IF NOT EXISTS machine_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create machines table
CREATE TABLE IF NOT EXISTS machines (
  id text PRIMARY KEY,
  name text NOT NULL,
  machine_type_id text NOT NULL REFERENCES machine_types(id) ON DELETE RESTRICT,
  status machine_status NOT NULL DEFAULT 'available',
  custom_token_cost integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE machine_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

-- Policies for machine_types
CREATE POLICY "Anyone can read machine types"
  ON machine_types
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage machine types"
  ON machine_types
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('amc_admin', 'ima_admin')
    )
  );

-- Policies for machines
CREATE POLICY "Anyone can read machines"
  ON machines
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage machines"
  ON machines
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('amc_admin', 'ima_admin')
    )
  );

-- Function to update machines updated_at
CREATE OR REPLACE FUNCTION update_machine_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for machines updated_at
DROP TRIGGER IF EXISTS update_machine_updated_at_trigger ON machines;
CREATE TRIGGER update_machine_updated_at_trigger
  BEFORE UPDATE ON machines
  FOR EACH ROW EXECUTE FUNCTION update_machine_updated_at();

-- Insert default machine types
INSERT INTO machine_types (id, name, description) VALUES
  ('C01', '3D Printer', 'High-precision 3D printing capabilities'),
  ('C02', 'CNC Machine', 'Computer numerical control machining'),
  ('C03', 'Laser Cutter', 'Precision laser cutting and engraving')
ON CONFLICT (id) DO NOTHING;

-- Insert default machines
INSERT INTO machines (id, name, machine_type_id, status, custom_token_cost) VALUES
  ('C01M01', '3D Printer #1', 'C01', 'available', 5),
  ('C01M02', '3D Printer #2', 'C01', 'available', 5),
  ('C02M01', 'CNC Machine #1', 'C02', 'maintenance', 8),
  ('C03M01', 'Laser Cutter #1', 'C03', 'available', 6)
ON CONFLICT (id) DO NOTHING;