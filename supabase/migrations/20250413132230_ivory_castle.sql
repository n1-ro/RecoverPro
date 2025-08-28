/*
  # Fix admin access policies and profile setup

  1. Changes
    - Update admin access policy to include specific admin emails
    - Ensure admin profiles are properly set up
    - Fix policy conditions for admin access

  2. Security
    - Maintain strict access control for admin users
    - Ensure only authorized emails can access admin features
*/

-- Drop and recreate the admin access policy with correct conditions
DROP POLICY IF EXISTS "Admin users can access all profiles" ON profiles;

CREATE POLICY "Admin users can access all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  role_type = 'admin'::text OR
  auth.jwt() ->> 'email' = 'tellitlikeitisjoe@gmail.com' OR
  auth.jwt() ->> 'email' = 'thejoeycagle@gmail.com' OR
  auth.jwt() ->> 'email' LIKE '%@admin.com'
)
WITH CHECK (
  role_type = 'admin'::text OR
  auth.jwt() ->> 'email' = 'tellitlikeitisjoe@gmail.com' OR
  auth.jwt() ->> 'email' = 'thejoeycagle@gmail.com' OR
  auth.jwt() ->> 'email' LIKE '%@admin.com'
);

-- Ensure admin profile exists and has correct role
DO $$
BEGIN
  -- Insert or update profile for tellitlikeitisjoe@gmail.com
  INSERT INTO profiles (id, email, role_type)
  SELECT 
    id,
    email,
    'admin'::text
  FROM auth.users
  WHERE email = 'tellitlikeitisjoe@gmail.com'
  ON CONFLICT (id) DO UPDATE
  SET role_type = 'admin'::text;

  -- Update any existing profile to ensure it has admin role
  UPDATE profiles
  SET role_type = 'admin'
  WHERE email = 'tellitlikeitisjoe@gmail.com'
  AND role_type != 'admin';
END $$;