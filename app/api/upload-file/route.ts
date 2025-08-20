import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Upload API called")

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[v0] Missing Supabase environment variables")
      return NextResponse.json({ error: "Server configuration error: Missing Supabase credentials" }, { status: 500 })
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch (error) {
      console.error("[v0] Error parsing form data:", error)
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
    }

    const file = formData.get("file") as File
    const title = formData.get("title") as string
    let tags: string[] = []

    try {
      tags = JSON.parse((formData.get("tags") as string) || "[]")
    } catch (error) {
      console.error("[v0] Error parsing tags:", error)
      tags = []
    }

    console.log("[v0] File received:", file?.name, "Size:", file?.size)

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    let supabase
    try {
      supabase = createServerClient()
      console.log("[v0] Supabase client created successfully")
    } catch (error) {
      console.error("[v0] Error creating Supabase client:", error)
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    console.log(
      "[v0] Available buckets:",
      buckets?.map((b) => b.name),
    )

    if (bucketsError) {
      console.error("[v0] Error listing buckets:", bucketsError)
      return NextResponse.json({ error: "Storage configuration error" }, { status: 500 })
    }

    const bucketExists = buckets?.some((bucket) => bucket.name === "design-vault")
    if (!bucketExists) {
      console.log("[v0] Creating design-vault bucket")
      const { error: createBucketError } = await supabase.storage.createBucket("design-vault", {
        public: true,
        allowedMimeTypes: ["image/*", "video/*"],
        fileSizeLimit: 50 * 1024 * 1024, // 50MB
      })

      if (createBucketError && !createBucketError.message.includes("already exists")) {
        console.error("[v0] Error creating bucket:", createBucketError)
        return NextResponse.json({ error: "Failed to create storage bucket" }, { status: 500 })
      }
    }

    // Upload file to storage
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `uploads/${fileName}`

    console.log("[v0] Uploading file to:", filePath)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("design-vault")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("[v0] Storage upload error:", uploadError)
      return NextResponse.json({ error: `Failed to upload file: ${uploadError.message}` }, { status: 500 })
    }

    console.log("[v0] File uploaded successfully:", uploadData.path)

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("design-vault").getPublicUrl(filePath)

    console.log("[v0] Public URL:", publicUrl)

    // Insert metadata into database (service role bypasses RLS)
    const { data: dbData, error: dbError } = await supabase
      .from("uploaded_files")
      .insert({
        title: title || file.name,
        file_path: publicUrl,
        file_type: file.type,
        file_size: file.size,
        tags: tags,
      })
      .select()
      .single()

    if (dbError) {
      console.error("[v0] Database insert error:", dbError)
      // Clean up uploaded file if database insert fails
      await supabase.storage.from("design-vault").remove([filePath])
      return NextResponse.json({ error: `Failed to save file metadata: ${dbError.message}` }, { status: 500 })
    }

    console.log("[v0] File metadata saved:", dbData.id)

    return NextResponse.json({
      success: true,
      file: {
        id: dbData.id,
        title: dbData.title,
        file_path: dbData.file_path,
        file_type: dbData.file_type,
        file_size: dbData.file_size,
        tags: dbData.tags,
        created_at: dbData.created_at,
      },
    })
  } catch (error) {
    console.error("[v0] Upload API error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const stack = error instanceof Error ? error.stack : "No stack trace"
    console.error("[v0] Error stack:", stack)

    return NextResponse.json(
      {
        error: `Internal server error: ${errorMessage}`,
        details: process.env.NODE_ENV === "development" ? stack : undefined,
      },
      { status: 500 },
    )
  }
}
