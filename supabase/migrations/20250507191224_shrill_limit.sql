/*
  # Add mike@test.com to admin accounts

  1. Changes
    - Update all admin-related policies to include mike@test.com as an admin email
    - Ensure any profile for mike@test.com gets admin role_type
    - Update the trigger function that sets admin role during profile creation

  2. Security
    - Maintain existing RLS policies with additional admin access
    - Ensure consistent admin privileges across all resources
*/

-- Update admin access policy for profiles
DROP POLICY IF EXISTS "Admin users can access all profiles" ON profiles;

CREATE POLICY "Admin users can access all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  role_type = 'admin' OR
  (auth.jwt() ->> 'email') = 'tellitlikeitisjoe@gmail.com' OR
  (auth.jwt() ->> 'email') = 'thejoeycagle@gmail.com' OR
  (auth.jwt() ->> 'email') = 'mike@test.com' OR
  (auth.jwt() ->> 'email') LIKE '%@admin.com'
)
WITH CHECK (
  role_type = 'admin' OR
  (auth.jwt() ->> 'email') = 'tellitlikeitisjoe@gmail.com' OR
  (auth.jwt() ->> 'email') = 'thejoeycagle@gmail.com' OR
  (auth.jwt() ->> 'email') = 'mike@test.com' OR
  (auth.jwt() ->> 'email') LIKE '%@admin.com'
);

-- Update role modification policy
DROP POLICY IF EXISTS "Admins can change roles" ON profiles;

CREATE POLICY "Admins can change roles"
ON profiles
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'email') = 'tellitlikeitisjoe@gmail.com' OR
  (auth.jwt() ->> 'email') = 'thejoeycagle@gmail.com' OR
  (auth.jwt() ->> 'email') = 'mike@test.com' OR
  (auth.jwt() ->> 'email') LIKE '%@admin.com'
)
WITH CHECK (
  (auth.jwt() ->> 'email') = 'tellitlikeitisjoe@gmail.com' OR
  (auth.jwt() ->> 'email') = 'thejoeycagle@gmail.com' OR
  (auth.jwt() ->> 'email') = 'mike@test.com' OR
  (auth.jwt() ->> 'email') LIKE '%@admin.com'
);

-- Update admin profile trigger function
CREATE OR REPLACE FUNCTION before_profile_insert()
RETURNS trigger AS $$
BEGIN
  IF NEW.email IN ('tellitlikeitisjoe@gmail.com', 'thejoeycagle@gmail.com', 'mike@test.com') 
     OR NEW.email LIKE '%@admin.com' THEN
    NEW.role_type := 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update scenario management policy
DROP POLICY IF EXISTS "Admins can manage scenarios" ON scenarios;

CREATE POLICY "Admins can manage scenarios"
ON scenarios
FOR ALL
TO authenticated
USING (
  (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'admin' OR
  (auth.jwt() ->> 'email') = 'tellitlikeitisjoe@gmail.com' OR
  (auth.jwt() ->> 'email') = 'thejoeycagle@gmail.com' OR
  (auth.jwt() ->> 'email') = 'mike@test.com' OR
  (auth.jwt() ->> 'email') LIKE '%@admin.com'
)
WITH CHECK (
  (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'admin' OR
  (auth.jwt() ->> 'email') = 'tellitlikeitisjoe@gmail.com' OR
  (auth.jwt() ->> 'email') = 'thejoeycagle@gmail.com' OR
  (auth.jwt() ->> 'email') = 'mike@test.com' OR
  (auth.jwt() ->> 'email') LIKE '%@admin.com'
);

-- Update admin access to recordings
DROP POLICY IF EXISTS "Admins can manage all recordings" ON recordings;

CREATE POLICY "Admins can manage all recordings"
ON recordings
FOR ALL
TO authenticated
USING (
  (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'admin' OR
  (auth.jwt() ->> 'email') = 'tellitlikeitisjoe@gmail.com' OR
  (auth.jwt() ->> 'email') = 'thejoeycagle@gmail.com' OR
  (auth.jwt() ->> 'email') = 'mike@test.com' OR
  (auth.jwt() ->> 'email') LIKE '%@admin.com'
)
WITH CHECK (
  (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'admin' OR
  (auth.jwt() ->> 'email') = 'tellitlikeitisjoe@gmail.com' OR
  (auth.jwt() ->> 'email') = 'thejoeycagle@gmail.com' OR
  (auth.jwt() ->> 'email') = 'mike@test.com' OR
  (auth.jwt() ->> 'email') LIKE '%@admin.com'
);

-- Update text responses admin policy
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
  ((auth.jwt() ->> 'email') = 'mike@test.com') OR
  ((auth.jwt() ->> 'email') LIKE '%@admin.com')
)
WITH CHECK (
  (auth.uid() = user_id) OR
  (( SELECT profiles.role_type FROM profiles WHERE profiles.id = auth.uid()) = 'admin') OR
  ((auth.jwt() ->> 'email') = 'tellitlikeitisjoe@gmail.com') OR
  ((auth.jwt() ->> 'email') = 'thejoeycagle@gmail.com') OR
  ((auth.jwt() ->> 'email') = 'mike@test.com') OR
  ((auth.jwt() ->> 'email') LIKE '%@admin.com')
);

-- Update ratings admin policy
DROP POLICY IF EXISTS "Admins can manage all ratings" ON response_ratings;

CREATE POLICY "Admins can manage all ratings"
ON response_ratings
FOR ALL
TO authenticated
USING (
  (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'admin' OR
  (auth.jwt() ->> 'email') = 'tellitlikeitisjoe@gmail.com' OR
  (auth.jwt() ->> 'email') = 'thejoeycagle@gmail.com' OR
  (auth.jwt() ->> 'email') = 'mike@test.com' OR
  (auth.jwt() ->> 'email') LIKE '%@admin.com'
)
WITH CHECK (
  (SELECT role_type FROM profiles WHERE id = auth.uid()) = 'admin' OR
  (auth.jwt() ->> 'email') = 'tellitlikeitisjoe@gmail.com' OR
  (auth.jwt() ->> 'email') = 'thejoeycagle@gmail.com' OR
  (auth.jwt() ->> 'email') = 'mike@test.com' OR
  (auth.jwt() ->> 'email') LIKE '%@admin.com'
);

-- Update storage policies if possible (these can sometimes be more restricted by the Supabase environment)
DO $$
BEGIN
  BEGIN
    DROP POLICY IF EXISTS "Admins can access all recordings" ON storage.objects;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Try to create updated storage policy
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
            email = ''mike@test.com'' OR
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
            email = ''mike@test.com'' OR
            email LIKE ''%%@admin.com''
          )
        )
      )
    );
  ');
EXCEPTION WHEN OTHERS THEN
  -- Allow failure for storage policies as they might need to be managed through the Supabase UI
  NULL;
END $$;

-- Set admin role for mike@test.com if the profile exists
UPDATE profiles 
SET role_type = 'admin'
WHERE email = 'mike@test.com';