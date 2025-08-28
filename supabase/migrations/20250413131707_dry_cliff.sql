/*
  # Fix profiles table schema and policies

  1. Changes
    - Ensure profiles table exists with correct schema
    - Add role_type column with proper constraints
    - Set up RLS policies for admin access
    
  2. Security
    - Enable RLS on profiles table
    - Add policies for admin and user access
    - Ensure proper role type validation
*/

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  attempts integer DEFAULT 1,
  interview_started_at timestamptz,
  role_type text NOT NULL DEFAULT 'applicant'::text
    CHECK (role_type = ANY (ARRAY['admin'::text, 'applicant'::text]))
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admin users can access all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can change roles" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can only be applicants" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new policies
CREATE POLICY "Admin users can access all profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (role_type = 'admin'::text)
  WITH CHECK (role_type = 'admin'::text);

CREATE POLICY "Admins can change roles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (((auth.jwt() ->> 'email'::text) = 'thejoeycagle@gmail.com'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@admin.com'::text))
  WITH CHECK (((auth.jwt() ->> 'email'::text) = 'thejoeycagle@gmail.com'::text) OR ((auth.jwt() ->> 'email'::text) ~~ '%@admin.com'::text));

CREATE POLICY "Users can create their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can only be applicants"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (role_type = 'applicant'::text);

CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Set admin role for specific email
DO $$
BEGIN
  INSERT INTO public.profiles (id, email, role_type)
  SELECT 
    id,
    email,
    'admin'::text
  FROM auth.users
  WHERE email = 'thejoeycagle@gmail.com'
  ON CONFLICT (id) DO UPDATE
  SET role_type = 'admin'::text;
END $$;