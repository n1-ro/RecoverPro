/*
  # Fix admin login issues

  1. Changes
    - Update admin access policies to explicitly include specific admin emails
    - Ensure profiles for admin users have the correct role_type
    - Fix policy conditions for admin access
    - Make policies more permissive for special admin accounts

  2. Security
    - Ensure special admin accounts always have access
    - Enable proper role-based access control
*/

-- Drop and recreate the admin access policy with correct conditions
DROP POLICY IF EXISTS "Admin users can access all profiles" ON profiles;

CREATE POLICY "Admin users can access all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  (role_type = 'admin') OR 
  ((auth.jwt() ->> 'email') = 'tellitlikeitisjoe@gmail.com') OR
  ((auth.jwt() ->> 'email') = 'thejoeycagle@gmail.com') OR
  ((auth.jwt() ->> 'email') LIKE '%@admin.com')
)
WITH CHECK (
  (role_type = 'admin') OR 
  ((auth.jwt() ->> 'email') = 'tellitlikeitisjoe@gmail.com') OR
  ((auth.jwt() ->> 'email') = 'thejoeycagle@gmail.com') OR
  ((auth.jwt() ->> 'email') LIKE '%@admin.com')
);

-- Ensure admin profile exists and has correct role
DO $$
BEGIN
  -- Update any existing profile to ensure it has admin role
  UPDATE profiles
  SET role_type = 'admin'
  WHERE email IN ('tellitlikeitisjoe@gmail.com', 'thejoeycagle@gmail.com')
  OR email LIKE '%@admin.com';
  
  -- Create admin profiles if they don't exist yet
  INSERT INTO profiles (id, email, role_type)
  SELECT 
    id,
    email,
    'admin'
  FROM auth.users
  WHERE email IN ('tellitlikeitisjoe@gmail.com', 'thejoeycagle@gmail.com')
  AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.users.id
  );
END $$;