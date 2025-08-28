import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { uploadRequestSchema } from "@/lib/validation"
import { handleApiError, createAppError, ERROR_CODES } from "@/lib/errors"
import { ImageCompressionService } from "@/lib/services/image-compression"
import { VideoCompressionService } from "@/lib/services/video-compression"
import type { ApiResponse } from "@/types"

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    console.log("[v0] Upload API called")

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw createAppError(ERROR_CODES.INTERNAL_ERROR, "Server configuration error: Missing Supabase credentials")
    }

    // Parse form data
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (error) {
      throw createAppError(ERROR_CODES.VALIDATION_ERROR, "Invalid form data format")
    }

    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const tagsString = formData.get("tags") as string

    // Validate required fields
    if (!file) {
      throw createAppError(ERROR_CODES.VALIDATION_ERROR, "No file provided")
    }

    // Parse and validate tags
    let tags: string[] = []
    if (tagsString) {
      try {
        tags = JSON.parse(tagsString)
        if (!Array.isArray(tags)) {
          throw new Error("Tags must be an array")
        }
      } catch (error) {
        throw createAppError(ERROR_CODES.VALIDATION_ERROR, "Invalid tags format")
      }
    }

    // Validate the request data
    const validationResult = uploadRequestSchema.safeParse({
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
      title: title || file.name.replace(/\.[^/.]+$/, ""),
      tags,
    })

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors.map(e => e.message).join(", ")
      throw createAppError(ERROR_CODES.VALIDATION_ERROR, errorMessage)
    }

    const validatedData = validationResult.data
    console.log("[v0] File received:", file?.name, "Size:", file?.size)

    // Initialize Supabase client
    let supabase
    try {
      supabase = createServerClient()
      console.log("[v0] Supabase client created successfully")
    } catch (error) {
      throw createAppError(ERROR_CODES.DATABASE_ERROR, "Failed to connect to database")
    }

    // Ensure storage bucket exists
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      
      if (bucketsError) {
        throw createAppError(ERROR_CODES.STORAGE_ERROR, `Storage error: ${bucketsError.message}`)
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
          throw createAppError(ERROR_CODES.STORAGE_ERROR, `Failed to create storage bucket: ${createBucketError.message}`)
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("STORAGE_ERROR")) {
        throw error
      }
      throw createAppError(ERROR_CODES.STORAGE_ERROR, "Storage configuration failed")
    }

    // Compress file if applicable (image or video)
    let fileToUpload: File | Buffer | Blob = file
    let finalFileSize = file.size
    let compressionInfo = ""
    let finalMimeType = file.type

    if (ImageCompressionService.shouldCompress(file.type, file.size)) {
      try {
        console.log("[v0] Compressing image:", file.name, "Original size:", Math.round(file.size / 1024), "KB")
        
        const buffer = Buffer.from(await file.arrayBuffer())
        const compressionSettings = ImageCompressionService.getOptimalSettings(file.type, file.size)
        const compressed = await ImageCompressionService.compressImage(buffer, compressionSettings)
        
        fileToUpload = compressed.buffer
        finalFileSize = compressed.size
        finalMimeType = 'image/webp'
        compressionInfo = ` (compressed from ${Math.round(compressed.originalSize / 1024)}KB to ${Math.round(compressed.size / 1024)}KB, ${Math.round(compressed.compressionRatio * 100) / 100}x ratio)`
        
        console.log("[v0] Image compression complete:", compressionInfo)
      } catch (error) {
        console.warn("[v0] Image compression failed, using original file:", error)
        // Continue with original file if compression fails
      }
    } else if (VideoCompressionService.shouldCompress(file)) {
      try {
        console.log("[v0] Compressing video:", file.name, "Original size:", Math.round(file.size / (1024 * 1024)), "MB")
        
        // Add timeout for server-side video processing
        const compressionPromise = VideoCompressionService.optimizeVideo(file)
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Server video compression timeout')), 2 * 60 * 1000) // 2 minutes
        )
        
        const compressed = await Promise.race([compressionPromise, timeoutPromise])
        
        fileToUpload = compressed.blob
        finalFileSize = compressed.compressedSize
        finalMimeType = compressed.blob.type
        compressionInfo = ` (compressed from ${VideoCompressionService.formatFileSize(compressed.originalSize)} to ${VideoCompressionService.formatFileSize(compressed.compressedSize)}, ${Math.round(compressed.compressionRatio * 100) / 100}x ratio)`
        
        console.log("[v0] Video compression complete:", compressionInfo)
      } catch (error) {
        console.warn("[v0] Video compression failed, using original file:", error)
        // Continue with original file if compression fails
      }
    } else if (file.name.toLowerCase().endsWith('.mov') || file.type.includes('quicktime')) {
      console.log("[v0] Skipping compression for MOV/QuickTime file:", file.name, "Size:", Math.round(file.size / (1024 * 1024)), "MB")
      compressionInfo = " (MOV file - compression skipped for compatibility)"
    }

    // Generate unique filename with appropriate extension
    const originalExt = file.name.split(".").pop()
    let finalExt = originalExt
    
    if (fileToUpload instanceof Buffer) {
      finalExt = 'webp'
    } else if (fileToUpload instanceof Blob && fileToUpload.type.includes('webm')) {
      finalExt = 'webm'
    }
    
    // Ensure MOV files maintain proper extension
    if (file.name.toLowerCase().endsWith('.mov') && finalExt?.toLowerCase() !== 'mov') {
      finalExt = 'mov'
      // Set proper MIME type for MOV files if it's missing or incorrect
      if (!finalMimeType.includes('quicktime') && !finalMimeType.includes('mov')) {
        finalMimeType = 'video/quicktime'
      }
    }
    
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${finalExt}`
    const filePath = `uploads/${fileName}`

    console.log("[v0] Uploading file to:", filePath + compressionInfo)

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("design-vault")
      .upload(filePath, fileToUpload, {
        cacheControl: "3600",
        upsert: false,
        contentType: finalMimeType,
      })

    if (uploadError) {
      throw createAppError(ERROR_CODES.UPLOAD_FAILED, `Storage upload failed: ${uploadError.message}`)
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
        title: validatedData.title,
        file_path: publicUrl,
        file_type: finalMimeType,
        file_size: finalFileSize,
        tags: validatedData.tags,
      })
      .select()
      .single()

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from("design-vault").remove([filePath])
      throw createAppError(ERROR_CODES.DATABASE_ERROR, `Failed to save file metadata: ${dbError.message}`)
    }

    console.log("[v0] File metadata saved:", dbData.id)

    const response: ApiResponse = {
      success: true,
      data: {
        file: {
          id: dbData.id,
          title: dbData.title,
          file_path: dbData.file_path,
          file_type: dbData.file_type,
          file_size: dbData.file_size,
          tags: dbData.tags,
          created_at: dbData.created_at,
        },
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Upload API error:", error)
    
    const { response, status } = handleApiError(error, "Upload API")
    return NextResponse.json(response, { status })
  }
}
