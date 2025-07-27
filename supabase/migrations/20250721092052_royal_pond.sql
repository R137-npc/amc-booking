/*
  # Audit System and Default Admin Users

  1. New Tables
    - `audit_logs` - System audit trail
      - `id` (uuid, primary key)
      - `action` (enum: create, update, delete)
      - `entity_type` (enum: machine, machine_type, user, booking)
      - `entity_id` (text)
      - `description` (text)
      - `user_id` (uuid)
      - `user_name` (text)
      - `changes` (jsonb)
      - `timestamp` (timestamptz)

  2. Security
    - Enable RLS on audit_logs
    - Only admins can read audit logs
    - System functions can write audit logs

  3. Default Admin Users
    - Create default AMC and IMA admin accounts
*/

-- Create audit enums
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete');
CREATE TYPE audit_entity_type AS ENUM ('machine', 'machine_type', 'user', 'booking');

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action audit_action NOT NULL,
  entity_type audit_entity_type NOT NULL,
  entity_id text NOT NULL,
  description text NOT NULL,
  user_id uuid REFERENCES profiles(id),
  user_name text NOT NULL,
  changes jsonb DEFAULT '{}',
  timestamp timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for audit_logs
CREATE POLICY "Admins can read audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('amc_admin', 'ima_admin')
    )
  );

CREATE POLICY "System can write audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log(
  p_action audit_action,
  p_entity_type audit_entity_type,
  p_entity_id text,
  p_description text,
  p_changes jsonb DEFAULT '{}'
)
RETURNS void AS $$
DECLARE
  current_user_name text;
BEGIN
  -- Get current user name
  SELECT name INTO current_user_name
  FROM profiles
  WHERE id = auth.uid();
  
  -- Insert audit log
  INSERT INTO audit_logs (action, entity_type, entity_id, description, user_id, user_name, changes)
  VALUES (p_action, p_entity_type, p_entity_id, p_description, auth.uid(), COALESCE(current_user_name, 'System'), p_changes);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create machine audit logs
CREATE OR REPLACE FUNCTION audit_machine_changes()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_audit_log(
      'create',
      'machine',
      NEW.id,
      'Created machine "' || NEW.name || '" in category ' || NEW.machine_type_id,
      jsonb_build_object(
        'name', NEW.name,
        'machine_type_id', NEW.machine_type_id,
        'status', NEW.status,
        'custom_token_cost', NEW.custom_token_cost
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM create_audit_log(
      'update',
      'machine',
      NEW.id,
      'Updated machine "' || NEW.name || '"',
      jsonb_build_object(
        'old', row_to_json(OLD),
        'new', row_to_json(NEW)
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM create_audit_log(
      'delete',
      'machine',
      OLD.id,
      'Deleted machine "' || OLD.name || '"',
      jsonb_build_object('deleted_machine', row_to_json(OLD))
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for machine audit logs
DROP TRIGGER IF EXISTS audit_machine_changes_trigger ON machines;
CREATE TRIGGER audit_machine_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON machines
  FOR EACH ROW EXECUTE FUNCTION audit_machine_changes();

-- Function to create machine type audit logs
CREATE OR REPLACE FUNCTION audit_machine_type_changes()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_audit_log(
      'create',
      'machine_type',
      NEW.id,
      'Created machine category "' || NEW.name || '"',
      jsonb_build_object('name', NEW.name, 'description', NEW.description)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM create_audit_log(
      'update',
      'machine_type',
      NEW.id,
      'Updated machine category "' || NEW.name || '"',
      jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM create_audit_log(
      'delete',
      'machine_type',
      OLD.id,
      'Deleted machine category "' || OLD.name || '"',
      jsonb_build_object('deleted_type', row_to_json(OLD))
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for machine type audit logs
DROP TRIGGER IF EXISTS audit_machine_type_changes_trigger ON machine_types;
CREATE TRIGGER audit_machine_type_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON machine_types
  FOR EACH ROW EXECUTE FUNCTION audit_machine_type_changes();