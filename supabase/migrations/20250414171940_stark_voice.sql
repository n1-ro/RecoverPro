/*
  # Fix admin access to applicant recordings

  1. Changes
    - Update storage policies to ensure admins can access all recordings
    - Add more robust policy checks for admin users
    - Fix issue with signed URL generation for admin users
    
  2. Security
    - Maintain existing RLS policies for user data
    - Properly implement admin access control
*/

-- Update the storage policies for admin access to recordings
DO $$
BEGIN
  -- Clear existing policies to avoid conflicts
  BEGIN
    DROP POLICY IF EXISTS "Allow users to read their own recordings" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can access all recordings" ON storage.objects;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore errors if policies don't exist
  END;

  -- Create a more permissive policy for admins to access all recordings
  EXECUTE format('
    CREATE POLICY "Allow users to read recordings" ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = ''applicant-recordings'' AND (
        -- User can access their own recordings
        auth.uid()::text = (storage.foldername(name))[1] OR
        -- Admin access with multiple conditions for more robustness
        (
          -- Check role_type from profiles
          EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role_type = ''admin''
          ) OR
          -- Check special admin emails
          (auth.jwt() ->> ''email'') = ''tellitlikeitisjoe@gmail.com'' OR
          (auth.jwt() ->> ''email'') = ''thejoeycagle@gmail.com'' OR
          (auth.jwt() ->> ''email'') LIKE ''%%@admin.com''
        )
      )
    );
  ');
END $$;

-- Refresh the text_responses policies for admin access
DROP POLICY IF EXISTS "Admins can manage all text responses" ON text_responses;

CREATE POLICY "Admins can manage all text responses"
ON text_responses
FOR ALL
TO authenticated
USING (
  (auth.uid() = user_id) OR
  (( SELECT profiles.role_type FROM profiles WHERE profiles.id = auth.uid()) = 'admin') OR
  ((auth.jwt() ->> 'email') = 'tellitlikeitisjoe@gmail.com') OR
  ((auth.jwt() ->> 'email') = 'thejoeycagle@gmail.com') OR
  ((auth.jwt() ->> 'email') LIKE '%@admin.com')
)
WITH CHECK (
  (auth.uid() = user_id) OR
  (( SELECT profiles.role_type FROM profiles WHERE profiles.id = auth.uid()) = 'admin') OR
  ((auth.jwt() ->> 'email') = 'tellitlikeitisjoe@gmail.com') OR
  ((auth.jwt() ->> 'email') = 'thejoeycagle@gmail.com') OR
  ((auth.jwt() ->> 'email') LIKE '%@admin.com')
);

-- Add clear index on recordings user_id for better performance
CREATE INDEX IF NOT EXISTS recordings_user_id_idx ON recordings(user_id);