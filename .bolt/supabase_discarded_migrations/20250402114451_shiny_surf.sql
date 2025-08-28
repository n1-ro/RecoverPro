/*
  # Storage bucket setup instructions

  1. Storage
    - This migration includes instructions for creating the required storage bucket
    - No SQL statements are executed here since bucket creation requires admin privileges
    
  Note: This is a documentation migration rather than an executable migration
*/

-- The 'applicant-recordings' bucket must be created manually in the Supabase dashboard
-- Please follow these steps:

-- 1. Log in to the Supabase dashboard
-- 2. Navigate to your project
-- 3. Go to the "Storage" section
-- 4. Click "Create new bucket"
-- 5. Enter the name "applicant-recordings"
-- 6. Ensure "Public bucket" is UNCHECKED (should be private)
-- 7. Save the bucket

-- Once the bucket is created, the following policies will ensure proper access control

-- Allow authenticated users to upload their own recordings
CREATE POLICY "Allow users to upload their recordings" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'applicant-recordings' AND
    (storage.foldername(name))[1] = 'recordings' AND
    (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to access only their own recordings
CREATE POLICY "Allow users to read their own recordings" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'applicant-recordings' AND
    (storage.foldername(name))[1] = 'recordings' AND
    (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to delete their own recordings
CREATE POLICY "Allow users to delete their own recordings" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'applicant-recordings' AND
    (storage.foldername(name))[1] = 'recordings' AND
    (storage.foldername(name))[2] = auth.uid()::text
);