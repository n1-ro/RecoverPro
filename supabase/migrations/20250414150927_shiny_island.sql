/*
  # Fix storage permissions for admin recording access

  1. Changes
    - Update storage bucket policies to ensure admins can access all recordings
    - Fix storage folder structure handling
    - Ensure proper access control for both users and admins
    
  2. Security
    - Maintain proper RLS for user recordings
    - Add explicit admin access to all recordings
*/

-- Drop existing storage policies to avoid conflicts
DO $$
BEGIN
  -- Drop existing policies if they exist
  BEGIN
    DROP POLICY IF EXISTS "Allow users to upload their recordings" ON storage.objects;
    DROP POLICY IF EXISTS "Allow users to read their own recordings" ON storage.objects;
    DROP POLICY IF EXISTS "Allow users to delete their own recordings" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can manage all recordings in storage" ON storage.objects;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore errors if policies don't exist
  END;

  -- Create user upload policy - users can only upload to their own folder
  EXECUTE format('
    CREATE POLICY "Allow users to upload their recordings" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = ''applicant-recordings'' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
  ');

  -- User read policy - users can only read their own recordings
  EXECUTE format('
    CREATE POLICY "Allow users to read their own recordings" ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = ''applicant-recordings'' AND (
        auth.uid()::text = (storage.foldername(name))[1]
      )
    );
  ');

  -- User delete policy - users can only delete their own recordings
  EXECUTE format('
    CREATE POLICY "Allow users to delete their own recordings" ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = ''applicant-recordings'' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
  ');

  -- Admin policy - admins can access all recordings
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

-- Update recordings table policies to ensure admins can access all recordings
DROP POLICY IF EXISTS "Admins can manage all recordings" ON recordings;
DROP POLICY IF EXISTS "Users can read own recordings" ON recordings;

-- Recreate policies with proper admin access
CREATE POLICY "Admins can manage all recordings" 
ON recordings
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

CREATE POLICY "Users can read own recordings"
ON recordings
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'admin' OR
  (auth.jwt() ->> 'email') = 'tellitlikeitisjoe@gmail.com' OR
  (auth.jwt() ->> 'email') = 'thejoeycagle@gmail.com' OR
  (auth.jwt() ->> 'email') LIKE '%@admin.com'
);