/*
  # Add contact information fields to profiles table

  1. Changes
    - Add full_name column to profiles table to store applicant's full name
    - Add phone_number column to profiles table to store applicant's phone number
    - Add address column to profiles table to store applicant's address (optional)
    - Add desired_salary column to profiles table (optional)
    - Add employment_status column to profiles table (optional)
  
  2. Purpose
    - Collect essential contact information from applicants after assessment completion
    - Allow for better applicant tracking and follow-up
*/

-- Add contact information fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS desired_salary TEXT,
ADD COLUMN IF NOT EXISTS employment_status TEXT;