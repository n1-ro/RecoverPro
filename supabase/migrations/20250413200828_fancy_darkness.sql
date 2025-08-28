/*
  # Add admin access policy for recordings

  1. Changes
    - Add policy to allow admins to view all recordings
    - Update existing policies to properly handle admin access
    
  2. Security
    - Maintains existing RLS policies
    - Adds admin access based on role_type and special admin emails
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own recordings" ON recordings;
DROP POLICY IF EXISTS "Users can create recordings" ON recordings;
DROP POLICY IF EXISTS "Users can delete own recordings" ON recordings;

-- Recreate policies with admin access
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

CREATE POLICY "Users can create recordings"
ON recordings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recordings"
ON recordings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add specific admin policy for all operations
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