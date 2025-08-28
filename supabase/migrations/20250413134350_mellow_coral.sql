/*
  # Add question type and display order to scenarios

  1. Changes
    - Add response_type column to scenarios table to distinguish between audio and text questions
    - Add display_order column to scenarios table for ordering questions
    - Create indexes on these columns for performance
    - Update existing scenarios to have audio response type and sequential ordering
    - Add policies for admin access

  2. Security
    - Maintain existing RLS policies 
*/

-- Add new columns to scenarios table
ALTER TABLE scenarios 
ADD COLUMN IF NOT EXISTS response_type TEXT NOT NULL DEFAULT 'audio' 
  CHECK (response_type IN ('audio', 'text')),
ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS scenarios_response_type_idx ON scenarios(response_type);
CREATE INDEX IF NOT EXISTS scenarios_display_order_idx ON scenarios(display_order);

-- Update existing scenarios to have sequential ordering
-- Set the display_order based on the id for existing records
DO $$
DECLARE
  scenario_record RECORD;
  counter INTEGER := 10;
BEGIN
  FOR scenario_record IN SELECT id FROM scenarios ORDER BY id
  LOOP
    UPDATE scenarios 
    SET display_order = counter, 
        response_type = 'audio'
    WHERE id = scenario_record.id;
    
    counter := counter + 10;
  END LOOP;
END $$;

-- Add a constraint to enforce unique display_order values
ALTER TABLE scenarios 
ADD CONSTRAINT scenarios_display_order_unique UNIQUE (display_order);

-- Add a new text-based question as an example
INSERT INTO scenarios (
  title, 
  description, 
  active, 
  response_type, 
  display_order
)
VALUES (
  'Send me a letter',
  'How do you overcome this very common stall tactic and get payment, TODAY?',
  true,
  'text',
  40
)
ON CONFLICT (display_order) DO NOTHING;

-- Add text response table
CREATE TABLE IF NOT EXISTS text_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  scenario_id INTEGER NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  response_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on text_responses
ALTER TABLE text_responses ENABLE ROW LEVEL SECURITY;

-- Set up policies for text_responses
CREATE POLICY "Users can create text responses"
  ON text_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own text responses"
  ON text_responses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own text responses"
  ON text_responses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all text responses"
  ON text_responses
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