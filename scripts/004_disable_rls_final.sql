-- Disable RLS on uploaded_files table to allow public access
ALTER TABLE public.uploaded_files DISABLE ROW LEVEL SECURITY;

-- Grant full access to anon and authenticated users
GRANT ALL ON public.uploaded_files TO anon;
GRANT ALL ON public.uploaded_files TO authenticated;

-- Ensure storage bucket policies allow public access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('design-vault', 'design-vault', true, 52428800, ARRAY['image/*', 'video/*'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/*', 'video/*'];

-- Allow public access to storage bucket
INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition, command)
VALUES 
  ('public_upload', 'design-vault', 'Allow public uploads', 'true', 'true', 'INSERT'),
  ('public_select', 'design-vault', 'Allow public downloads', 'true', 'true', 'SELECT'),
  ('public_delete', 'design-vault', 'Allow public deletes', 'true', 'true', 'DELETE')
ON CONFLICT (id) DO NOTHING;
