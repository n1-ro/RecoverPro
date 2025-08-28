/*
  # Fix assessment completion tracking

  1. Changes
    - Add completed_at column to profiles table to track when users finish the assessment
    - Add constraint to ensure completed_at is after interview_started_at
    - Add index for better query performance
*/

-- Add completed_at column to profiles
ALTER TABLE profiles
ADD COLUMN completed_at timestamptz DEFAULT NULL;

-- Add index for better performance
CREATE INDEX profiles_completed_at_idx ON profiles(completed_at);

-- Add constraint to ensure completed_at is after interview_started_at
ALTER TABLE profiles
ADD CONSTRAINT profiles_completion_time_check
CHECK (completed_at IS NULL OR completed_at >= interview_started_at);