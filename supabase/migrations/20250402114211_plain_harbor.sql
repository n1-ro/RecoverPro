/*
  # Create storage bucket for recordings

  1. Storage
    - Create 'applicant-recordings' bucket for storing user recordings
    - Set up RLS policies for the bucket to allow authenticated users to:
      - Upload files to the bucket
      - Download their own files
      - Delete their own files 
*/

-- Note: This is a storage migration which is typically executed by an admin
-- via the Supabase dashboard or CLI, but we include it here for completeness

-- Storage buckets are created via the Supabase admin API
-- This SQL represents what you would need to do via the Supabase dashboard:
-- 1. Go to Storage in the Supabase dashboard
-- 2. Click "Create a new bucket"
-- 3. Name it "applicant-recordings"
-- 4. Make it not public
-- 5. Set file size limit to 50MB

-- We still can create the storage policies via SQL
DO $$
BEGIN
    -- Allow authenticated users to upload their own recordings
    EXECUTE format('
        CREATE POLICY "Allow users to upload their recordings" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (
            bucket_id = ''applicant-recordings'' AND
            (storage.foldername(name))[1] = ''recordings'' AND
            (storage.foldername(name))[2] = auth.uid()::text
        );
    ');

    -- Allow users to access only their own recordings
    EXECUTE format('
        CREATE POLICY "Allow users to read their own recordings" ON storage.objects
        FOR SELECT TO authenticated
        USING (
            bucket_id = ''applicant-recordings'' AND
            (storage.foldername(name))[1] = ''recordings'' AND
            (storage.foldername(name))[2] = auth.uid()::text
        );
    ');

    -- Allow users to delete their own recordings
    EXECUTE format('
        CREATE POLICY "Allow users to delete their own recordings" ON storage.objects
        FOR DELETE TO authenticated
        USING (
            bucket_id = ''applicant-recordings'' AND
            (storage.foldername(name))[1] = ''recordings'' AND
            (storage.foldername(name))[2] = auth.uid()::text
        );
    ');
END $$;