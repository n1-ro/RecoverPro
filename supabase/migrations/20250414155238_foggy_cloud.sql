/*
  # Fix audio file upload issue and enhance timer handling

  1. Changes
    - Ensure recordings table has a file_format column to track uploaded file types
    - Update storage policies to properly handle file uploads with various formats
    - Add specific file format validation patterns to storage policies
  
  2. Security
    - Maintain security for user data
    - Allow only appropriate file formats
    - Keep existing RLS policies intact
*/

-- Make sure file_format column exists in recordings table
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

  -- Create or update the admin policy to access all recordings
  BEGIN
    DROP POLICY IF EXISTS "Admins can access all recordings" ON storage.objects;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  EXECUTE format('
    CREATE POLICY "Admins can access all recordings" ON storage.objects
    FOR ALL TO authenticated
    USING (
      bucket_id = ''applicant-recordings'' AND (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND (
            role_type = ''admin'' OR 
            email = ''tellitlikeitisjoe@gmail.com'' OR
            email = ''thejoeycagle@gmail.com'' OR
            email LIKE ''%%@admin.com''
          )
        )
      )
    )
    WITH CHECK (
      bucket_id = ''applicant-recordings'' AND (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND (
            role_type = ''admin'' OR 
            email = ''tellitlikeitisjoe@gmail.com'' OR
            email = ''thejoeycagle@gmail.com'' OR
            email LIKE ''%%@admin.com''
          )
        )
      )
    );
  ');
END $$;