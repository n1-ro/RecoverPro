/*
  # Add interview tracking fields

  1. Changes
    - Add response_time column to recordings table
    - Add attempts column to profiles table
    - Add interview_started_at column to profiles table
*/

-- Add response time tracking to recordings
ALTER TABLE recordings 
ADD COLUMN IF NOT EXISTS response_time integer;

-- Add attempt tracking to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS attempts integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS interview_started_at timestamptz;