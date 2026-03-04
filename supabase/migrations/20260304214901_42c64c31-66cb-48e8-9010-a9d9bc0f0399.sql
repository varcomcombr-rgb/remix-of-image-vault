-- Create public storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('varcom', 'varcom', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view files (public access)
CREATE POLICY "Public read access for varcom"
ON storage.objects FOR SELECT
USING (bucket_id = 'varcom');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload to varcom"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'varcom');

-- Allow authenticated users to update/overwrite files
CREATE POLICY "Authenticated users can update varcom files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'varcom');

-- Allow authenticated users to delete varcom files
CREATE POLICY "Authenticated users can delete varcom files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'varcom');