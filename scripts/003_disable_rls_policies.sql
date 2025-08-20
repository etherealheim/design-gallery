-- Disable Row Level Security for uploaded_files table to allow public access
ALTER TABLE public.uploaded_files DISABLE ROW LEVEL SECURITY;

-- Grant full access to the table for anonymous users
GRANT ALL ON public.uploaded_files TO anon;
GRANT ALL ON public.uploaded_files TO authenticated;

-- Ensure the storage bucket has proper policies
INSERT INTO storage.buckets (id, name, public) 
VALUES ('design-vault', 'design-vault', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for public access
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'design-vault');
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'design-vault');
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'design-vault');
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'design-vault');
