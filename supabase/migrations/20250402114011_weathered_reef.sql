/*
  # Create storage bucket and update row-level security policies

  1. Security
    - Ensure RLS is enabled for recordings table
    - Add appropriate policies for authenticated users to:
      - Read their own recordings
      - Create new recordings
      - Delete their own recordings
*/

-- Ensure recordings table has proper RLS policies
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can read own recordings" ON recordings;
  DROP POLICY IF EXISTS "Users can create recordings" ON recordings;
  DROP POLICY IF EXISTS "Users can delete own recordings" ON recordings;
END
$$;

-- Create policies for recordings
CREATE POLICY "Users can read own recordings"
  ON recordings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create recordings"
  ON recordings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recordings"
  ON recordings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);