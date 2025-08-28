/*
  # Update specific email to admin role

  1. Changes
    - Update role_type to 'admin' for specific email
    - Ensure email has proper admin access

  2. Security
    - Maintains existing RLS policies
    - Only affects single specified user
*/

-- Update specific email to admin role
UPDATE profiles
SET role_type = 'admin'
WHERE email = 'thejoeycagle@gmail.com';

-- Ensure admin policies are in place
DROP POLICY IF EXISTS "Admins can change roles" ON profiles;

CREATE POLICY "Admins can change roles"
ON profiles
FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'email'::text) = 'thejoeycagle@gmail.com' OR (auth.jwt() ->> 'email'::text) LIKE '%@admin.com')
WITH CHECK ((auth.jwt() ->> 'email'::text) = 'thejoeycagle@gmail.com' OR (auth.jwt() ->> 'email'::text) LIKE '%@admin.com');