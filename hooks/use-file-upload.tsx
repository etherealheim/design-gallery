"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import type { UploadedFile, UploadProgress, PendingTags } from "@/types"
import { FileOperationsService, FileValidationService } from "@/lib/services/file-service"
import { createUserFriendlyMessage } from "@/lib/errors"
import { toast } from "sonner"
import { VideoConversionService } from "@/lib/services/video-conversion"

// Utility function to truncate filenames for mobile displays
function truncateFilenameForMobile(filename: string, maxLength: number = 20): string {
  if (typeof window === 'undefined') return filename
  
  const isMobile = window.innerWidth < 768 // Tailwind md breakpoint
  if (!isMobile || filename.length <= maxLength) return filename
  
  const lastDotIndex = filename.lastIndexOf('.')
  const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename
  const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : ''
  
  const maxNameLength = maxLength - extension.length - 3 // Reserve space for "..." and extension
  if (maxNameLength <= 3) return filename // If too short, return original
  
  const truncatedName = name.length > maxNameLength 
    ? name.substring(0, Math.ceil(maxNameLength / 2)) + '...' + name.substring(name.length - Math.floor(maxNameLength / 2))
    : name
  
  return truncatedName + extension
}

interface UseFileUploadProps {
  onUploadComplete: (file: UploadedFile) => void
  onUploadStart: (skeletalId: string) => void
  onUploadEnd: (skeletalId: string) => void
  onNewlyUploaded: (fileId: string) => void
}

export function useFileUpload({
  onUploadComplete,
  onUploadStart,
  onUploadEnd,
  onNewlyUploaded,
}: UseFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ fileName: string; progress: number } | null>(null)
  const [isDragOverWindow, setIsDragOverWindow] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Tags will be added manually by users

  // Upload a single file
  const uploadSingleFile = useCallback(async (file: File): Promise<void> => {
    const isVideo = file.type.startsWith("video/")
    const isGif = file.type === "image/gif"
    const title = file.name.replace(/\.[^/.]+$/, "")
    const skeletalId = `skeletal-${Date.now()}-${Math.random().toString(36).substring(2)}`

    let uploadedFile: UploadedFile | null = null

    try {
      onUploadStart(skeletalId)

      // Show upload progress toast
      const displayName = truncateFilenameForMobile(file.name)
      const isVideo = file.type.startsWith("video/")
      const isMov = file.name.toLowerCase().endsWith('.mov')
      
      const uploadToastId = toast.loading(`Uploading ${displayName}...`, {
        description: isMov ? "Converting MOV to MP4..." : isVideo ? "Processing video..." : "Uploading to storage",
      })

      // Process video files (MOV conversion and compression)
      let fileToUpload: File = file
      const needsProcessing = isVideo && (
        file.name.toLowerCase().endsWith('.mov') ||
        file.type === 'video/quicktime' ||
        file.type === 'video/x-quicktime'
      )

      if (needsProcessing) {
        console.log('[Upload] Video file detected, processing before upload:', file.name)

        try {
          // Check if FFmpeg is supported before attempting conversion
          if (!VideoConversionService.isSupported()) {
            console.log('[Upload] FFmpeg not supported, skipping video conversion')
            toast.loading(`Uploading ${displayName}...`, {
              id: uploadToastId,
              description: "Uploading MOV file directly",
            })
          } else {
            // Show processing status
            toast.loading(`Processing ${displayName}...`, {
              id: uploadToastId,
              description: "Converting MOV to MP4...",
            })

            // Process the video (convert MOV to MP4 and optionally compress)
            const videoResult = await VideoConversionService.convertMovToMp4(
              file,
              (progress) => {
                toast.loading(`Processing ${displayName}...`, {
                  id: uploadToastId,
                  description: `Converting to MP4: ${progress}%`,
                })
              }
            )

            if (videoResult.blob !== file) {
              // Create new file from processed blob
              fileToUpload = new File([videoResult.blob], file.name.replace(/\.mov$/i, '.mp4'), {
                type: videoResult.format,
                lastModified: Date.now()
              })
              console.log('[Upload] Video processing complete:', {
                originalSize: videoResult.originalSize,
                convertedSize: videoResult.convertedSize,
                format: videoResult.format
              })

              // Show success message for conversion
              toast.loading(`Uploading ${displayName}...`, {
                id: uploadToastId,
                description: "Conversion complete, uploading...",
              })
            } else {
              toast.loading(`Uploading ${displayName}...`, {
                id: uploadToastId,
                description: "No conversion needed, uploading...",
              })
            }
          }
        } catch (error) {
          console.warn('[Upload] Video processing failed, using original file:', error)

          // Check if it's a known FFmpeg loading error
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          if (errorMessage.includes('FFmpeg') || errorMessage.includes('wasm') || errorMessage.includes('SharedArrayBuffer')) {
            console.log('[Upload] FFmpeg compatibility issue, falling back to direct upload')
            toast.loading(`Uploading ${displayName}...`, {
              id: uploadToastId,
              description: "Browser compatibility issue, uploading original file",
            })
          } else {
            toast.loading(`Uploading ${displayName}...`, {
              id: uploadToastId,
              description: "Processing failed, uploading original file",
            })
          }
        }
      }

      // Upload file
      const dbFile = await FileOperationsService.uploadFile(
        fileToUpload,
        title,
        [],
        (progress) => {
          setUploadProgress({ fileName: file.name, progress: progress.progress })
          
          let description = "Uploading to storage"
          let title = `Uploading ${displayName}...`

          if (progress.stage === "uploading") {
            description = "Uploading to storage"
            title = `Uploading ${displayName}...`
            
            toast.loading(title, {
              id: uploadToastId,
              description,
            })
          }
        }
      )

      // No AI tag generation - users will add tags manually

      // Create uploaded file object
      let fileType: "image" | "video" | "gif" = "image"
      if (isVideo) {
        fileType = "video"
      } else if (isGif) {
        fileType = "gif"
      }
      
      uploadedFile = {
        id: dbFile.id,
        file,
        url: dbFile.file_path,
        title: dbFile.title,
        tags: [], // Tags will be added when confirmed
        type: fileType,
        dateAdded: new Date(dbFile.created_at),
        fileSize: dbFile.file_size,
        mimeType: dbFile.file_type,
      }

      // Update state
      onUploadComplete(uploadedFile)
      onNewlyUploaded(dbFile.id)

      // Show completion
      toast.success(`${displayName} uploaded successfully`, {
        id: uploadToastId,
        description: "Ready for tagging",
      })

      // Keep skeletal loader active for a bit longer to match toast visibility
      setTimeout(() => {
        onUploadEnd(skeletalId)
      }, 2000) // 2 second delay to keep loader visible while success toast shows

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
      toast.error(`Upload failed: ${displayName}`, {
        description: createUserFriendlyMessage(error),
      })
    }
  }, [onUploadComplete, onUploadStart, onUploadEnd, onNewlyUploaded])

  // Upload a single file without showing individual toasts (for batch uploads)
  const uploadSingleFileWithoutToast = useCallback(async (file: File): Promise<void> => {
    const isVideo = file.type.startsWith("video/")
    const isGif = file.type === "image/gif"
    const title = file.name.replace(/\.[^/.]+$/, "")
    const skeletalId = `skeletal-${Date.now()}-${Math.random().toString(36).substring(2)}`

    let uploadedFile: UploadedFile | null = null

    try {
      onUploadStart(skeletalId)

      // Process video files (MOV conversion and compression) for batch uploads too
      let fileToUpload: File = file
      const needsProcessing = isVideo && (
        file.name.toLowerCase().endsWith('.mov') ||
        file.type === 'video/quicktime' ||
        file.type === 'video/x-quicktime'
      )

      if (needsProcessing) {
        console.log('[Batch Upload] Video file detected, processing before upload:', file.name)

        try {
          // Check if FFmpeg is supported before attempting conversion
          if (!VideoConversionService.isSupported()) {
            console.log('[Batch Upload] FFmpeg not supported, skipping video conversion')
          } else {
            const videoResult = await VideoConversionService.convertMovToMp4(
              file,
              (progress) => {
                // Update progress for batch upload
                setUploadProgress({ fileName: file.name, progress: Math.max(progress * 0.5, 10) }) // 10-50% for conversion
              }
            )

            if (videoResult.blob !== file) {
              fileToUpload = new File([videoResult.blob], file.name.replace(/\.mov$/i, '.mp4'), {
                type: videoResult.format,
                lastModified: Date.now()
              })
              console.log('[Batch Upload] Video processing complete:', {
                originalSize: videoResult.originalSize,
                convertedSize: videoResult.convertedSize,
                format: videoResult.format
              })
            }
          }
        } catch (error) {
          console.warn('[Batch Upload] Video processing failed, using original file:', error)
          // Continue with original file - error is already logged
        }
      }

      // Upload file (no individual toast)
      const dbFile = await FileOperationsService.uploadFile(
        fileToUpload,
        title,
        [],
        (progress) => {
          setUploadProgress({ fileName: file.name, progress: progress.progress })
        }
      )

      // Create uploaded file object
      let fileType: "image" | "video" | "gif" = "image"
      if (isVideo) {
        fileType = "video"
      } else if (isGif) {
        fileType = "gif"
      }
      
      uploadedFile = {
        id: dbFile.id,
        file,
        url: dbFile.file_path,
        title: dbFile.title,
        tags: [], // Tags will be added manually
        type: fileType,
        dateAdded: new Date(dbFile.created_at),
        fileSize: dbFile.file_size,
        mimeType: dbFile.file_type,
      }

      // Update state
      onUploadComplete(uploadedFile)
      onNewlyUploaded(dbFile.id)
      
      // For batch uploads, end skeletal loader immediately since no individual success toast
      onUploadEnd(skeletalId)

    } catch (error) {
      console.error("Failed to upload file:", file.name, error)
      onUploadEnd(skeletalId)
      throw error
    }
  }, [onUploadComplete, onUploadStart, onUploadEnd, onNewlyUploaded])

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

    // Show batch upload start toast if multiple files
    let batchToastId: string | number | undefined
    if (validation.validFiles.length > 1) {
      batchToastId = toast.loading(`Uploading ${validation.validFiles.length} files...`, {
        description: "Processing files one by one",
      })
    }

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (let i = 0; i < validation.validFiles.length; i++) {
        const file = validation.validFiles[i]
        
        // Update batch progress if multiple files
        if (batchToastId && validation.validFiles.length > 1) {
          toast.loading(`Uploading ${i + 1}/${validation.validFiles.length} files...`, {
            id: batchToastId,
            description: `Processing: ${file.name}`,
          })
        }
        
        // For batch uploads, suppress individual toasts by modifying uploadSingleFile temporarily
        if (validation.validFiles.length > 1) {
          await uploadSingleFileWithoutToast(file)
        } else {
          await uploadSingleFile(file)
        }
      }
      
      // Update final success toast
      if (batchToastId) {
        toast.success("All files uploaded", {
          id: batchToastId,
          description: `Successfully uploaded ${validation.validFiles.length} files`,
        })
      } else {
        toast.success("Upload complete", {
          description: `Successfully uploaded ${validation.validFiles.length} file${validation.validFiles.length > 1 ? 's' : ''}`,
        })
      }
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
