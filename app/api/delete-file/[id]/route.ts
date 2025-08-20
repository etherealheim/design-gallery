import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const fileId = params.id

    // First get the file info to delete from storage
    const { data: fileData, error: fetchError } = await supabase
      .from("uploaded_files")
      .select("file_path")
      .eq("id", fileId)
      .single()

    if (fetchError) {
      console.error("Error fetching file:", fetchError)
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage.from("design-vault").remove([fileData.file_path])

    if (storageError) {
      console.error("Error deleting from storage:", storageError)
    }

    // Delete from database
    const { error: dbError } = await supabase.from("uploaded_files").delete().eq("id", fileId)

    if (dbError) {
      console.error("Error deleting from database:", dbError)
      return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete file error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
