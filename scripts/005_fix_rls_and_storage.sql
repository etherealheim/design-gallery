-- Comprehensive script to disable RLS and set up storage properly

-- Disable RLS on uploaded_files table
ALTER TABLE public.uploaded_files DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to anonymous and authenticated users
GRANT ALL ON public.uploaded_files TO anon;
GRANT ALL ON public.uploaded_files TO authenticated;

-- Grant usage on the sequence if it exists
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('design-vault', 'design-vault', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the bucket
DELETE FROM storage.policies WHERE bucket_id = 'design-vault';

-- Allow public access to upload files
CREATE POLICY "Public upload access" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'design-vault');

-- Allow public access to view files
CREATE POLICY "Public view access" ON storage.objects
FOR SELECT USING (bucket_id = 'design-vault');

-- Allow public access to delete files
CREATE POLICY "Public delete access" ON storage.objects
FOR DELETE USING (bucket_id = 'design-vault');

-- Allow public access to update files
CREATE POLICY "Public update access" ON storage.objects
FOR UPDATE USING (bucket_id = 'design-vault');
