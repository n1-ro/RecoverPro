/*
  # Fix admin login routing

  1. Changes
    - Update role_type for specific admin emails
    - Ensure admin users have proper access rights
    - Add indices for better query performance
    
  2. Security
    - Maintain existing RLS policies
    - Ensure special admin accounts always have access
*/

-- Set admin role for specific emails
UPDATE profiles
SET role_type = 'admin'
WHERE email IN ('tellitlikeitisjoe@gmail.com', 'thejoeycagle@gmail.com')
OR email LIKE '%@admin.com';

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

-- Create index on email for better performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

-- Create index on role_type for better performance
CREATE INDEX IF NOT EXISTS profiles_role_type_idx ON profiles(role_type);

-- Ensure any admin users get inserted with the correct role_type
CREATE OR REPLACE FUNCTION before_profile_insert()
RETURNS trigger AS $$
BEGIN
  IF NEW.email IN ('tellitlikeitisjoe@gmail.com', 'thejoeycagle@gmail.com') 
     OR NEW.email LIKE '%@admin.com' THEN
    NEW.role_type := 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_admin_role_on_insert ON profiles;

CREATE TRIGGER set_admin_role_on_insert
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION before_profile_insert();