/*
  # Add response rating functionality for admins

  1. New Tables
    - `response_ratings`
      - `id` (uuid, primary key)
      - `recording_id` (uuid, nullable, references recordings.id)
      - `text_response_id` (uuid, nullable, references text_responses.id)
      - `rating` (integer, not null, range 1-10)
      - `feedback` (text, nullable)
      - `rated_by` (uuid, not null, references profiles.id)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on response_ratings table
    - Add policies for admins to manage all ratings
    - Add policies for users to view their own ratings

  3. Purpose
    - Allow admins to rate applicant responses on a scale of 1-10
    - Track who provided each rating
    - Provide optional feedback text for each rating
*/

-- Create response_ratings table
CREATE TABLE IF NOT EXISTS response_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID REFERENCES recordings(id) ON DELETE CASCADE,
  text_response_id UUID REFERENCES text_responses(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 10),
  feedback TEXT,
  rated_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure that either recording_id OR text_response_id is set, but not both
  CONSTRAINT one_response_type CHECK (
    (recording_id IS NULL AND text_response_id IS NOT NULL) OR
    (recording_id IS NOT NULL AND text_response_id IS NULL)
  )
);

-- Create index for better performance
CREATE INDEX response_ratings_recording_id_idx ON response_ratings(recording_id);
CREATE INDEX response_ratings_text_response_id_idx ON response_ratings(text_response_id);
CREATE INDEX response_ratings_rated_by_idx ON response_ratings(rated_by);

-- Enable RLS
ALTER TABLE response_ratings ENABLE ROW LEVEL SECURITY;

-- Admin policy for full management
CREATE POLICY "Admins can manage all ratings"
ON response_ratings
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

-- Users can view ratings for their own responses
CREATE POLICY "Users can view ratings for their responses"
ON response_ratings
FOR SELECT
TO authenticated
USING (
  -- For audio recordings
  (recording_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM recordings
    WHERE recordings.id = response_ratings.recording_id
    AND recordings.user_id = auth.uid()
  )) OR
  -- For text responses
  (text_response_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM text_responses
    WHERE text_responses.id = response_ratings.text_response_id
    AND text_responses.user_id = auth.uid()
  ))
);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_response_ratings_updated_at
BEFORE UPDATE ON response_ratings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();