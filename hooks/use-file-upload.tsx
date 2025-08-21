"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import type { UploadedFile, UploadProgress, PendingTags } from "@/types"
import { FileOperationsService, FileValidationService } from "@/lib/services/file-service"
import { createUserFriendlyMessage } from "@/lib/errors"
import { toast } from "sonner"

interface UseFileUploadProps {
  onUploadComplete: (file: UploadedFile) => void
  onUploadStart: (skeletalId: string) => void
  onUploadEnd: (skeletalId: string) => void
  onNewlyUploaded: (fileId: string) => void
  onPendingTags: (fileId: string, tags: string[]) => void
}

export function useFileUpload({
  onUploadComplete,
  onUploadStart,
  onUploadEnd,
  onNewlyUploaded,
  onPendingTags,
}: UseFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ fileName: string; progress: number } | null>(null)
  const [isDragOverWindow, setIsDragOverWindow] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generate AI tags with fallback
  const generateTagsForFile = useCallback(async (filename: string, imageUrl: string, isVideo: boolean): Promise<string[]> => {
    if (isVideo) {
      return FileOperationsService.generateFallbackTags(filename)
    }
    
    try {
      return await FileOperationsService.generateTags(filename, imageUrl)
    } catch (error) {
      console.error("AI tag generation failed, using fallback:", error)
      return FileOperationsService.generateFallbackTags(filename)
    }
  }, [])

  // Upload a single file
  const uploadSingleFile = useCallback(async (file: File): Promise<void> => {
    const isVideo = file.type.startsWith("video/")
    const title = file.name.replace(/\.[^/.]+$/, "")
    const skeletalId = `skeletal-${Date.now()}-${Math.random().toString(36).substring(2)}`

    let uploadedFile: UploadedFile | null = null

    try {
      onUploadStart(skeletalId)

      // Show upload progress toast
      const uploadToastId = toast.loading(`☁️ Uploading ${file.name}...`, {
        description: "Uploading to storage",
      })

      // Upload file
      const dbFile = await FileOperationsService.uploadFile(
        file,
        title,
        [],
        (progress) => {
          setUploadProgress({ fileName: file.name, progress: progress.progress })
          if (progress.stage === "uploading") {
            toast.loading(`☁️ Uploading ${file.name}... ${Math.round(progress.progress)}%`, {
              id: uploadToastId,
              description: "Uploading to storage",
            })
          }
        }
      )

      // Show tag generation progress
      toast.loading(`🤖 Generating tags for ${file.name}...`, {
        id: uploadToastId,
        description: "AI is analyzing your content",
      })

      // Generate tags
      const tags = await generateTagsForFile(title, dbFile.file_path, isVideo)

      // Create uploaded file object
      uploadedFile = {
        id: dbFile.id,
        file,
        url: dbFile.file_path,
        title: dbFile.title,
        tags: [], // Tags will be added when confirmed
        type: isVideo ? "video" : "image",
        dateAdded: new Date(dbFile.created_at),
        fileSize: dbFile.file_size,
        mimeType: dbFile.file_type,
      }

      // Update state
      onUploadComplete(uploadedFile)
      onNewlyUploaded(dbFile.id)
      onPendingTags(dbFile.id, tags)
      onUploadEnd(skeletalId)

      // Show completion
      toast.success(`✅ ${file.name} uploaded successfully!`, {
        id: uploadToastId,
        description: `Generated ${tags.length} tag${tags.length !== 1 ? 's' : ''}: ${tags.slice(0, 3).join(', ')}${tags.length > 3 ? '...' : ''}`,
      })

      // Remove from newly uploaded after delay
      setTimeout(() => {
        // This will be handled by the parent component
      }, 5000)

    } catch (error) {
      console.error("Failed to upload file:", file.name, error)
      
      onUploadEnd(skeletalId)
      
      // Dismiss upload toast
      toast.dismiss(uploadToastId)

      // Show error toast
      toast.error(`❌ Upload failed: ${file.name}`, {
        description: createUserFriendlyMessage(error),
      })
    }
  }, [generateTagsForFile, onUploadComplete, onUploadStart, onUploadEnd, onNewlyUploaded, onPendingTags])

  // Handle file drop (multiple files)
  const handleFileDrop = useCallback(async (files: FileList) => {
    if (isUploading) {
      toast.warning("Upload in progress", {
        description: "Please wait for the current upload to complete",
      })
      return
    }

    const fileArray = Array.from(files)
    
    // Validate files
    const validation = FileValidationService.validateMultipleFiles(fileArray)
    
    if (!validation.isValid) {
      toast.error("Invalid files", {
        description: validation.errors.join(", "),
      })
      return
    }

    if (validation.validFiles.length === 0) {
      toast.error("No valid files", {
        description: "Please select valid image or video files",
      })
      return
    }

    setIsUploading(true)

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const file of validation.validFiles) {
        await uploadSingleFile(file)
      }
      
      toast.success("✅ Upload complete", {
        description: `Successfully uploaded ${validation.validFiles.length} file${validation.validFiles.length > 1 ? 's' : ''}`,
      })
    } catch (error) {
      // Individual file errors are already handled in uploadSingleFile
      console.error("Batch upload failed:", error)
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
    }
  }, [isUploading, uploadSingleFile])

  // File input change handler
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileDrop(files)
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [handleFileDrop])

  // Trigger file input
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Window drag and drop handlers
  useEffect(() => {
    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      setIsDragOverWindow(false)

      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        handleFileDrop(files)
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      setIsDragOverWindow(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      if (!e.relatedTarget || !document.contains(e.relatedTarget as Node)) {
        setIsDragOverWindow(false)
      }
    }

    const handleWindowDragEnter = (e: DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer?.types.includes("Files")) {
        setIsDragOverWindow(true)
      }
    }

    // Add event listeners
    window.addEventListener("dragover", handleDragOver)
    window.addEventListener("dragleave", handleDragLeave)
    window.addEventListener("drop", handleDrop)
    window.addEventListener("dragenter", handleWindowDragEnter)

    return () => {
      window.removeEventListener("dragover", handleDragOver)
      window.removeEventListener("dragleave", handleDragLeave)
      window.removeEventListener("drop", handleDrop)
      window.removeEventListener("dragenter", handleWindowDragEnter)
    }
  }, [handleFileDrop])

  return {
    // State
    isUploading,
    uploadProgress,
    isDragOverWindow,
    
    // Refs
    fileInputRef,
    
    // Handlers
    handleFileDrop,
    handleFileInputChange,
    triggerFileInput,
    
    // Utils
    uploadSingleFile,
  }
}
