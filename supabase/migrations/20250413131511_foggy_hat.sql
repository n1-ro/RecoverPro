/*
  # Add role type to profiles table

  1. Changes
    - Add role_type column to profiles table with type 'admin' or 'applicant'
    - Set default role_type to 'applicant'
    - Backfill existing profiles with role_type based on email domain
    - Update RLS policies to use role_type for admin access

  2. Security
    - Maintains existing RLS policies
    - Adds role-based access control
*/

-- Add role_type column
ALTER TABLE profiles 
ADD COLUMN role_type text NOT NULL DEFAULT 'applicant'
CHECK (role_type IN ('admin', 'applicant'));

-- Backfill existing admin profiles
DO $$
BEGIN
  UPDATE profiles
  SET role_type = 'admin'
  WHERE email LIKE '%@admin.com';
END $$;

-- Update admin access policy to use role_type
DROP POLICY IF EXISTS "Admin users can access all profiles" ON profiles;

CREATE POLICY "Admin users can access all profiles"
ON profiles
FOR ALL
TO authenticated
USING (role_type = 'admin')
WITH CHECK (role_type = 'admin');

-- Ensure users can only set their own role_type to 'applicant'
CREATE POLICY "Users can only be applicants"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (role_type = 'applicant');

-- Allow admins to change role_type
CREATE POLICY "Admins can change roles"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'email' LIKE '%@admin.com')
WITH CHECK (auth.jwt() ->> 'email' LIKE '%@admin.com');