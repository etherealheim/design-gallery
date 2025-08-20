import { type NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerComponentClient({
      cookies,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    })

    const { title, tags } = await request.json()
    const fileId = params.id

    const updates: any = {}
    if (title !== undefined) updates.title = title
    if (tags !== undefined) updates.tags = tags
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase.from("uploaded_files").update(updates).eq("id", fileId).select().single()

    if (error) {
      console.error("Database update error:", error)
      return NextResponse.json({ error: "Failed to update file" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      file: {
        id: data.id,
        title: data.title,
        tags: data.tags,
        file_path: data.file_path,
        file_type: data.file_type,
        updated_at: data.updated_at,
      },
    })
  } catch (error) {
    console.error("Update file error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
