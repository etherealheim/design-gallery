-- Disable RLS on uploaded_files table and grant public access
ALTER TABLE public.uploaded_files DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to anonymous users
GRANT ALL ON public.uploaded_files TO anon;
GRANT ALL ON public.uploaded_files TO authenticated;

-- Grant usage on the sequence if it exists
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'design-vault',
  'design-vault', 
  true,
  52428800, -- 50MB
  ARRAY['image/*', 'video/*']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for public access
CREATE POLICY "Public Access" ON storage.objects FOR ALL USING (bucket_id = 'design-vault');
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'design-vault');
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'design-vault');
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'design-vault');

-- Enable RLS on storage.objects but allow public access
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
