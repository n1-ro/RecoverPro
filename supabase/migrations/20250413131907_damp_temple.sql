/*
  # Add new admin user

  1. Changes
    - Add new admin user email to profiles table
    - Update admin policies to include new admin email
    
  2. Security
    - Maintain existing RLS policies
    - Add new admin email to policy conditions
*/

-- Update admin policies to include new admin email
DROP POLICY IF EXISTS "Admins can change roles" ON profiles;

CREATE POLICY "Admins can change roles"
ON profiles
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'email'::text) IN ('tellitlikeitisjoe@gmail.com', 'thejoeycagle@gmail.com') 
  OR (auth.jwt() ->> 'email'::text) LIKE '%@admin.com'
)
WITH CHECK (
  (auth.jwt() ->> 'email'::text) IN ('tellitlikeitisjoe@gmail.com', 'thejoeycagle@gmail.com') 
  OR (auth.jwt() ->> 'email'::text) LIKE '%@admin.com'
);

-- Set admin role for new email
DO $$
BEGIN
  INSERT INTO public.profiles (id, email, role_type)
  SELECT 
    id,
    email,
    'admin'::text
  FROM auth.users
  WHERE email = 'tellitlikeitisjoe@gmail.com'
  ON CONFLICT (id) DO UPDATE
  SET role_type = 'admin'::text;
END $$;