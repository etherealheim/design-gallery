import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { handleApiError, createAppError, ERROR_CODES } from "@/lib/errors"
import type { ApiResponse } from "@/types"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse<ApiResponse>> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })
    const { id: fileId } = await params

    // Validate file ID
    if (!fileId || typeof fileId !== "string") {
      throw createAppError(ERROR_CODES.VALIDATION_ERROR, "Invalid file ID")
    }

    // Get the file info to delete from storage
    const { data: fileData, error: fetchError } = await supabase
      .from("uploaded_files")
      .select("file_path")
      .eq("id", fileId)
      .single()

    if (fetchError) {
      if (fetchError.code === "PGRST116") { // Row not found
        throw createAppError(ERROR_CODES.FILE_NOT_FOUND, "File not found")
      }
      throw createAppError(ERROR_CODES.DATABASE_ERROR, `Failed to fetch file: ${fetchError.message}`)
    }

    // Extract file path for storage deletion
    let storagePath: string
    try {
      // Extract path from full URL if needed
      const url = new URL(fileData.file_path)
      storagePath = url.pathname.split("/").slice(-2).join("/") // Get last two path segments
    } catch {
      // If it's already a path, use it directly
      storagePath = fileData.file_path
    }

    // Delete from storage first (non-critical if fails)
    try {
      const { error: storageError } = await supabase.storage
        .from("design-vault")
        .remove([storagePath])

      if (storageError) {
        console.warn("Warning: Failed to delete from storage:", storageError.message)
        // Continue with database deletion even if storage fails
      }
    } catch (error) {
      console.warn("Warning: Storage deletion failed:", error)
      // Continue with database deletion
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from("uploaded_files")
      .delete()
      .eq("id", fileId)

    if (dbError) {
      throw createAppError(ERROR_CODES.DATABASE_ERROR, `Failed to delete file from database: ${dbError.message}`)
    }

    const response: ApiResponse = {
      success: true,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Delete file error:", error)
    
    const { response, status } = handleApiError(error, "Delete API")
    return NextResponse.json(response, { status })
  }
}
