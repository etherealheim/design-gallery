-- Create the uploaded_files table
CREATE TABLE IF NOT EXISTS public.uploaded_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (since this is a design gallery)
CREATE POLICY "Allow public read access" ON public.uploaded_files
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON public.uploaded_files
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON public.uploaded_files
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access" ON public.uploaded_files
  FOR DELETE USING (true);

-- Create storage bucket for uploaded files
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploaded-files', 'uploaded-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'uploaded-files');

CREATE POLICY "Allow public downloads" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploaded-files');

CREATE POLICY "Allow public updates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'uploaded-files');

CREATE POLICY "Allow public deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'uploaded-files');
