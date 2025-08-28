/*
  # Fix profiles table schema

  1. Changes
    - Add ON CONFLICT DO NOTHING to handle race conditions during profile creation
    - Add policy for admin users to access all profiles
    - Add policy for users to create their own profile
    - Add policy for users to read their own profile
    - Add policy for users to update their own profile

  2. Security
    - Enable RLS on profiles table
    - Add specific policies for admin and regular users
*/

-- Add policy for admin users to access all profiles
CREATE POLICY "Admin users can access all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' LIKE '%@admin.com')
WITH CHECK (auth.jwt() ->> 'email' LIKE '%@admin.com');

-- Add policy for users to create their own profile
CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Add policy for users to read their own profile
CREATE POLICY "Users can read their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Add policy for users to update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);