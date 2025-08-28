/*
  # Add response time tracking

  1. Changes
    - Add response_time column to recordings table to store the time taken to start recording
    - Add index on response_time for better query performance
*/

-- Add response time column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recordings' AND column_name = 'response_time'
  ) THEN
    ALTER TABLE recordings ADD COLUMN response_time integer;
    
    -- Add index for response time queries
    CREATE INDEX IF NOT EXISTS recordings_response_time_idx ON recordings(response_time);
  END IF;
END $$;