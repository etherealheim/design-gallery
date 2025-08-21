import { type NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { updateFileRequestSchema } from "@/lib/validation"
import { handleApiError, createAppError, ERROR_CODES } from "@/lib/errors"
import type { ApiResponse } from "@/types"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse<ApiResponse>> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    })

    const { id: fileId } = await params

    // Validate file ID
    if (!fileId || typeof fileId !== "string") {
      throw createAppError(ERROR_CODES.VALIDATION_ERROR, "Invalid file ID")
    }

    // Parse and validate request body
    let requestBody: unknown
    try {
      requestBody = await request.json()
    } catch (error) {
      throw createAppError(ERROR_CODES.VALIDATION_ERROR, "Invalid JSON in request body")
    }

    const validationResult = updateFileRequestSchema.safeParse(requestBody)
    
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors.map(e => e.message).join(", ")
      throw createAppError(ERROR_CODES.VALIDATION_ERROR, errorMessage)
    }

    const { title, tags } = validationResult.data

    // Build update object
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    }
    
    if (title !== undefined) updates.title = title
    if (tags !== undefined) updates.tags = tags

    // Perform update
    const { data, error } = await supabase
      .from("uploaded_files")
      .update(updates)
      .eq("id", fileId)
      .select()
      .single()

    if (error) {
      if (error.code === "PGRST116") { // Row not found
        throw createAppError(ERROR_CODES.FILE_NOT_FOUND, "File not found")
      }
      throw createAppError(ERROR_CODES.DATABASE_ERROR, `Failed to update file: ${error.message}`)
    }

    const response: ApiResponse = {
      success: true,
      data: {
        file: {
          id: data.id,
          title: data.title,
          tags: data.tags,
          file_path: data.file_path,
          file_type: data.file_type,
          file_size: data.file_size,
          created_at: data.created_at,
          updated_at: data.updated_at,
        },
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Update file error:", error)
    
    const { response, status } = handleApiError(error, "Update API")
    return NextResponse.json(response, { status })
  }
}
