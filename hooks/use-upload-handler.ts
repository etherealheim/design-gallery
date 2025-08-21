"use client"

import type React from "react"
import { useCallback } from "react"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"
import type { UploadedFile } from "@/types/gallery"

interface UploadHandlerProps {
  isUploading: boolean
  setIsUploading: (uploading: boolean) => void
  setUploadProgress: (progress: { fileName: string; progress: number } | null) => void
  setNewlyUploadedFiles: React.Dispatch<React.SetStateAction<Set<string>>>
  setPendingTags: React.Dispatch<React.SetStateAction<Record<string, string[]>>>
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>
  setUploadingFiles: React.Dispatch<React.SetStateAction<string[]>>
}

export function useUploadHandler({
  isUploading,
  setIsUploading,
  setUploadProgress,
  setNewlyUploadedFiles,
  setPendingTags,
  setUploadedFiles,
  setUploadingFiles,
}: UploadHandlerProps) {
  const generateTagsWithAI = async (filename: string, imageUrl: string): Promise<string[]> => {
    try {
      console.log("[v0] Generating tags for:", filename, "URL:", imageUrl)

      const response = await fetch("/api/generate-tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename,
          imageUrl: imageUrl || "",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate tags")
      }

      const data = await response.json()
      console.log("[v0] API response data:", data)
      console.log("[v0] Generated tags:", data.tags)
      return data.tags || []
    } catch (error) {
      console.error("Failed to generate tags:", error)
      const filename_lower = filename.toLowerCase()
      const fallbackTags: string[] = []
      if (filename_lower.includes("button")) fallbackTags.push("button")
      if (filename_lower.includes("card")) fallbackTags.push("card")
      if (filename_lower.includes("form")) fallbackTags.push("form")
      if (filename_lower.includes("nav")) fallbackTags.push("navigation")
      if (filename_lower.includes("dashboard")) fallbackTags.push("dashboard")
      return fallbackTags
    }
  }

  const uploadFileToStorage = async (file: File, title: string, tags: string[]) => {
    try {
      toast({
        title: "Uploading file...",
        description: `Starting upload of ${file.name}`,
      })

      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `uploads/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("design-vault")
        .upload(filePath, file)

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`)
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("design-vault").getPublicUrl(filePath)

      const fileData = {
        id: globalThis.crypto.randomUUID(),
        title,
        file_path: publicUrl,
        file_type: file.type.startsWith("video/") ? "video" : "image",
        file_size: file.size,
        tags: [],
        created_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("uploaded_files").insert(fileData).select().single()

      if (error) {
        throw new Error(`Database insert failed: ${error.message}`)
      }

      setNewlyUploadedFiles((prev) => new Set([...prev, data.id]))
      setPendingTags((prev) => ({ ...prev, [data.id]: tags }))

      setTimeout(() => {
        setNewlyUploadedFiles((prev) => {
          const newSet = new Set(prev)
          newSet.delete(data.id)
          return newSet
        })
      }, 5000)

      toast({
        title: "Upload successful!",
        description: `${file.name} has been uploaded with ${tags.length} AI-generated tags`,
      })

      return { ...data }
    } catch (error) {
      console.error("Upload failed:", error)
      toast({
        title: "Upload failed",
        description: `Failed to upload ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
      throw error
    }
  }

  const handleFileDrop = useCallback(
    async (files: FileList) => {
      if (isUploading) return

      setIsUploading(true)

      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith("video/")
        const title = file.name.replace(/\.[^/.]+$/, "")
        const skeletalId = `skeletal-${Date.now()}-${Math.random().toString(36).substring(2)}`

        try {
          setUploadingFiles((prev) => [...prev, skeletalId])

          setUploadProgress({ fileName: file.name, progress: 0 })

          toast({
            title: "☁️ Uploading to storage...",
            description: `Saving ${file.name} to cloud storage`,
          })

          setUploadProgress({ fileName: file.name, progress: 30 })

          const serverFile = await uploadFileToStorage(file, title, [])

          setUploadProgress({ fileName: file.name, progress: 70 })

          toast({
            title: "🤖 Generating tags...",
            description: `AI is analyzing ${file.name} for smart tags`,
          })

          let tags: string[] = []
          if (isVideo) {
            const filename_lower = title.toLowerCase()
            if (filename_lower.includes("button")) tags.push("button")
            if (filename_lower.includes("card")) tags.push("card")
            if (filename_lower.includes("form")) tags.push("form")
            if (filename_lower.includes("nav")) tags.push("navigation")
            if (filename_lower.includes("dashboard")) tags.push("dashboard")
            if (filename_lower.includes("animation")) tags.push("animation")
            if (filename_lower.includes("transition")) tags.push("transition")
            if (tags.length === 0) tags = ["ui-component", "video"]
          } else {
            tags = await generateTagsWithAI(title, serverFile.file_path)
          }

          setPendingTags((prev) => ({ ...prev, [serverFile.id]: tags }))

          const uploadedFile: UploadedFile = {
            id: serverFile.id,
            file,
            url: serverFile.file_path,
            title: serverFile.title,
            tags: [],
            type: isVideo ? "video" : "image",
            dateAdded: new Date(serverFile.created_at),
          }

          setUploadingFiles((prev) => prev.filter((id) => id !== skeletalId))
          setUploadedFiles((prev) => [uploadedFile, ...prev])

          setUploadProgress({ fileName: file.name, progress: 100 })

          setTimeout(() => {
            setUploadProgress(null)
          }, 1000)

          toast({
            title: "✅ Upload complete!",
            description: `${file.name} uploaded with ${tags.length} AI-generated tags: ${tags.slice(0, 3).join(", ")}${tags.length > 3 ? "..." : ""}`,
          })
        } catch (error) {
          console.error("Failed to upload file:", file.name, error)
          setUploadingFiles((prev) => prev.filter((id) => id !== skeletalId))
          setUploadProgress(null)
          toast({
            title: "❌ Upload failed",
            description: `Failed to upload ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
            variant: "destructive",
          })
        }
      }

      setIsUploading(false)
    },
    [
      isUploading,
      setIsUploading,
      setUploadProgress,
      setNewlyUploadedFiles,
      setPendingTags,
      setUploadedFiles,
      setUploadingFiles,
    ],
  )

  return { handleFileDrop }
}
