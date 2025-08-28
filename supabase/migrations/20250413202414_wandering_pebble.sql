/*
  # Fix storage access policies

  1. Changes
    - Add storage policies for admins to access all recordings
    - Fix storage folder structure policies
    - Ensure proper access control for recordings folder
    
  2. Security
    - Maintain existing RLS policies
    - Add specific admin access rules
*/

-- Update storage policies for recordings bucket
DO $$
BEGIN
  -- Drop existing policies to avoid conflicts
  BEGIN
    DROP POLICY IF EXISTS "Allow users to upload their recordings" ON storage.objects;
    DROP POLICY IF EXISTS "Allow users to read their own recordings" ON storage.objects;
    DROP POLICY IF EXISTS "Allow users to delete their own recordings" ON storage.objects;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Create new policies with proper folder structure and admin access
  CREATE POLICY "Allow users to upload their recordings"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'applicant-recordings' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );

  CREATE POLICY "Allow users to read their own recordings"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'applicant-recordings' AND (
        -- User can access their own recordings
        auth.uid()::text = (storage.foldername(name))[1] OR
        -- Admins can access all recordings
        (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'admin' OR
        (auth.jwt() ->> 'email') = 'tellitlikeitisjoe@gmail.com' OR
        (auth.jwt() ->> 'email') = 'thejoeycagle@gmail.com' OR
        (auth.jwt() ->> 'email') LIKE '%@admin.com'
      )
    );

  CREATE POLICY "Allow users to delete their own recordings"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'applicant-recordings' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );

  -- Add admin policy for all operations
  CREATE POLICY "Admins can manage all recordings in storage"
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (
      bucket_id = 'applicant-recordings' AND (
        (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'admin' OR
        (auth.jwt() ->> 'email') = 'tellitlikeitisjoe@gmail.com' OR
        (auth.jwt() ->> 'email') = 'thejoeycagle@gmail.com' OR
        (auth.jwt() ->> 'email') LIKE '%@admin.com'
      )
    )
    WITH CHECK (
      bucket_id = 'applicant-recordings' AND (
        (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'admin' OR
        (auth.jwt() ->> 'email') = 'tellitlikeitisjoe@gmail.com' OR
        (auth.jwt() ->> 'email') = 'thejoeycagle@gmail.com' OR
        (auth.jwt() ->> 'email') LIKE '%@admin.com'
      )
    );
END $$;