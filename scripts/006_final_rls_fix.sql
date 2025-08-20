-- Disable RLS on uploaded_files table and grant public access
ALTER TABLE public.uploaded_files DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to anon and authenticated users
GRANT ALL ON public.uploaded_files TO anon;
GRANT ALL ON public.uploaded_files TO authenticated;

-- Ensure storage bucket exists and has proper policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('design-vault', 'design-vault', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for public access
CREATE POLICY "Public Access" ON storage.objects FOR ALL USING (bucket_id = 'design-vault');

-- Grant storage permissions
GRANT ALL ON storage.objects TO anon;
GRANT ALL ON storage.buckets TO anon;
