import { createClient } from "@supabase/supabase-js"

export async function POST() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Create storage bucket for gallery files
    const { data, error } = await supabase.storage.createBucket("gallery-files", {
      public: true,
      allowedMimeTypes: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
        "video/mp4",
        "video/webm",
        "video/quicktime",
      ],
      fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
    })

    if (error) {
      if (error.message.includes("already exists") || error.message.includes("Bucket already exists")) {
        console.log("Storage bucket already exists, continuing...")
      } else {
        console.error("Error creating storage bucket:", error)
        return Response.json({ error: error.message }, { status: 500 })
      }
    }

    return Response.json({ success: true, message: "Storage bucket ready" })
  } catch (error) {
    console.error("Error setting up storage:", error)
    return Response.json({ error: "Failed to setup storage" }, { status: 500 })
  }
}
