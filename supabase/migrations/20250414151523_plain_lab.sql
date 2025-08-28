/*
  # Add support for file uploads with various formats

  1. Changes
    - Modify storage policies to accept various audio file formats
    - Update recordings table to track file format information
    
  2. Security
    - Maintain existing RLS policies
    - Ensure proper access control for uploaded files
*/

-- Add file_format column to recordings table
ALTER TABLE recordings ADD COLUMN IF NOT EXISTS file_format TEXT DEFAULT 'webm';

-- Update storage policies to handle various file formats
DO $$
BEGIN
  -- Drop existing storage policy if it exists
  BEGIN
    DROP POLICY IF EXISTS "Allow users to upload their recordings" ON storage.objects;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore errors if policy doesn't exist
  END;

  -- Create updated policy allowing more file formats
  EXECUTE format('
    CREATE POLICY "Allow users to upload their recordings" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = ''applicant-recordings'' AND
      auth.uid()::text = (storage.foldername(name))[1] AND
      (
        -- Allow standard audio formats
        name ~* ''\.(mp3|wav|m4a|ogg|flac|aac|wma|webm)$'' OR
        -- Also allow standard recording format from browser
        name ~* ''\.webm$''
      )
    );
  ');
END $$;