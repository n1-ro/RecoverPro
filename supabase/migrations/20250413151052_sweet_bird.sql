/*
  # Add current scenario tracking

  1. Changes
    - Add current_scenario_index to profiles table to track user progress
    - Add index on current_scenario_index for better query performance
    - Add constraint to ensure index is non-negative
*/

-- Add current_scenario_index to profiles table
ALTER TABLE profiles
ADD COLUMN current_scenario_index integer DEFAULT 0;

-- Add index for better performance
CREATE INDEX profiles_current_scenario_idx ON profiles(current_scenario_index);

-- Add constraint to ensure non-negative index
ALTER TABLE profiles
ADD CONSTRAINT profiles_current_scenario_index_check 
CHECK (current_scenario_index >= 0);