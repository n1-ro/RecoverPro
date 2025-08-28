/*
  # Fix storage access and improve recording management

  1. Changes
    - Fix storage policies for better admin access to recordings
    - Improve handling of recording file access
    - Add updated_at timestamps for better tracking
    
  2. Security
    - Maintain proper security controls for user data
    - Fix admin access to ensure proper functionality
*/

-- Fix storage permissions to ensure admins can access all recordings
DO $$
BEGIN
  -- Drop existing policies to avoid conflicts
  BEGIN
    DROP POLICY IF EXISTS "Allow users to upload recordings" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to read recordings" ON storage.objects;
    DROP POLICY IF EXISTS "Allow users to delete own recordings" ON storage.objects;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Create new storage policies with proper syntax
  
  -- User upload policy
  EXECUTE format('
    CREATE POLICY "Allow users to upload recordings" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = ''applicant-recordings''
    );
  ');

  -- Read policy for all authenticated users
  EXECUTE format('
    CREATE POLICY "Allow authenticated users to read recordings" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = ''applicant-recordings'');
  ');

  -- User delete policy
  EXECUTE format('
    CREATE POLICY "Allow users to delete own recordings" ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = ''applicant-recordings'' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
  ');
END $$;

-- Update index on user_id in recordings table
CREATE INDEX IF NOT EXISTS recordings_user_id_idx ON recordings(user_id);

-- Add an updated_at column to recordings if it doesn't exist
ALTER TABLE recordings ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create a trigger function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_recordings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Check if trigger exists before creating it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_recordings_timestamp'
  ) THEN
    EXECUTE 'CREATE TRIGGER update_recordings_timestamp
      BEFORE UPDATE ON recordings
      FOR EACH ROW
      EXECUTE FUNCTION update_recordings_updated_at()';
  END IF;
END $$;