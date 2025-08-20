-- Create uploaded_files table to store file metadata
CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image' or 'video'
  file_size INTEGER,
  mime_type TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_uploaded_files_created_at ON uploaded_files(created_at DESC);

-- Create an index on tags for faster tag-based searches
CREATE INDEX IF NOT EXISTS idx_uploaded_files_tags ON uploaded_files USING GIN(tags);

-- Disable RLS for public access to uploaded files
ALTER TABLE uploaded_files DISABLE ROW LEVEL SECURITY;

-- Grant public access to the table
GRANT ALL ON uploaded_files TO anon;
GRANT ALL ON uploaded_files TO authenticated;
