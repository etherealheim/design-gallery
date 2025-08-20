-- Create storage bucket for design vault
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'design-vault',
  'design-vault', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/*', 'video/*']
) ON CONFLICT (id) DO NOTHING;

-- Disable RLS on uploaded_files table
ALTER TABLE public.uploaded_files DISABLE ROW LEVEL SECURITY;

-- Grant permissions to anonymous users for uploaded_files table
GRANT ALL ON public.uploaded_files TO anon;
GRANT ALL ON public.uploaded_files TO authenticated;

-- Set up storage policies for public access
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'design-vault');
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'design-vault');
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'design-vault');
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'design-vault');

-- Enable RLS on storage.objects (required for policies to work)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant storage permissions
GRANT ALL ON storage.objects TO anon;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO anon;
GRANT ALL ON storage.buckets TO authenticated;
