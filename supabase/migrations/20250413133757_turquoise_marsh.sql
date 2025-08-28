/*
  # Create scenarios table for interview questions

  1. New Tables
    - `scenarios`
      - `id` (integer, primary key)
      - `title` (text, not null)
      - `description` (text, not null)
      - `created_at` (timestamp with time zone, default now())
      - `active` (boolean, default true)

  2. Security
    - Enable RLS on scenarios table
    - Add policy for admin users to manage all scenarios
    - Add policy for applicants to read active scenarios

  3. Initial Data
    - Add initial scenarios based on current hardcoded questions
*/

-- Create scenarios table
CREATE TABLE IF NOT EXISTS scenarios (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  active BOOLEAN DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- Create policies for admin and applicant access
CREATE POLICY "Admins can manage scenarios"
  ON scenarios
  FOR ALL
  TO authenticated
  USING (
    (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'admin' OR
    (auth.jwt() ->> 'email') = 'tellitlikeitisjoe@gmail.com' OR
    (auth.jwt() ->> 'email') = 'thejoeycagle@gmail.com' OR
    (auth.jwt() ->> 'email') LIKE '%@admin.com'
  )
  WITH CHECK (
    (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'admin' OR
    (auth.jwt() ->> 'email') = 'tellitlikeitisjoe@gmail.com' OR
    (auth.jwt() ->> 'email') = 'thejoeycagle@gmail.com' OR
    (auth.jwt() ->> 'email') LIKE '%@admin.com'
  );

CREATE POLICY "Applicants can view active scenarios"
  ON scenarios
  FOR SELECT
  TO authenticated
  USING (active = true);

-- Insert initial scenarios
INSERT INTO scenarios (title, description, active)
VALUES 
('I''m going through hard times', 'Respond professionally to a debtor claiming financial hardship', true),
('That''s not my debt', 'Handle a dispute about debt ownership', true),
('I already paid that', 'Address a claim of previous payment', true);

-- Update recordings table to reference scenarios table
ALTER TABLE recordings 
ADD CONSTRAINT recordings_scenario_id_fkey
FOREIGN KEY (scenario_id) REFERENCES scenarios (id)
ON DELETE CASCADE;