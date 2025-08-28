import type { 
  GalleryItem, 
  UploadedFile, 
  DatabaseFile, 
  UploadProgress, 
  ApiResponse,
  FilterState 
} from "@/types"
import { createAppError, ERROR_CODES, logError } from "@/lib/errors"
import { validateFile, validateFileList, sanitizeFilename, sanitizeTags } from "@/lib/validation"
import { ZipService, type ZipProgress } from "./zip-service"

// Transform database file to gallery item
export function transformDatabaseFileToGalleryItem(dbFile: DatabaseFile): GalleryItem {
  let type: "image" | "video" | "gif" = "image"
  
  if (dbFile.file_type.startsWith("video/")) {
    type = "video"
  } else if (dbFile.file_type === "image/gif") {
    type = "gif"
  } else {
    type = "image"
  }
  
  return {
    id: dbFile.id,
    url: dbFile.file_path,
    title: dbFile.title,
    tags: dbFile.tags || [],
    type,
    dateAdded: new Date(dbFile.created_at),
    fileSize: dbFile.file_size,
    mimeType: dbFile.file_type,
  }
}

// Transform gallery item to uploaded file
export function transformGalleryItemToUploadedFile(item: GalleryItem, file?: File): UploadedFile {
  return {
    ...item,
    file,
  }
}

// File validation service
export class FileValidationService {
  static validateSingleFile(file: File): { isValid: boolean; errors: string[] } {
    const result = validateFile(file)
    
    // Add enhanced debugging for mobile video files
    if (!result.isValid && file.type.startsWith('video/')) {
      console.log('[Mobile Video Debug]', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        errors: result.errors
      })
    }
    
    // Check if it's a .mov file with incorrect MIME type (common on iPhone/Safari)
    if (file.name.toLowerCase().endsWith('.mov')) {
      console.log('[Mobile Video] .mov file detected:', {
        fileName: file.name,
        reportedType: file.type,
        fileSize: file.size
      })
      
      // MOV files from iPhone often have inconsistent MIME types
      // Accept them regardless of the reported MIME type
      if (!result.isValid || 
          (!file.type.includes('mov') && !file.type.includes('quicktime'))) {
        console.log('[Mobile Video] Accepting .mov file with corrected validation')
        return { isValid: true, errors: [] }
      }
    }
    
    return result
  }

  static validateMultipleFiles(files: File[]): { isValid: boolean; errors: string[]; validFiles: File[] } {
    const { isValid: listValid, errors: listErrors } = validateFileList(files)
    
    if (!listValid) {
      return { isValid: false, errors: listErrors, validFiles: [] }
    }

    const validFiles: File[] = []
    const fileErrors: string[] = []

    files.forEach((file, index) => {
      const { isValid, errors } = validateFile(file)
      if (isValid) {
        validFiles.push(file)
      } else {
        fileErrors.push(`File ${index + 1}: ${errors.join(", ")}`)
      }
    })

    return {
      isValid: fileErrors.length === 0,
      errors: fileErrors,
      validFiles,
    }
  }

  static sanitizeFileForUpload(file: File, title?: string): { file: File; title: string; filename: string } {
    const sanitizedTitle = title || file.name.replace(/\.[^/.]+$/, "")
    const sanitizedFilename = sanitizeFilename(file.name)
    
    return {
      file,
      title: sanitizedTitle.substring(0, 200), // Limit title length
      filename: sanitizedFilename,
    }
  }
}

// File filtering and sorting service
export class FileFilterService {
  static filterItems(items: GalleryItem[], searchQuery: string, filters: FilterState): GalleryItem[] {
    let filtered = [...items]

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // File type filter
    if (filters.fileTypes.length > 0) {
      filtered = filtered.filter(item => filters.fileTypes.includes(item.type))
    }

    // Tag filter
    if (filters.selectedTags.length > 0) {
      const hasNoTagsFilter = filters.selectedTags.includes("__no_tags__")
      // Filter out file type tags from regular tag filtering since they're handled separately
      const otherTags = filters.selectedTags.filter(tag => 
        tag !== "__no_tags__" && !tag.startsWith("type:")
      )

      if (hasNoTagsFilter && otherTags.length > 0) {
        // Show items with no tags OR items with selected tags
        filtered = filtered.filter(item =>
          item.tags.length === 0 || 
          otherTags.some(selectedTag => item.tags.includes(selectedTag))
        )
      } else if (hasNoTagsFilter) {
        // Show only items with no tags
        filtered = filtered.filter(item => item.tags.length === 0)
      } else if (otherTags.length > 0) {
        // Show items with any of the selected tags
        filtered = filtered.filter(item =>
          otherTags.some(selectedTag => item.tags.includes(selectedTag))
        )
      }
    }

    return filtered
  }

  static sortItems(items: GalleryItem[], sortBy: FilterState["sortBy"], sortOrder: FilterState["sortOrder"]): GalleryItem[] {
    const sorted = [...items]

    sorted.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title)
          break
        case "date":
          comparison = a.dateAdded.getTime() - b.dateAdded.getTime()
          break
        case "tags":
          comparison = a.tags.length - b.tags.length
          break
        case "size":
          comparison = (a.fileSize || 0) - (b.fileSize || 0)
          break
        default:
          comparison = 0
      }

      return sortOrder === "desc" ? -comparison : comparison
    })

    return sorted
  }

  static prioritizeNewlyUploaded(items: GalleryItem[], newlyUploadedIds: Set<string>): GalleryItem[] {
    const newlyUploaded = items.filter(item => newlyUploadedIds.has(item.id))
    const others = items.filter(item => !newlyUploadedIds.has(item.id))
    
    return [...newlyUploaded, ...others]
  }

  static extractAvailableTags(items: GalleryItem[]): string[] {
    const tagSet = new Set<string>()
    items.forEach(item => {
      item.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }
}

// File operations service
export class FileOperationsService {
  static async uploadFile(
    file: File, 
    title?: string, 
    tags: string[] = [],
    onProgress?: (progress: UploadProgress) => void
  ): Promise<DatabaseFile> {
    try {
      // Validate file
      const validation = FileValidationService.validateSingleFile(file)
      if (!validation.isValid) {
        throw createAppError(ERROR_CODES.VALIDATION_ERROR, validation.errors.join(", "))
      }

      // Sanitize inputs
      const sanitized = FileValidationService.sanitizeFileForUpload(file, title)
      const sanitizedTags = sanitizeTags(tags)

      // Create form data
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", sanitized.title)
      formData.append("tags", JSON.stringify(sanitizedTags))

      onProgress?.({
        fileName: file.name,
        progress: 50,
        stage: "uploading",
      })

      // Upload to API
      const response = await fetch("/api/upload-file", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw createAppError(
          ERROR_CODES.UPLOAD_FAILED,
          errorData.error || `Upload failed with status ${response.status}`
        )
      }

      onProgress?.({
        fileName: file.name,
        progress: 100,
        stage: "complete",
      })

      const result = await response.json() as ApiResponse<{ file: DatabaseFile }>
      
      if (!result.success || !result.data?.file) {
        throw createAppError(ERROR_CODES.UPLOAD_FAILED, result.error || "Upload failed")
      }

      return result.data.file
    } catch (error) {
      onProgress?.({
        fileName: file.name,
        progress: 0,
        stage: "error",
        error: error instanceof Error ? error.message : "Upload failed",
      })
      
      logError(error, "FileOperationsService.uploadFile")
      throw error
    }
  }

  static async updateFile(fileId: string, updates: { title?: string; tags?: string[] }): Promise<DatabaseFile> {
    try {
      const sanitizedUpdates = {
        ...updates,
        tags: updates.tags ? sanitizeTags(updates.tags) : undefined,
      }

      const response = await fetch(`/api/update-file/${fileId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sanitizedUpdates),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw createAppError(
          ERROR_CODES.API_ERROR,
          errorData.error || `Update failed with status ${response.status}`
        )
      }

      const result = await response.json() as ApiResponse<{ file: DatabaseFile }>
      
      if (!result.success || !result.data?.file) {
        throw createAppError(ERROR_CODES.API_ERROR, result.error || "Update failed")
      }

      return result.data.file
    } catch (error) {
      logError(error, "FileOperationsService.updateFile")
      throw error
    }
  }

  static async deleteFile(fileId: string): Promise<void> {
    try {
      const response = await fetch(`/api/delete-file/${fileId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw createAppError(ERROR_CODES.FILE_NOT_FOUND, "File not found")
        }
        
        const errorData = await response.json().catch(() => ({}))
        throw createAppError(
          ERROR_CODES.DELETE_FAILED,
          errorData.error || `Delete failed with status ${response.status}`
        )
      }

      const result = await response.json() as ApiResponse
      
      if (!result.success) {
        throw createAppError(ERROR_CODES.DELETE_FAILED, result.error || "Delete failed")
      }
    } catch (error) {
      logError(error, "FileOperationsService.deleteFile")
      throw error
    }
  }

  static async generateTags(filename: string, imageUrl: string): Promise<string[]> {
    try {
      const response = await fetch("/api/generate-tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filename, imageUrl }),
      })

      if (!response.ok) {
        throw createAppError(
          ERROR_CODES.TAG_GENERATION_ERROR,
          `Tag generation failed with status ${response.status}`
        )
      }

      const result = await response.json() as ApiResponse<{ tags: string[] }>
      
      if (!result.success || !result.data?.tags) {
        // Fall back to filename-based tags
        return FileOperationsService.generateFallbackTags(filename)
      }

      return sanitizeTags(result.data.tags)
    } catch (error) {
      logError(error, "FileOperationsService.generateTags")
      // Return fallback tags instead of throwing
      return FileOperationsService.generateFallbackTags(filename)
    }
  }

  static generateFallbackTags(filename: string): string[] {
    const name = filename.toLowerCase()
    const tags: string[] = []
    
    // Common UI component keywords
    if (name.includes("button")) tags.push("button")
    if (name.includes("card")) tags.push("card")
    if (name.includes("form")) tags.push("form")
    if (name.includes("nav")) tags.push("navigation")
    if (name.includes("dashboard")) tags.push("dashboard")
    if (name.includes("modal")) tags.push("modal")
    if (name.includes("table")) tags.push("table")
    if (name.includes("chart")) tags.push("chart")
    if (name.includes("hero")) tags.push("hero")
    if (name.includes("header")) tags.push("header")
    if (name.includes("footer")) tags.push("footer")
    if (name.includes("sidebar")) tags.push("sidebar")
    
    // Style keywords
    if (name.includes("modern")) tags.push("modern")
    if (name.includes("minimal")) tags.push("minimal")
    if (name.includes("dark")) tags.push("dark")
    if (name.includes("light")) tags.push("light")
    
    return tags.length > 0 ? tags : ["ui-component"]
  }
}

// Batch operations service
export class BatchOperationsService {
  static async uploadMultipleFiles(
    files: File[],
    onProgress?: (overallProgress: number, fileProgress: UploadProgress[]) => void
  ): Promise<{ successful: DatabaseFile[]; failed: Array<{ file: File; error: string }> }> {
    const validation = FileValidationService.validateMultipleFiles(files)
    
    if (!validation.isValid) {
      throw createAppError(ERROR_CODES.VALIDATION_ERROR, validation.errors.join(", "))
    }

    const successful: DatabaseFile[] = []
    const failed: Array<{ file: File; error: string }> = []
    const fileProgress: UploadProgress[] = files.map(file => ({
      fileName: file.name,
      progress: 0,
      stage: "uploading" as const,
    }))

    const uploadPromises = validation.validFiles.map(async (file, index) => {
      try {
        const result = await FileOperationsService.uploadFile(
          file,
          undefined,
          [],
          (progress) => {
            fileProgress[index] = progress
            const overallProgress = fileProgress.reduce((sum, p) => sum + p.progress, 0) / files.length
            onProgress?.(overallProgress, [...fileProgress])
          }
        )
        successful.push(result)
      } catch (error) {
        failed.push({
          file,
          error: error instanceof Error ? error.message : "Upload failed",
        })
      }
    })

    await Promise.all(uploadPromises)

    return { successful, failed }
  }

  static async deleteMultipleFiles(fileIds: string[]): Promise<{ successful: string[]; failed: Array<{ id: string; error: string }> }> {
    const successful: string[] = []
    const failed: Array<{ id: string; error: string }> = []

    const deletePromises = fileIds.map(async (fileId) => {
      try {
        await FileOperationsService.deleteFile(fileId)
        successful.push(fileId)
      } catch (error) {
        failed.push({
          id: fileId,
          error: error instanceof Error ? error.message : "Delete failed",
        })
      }
    })

    await Promise.all(deletePromises)

    return { successful, failed }
  }

  static async downloadAllFiles(
    files: GalleryItem[],
    onProgress?: (progress: ZipProgress) => void
  ): Promise<void> {
    if (files.length === 0) {
      throw createAppError(ERROR_CODES.VALIDATION_ERROR, "No files to download")
    }

    try {
      // Generate a meaningful zip name based on current date and file count
      const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      const zipName = `gallery-export-${date}-${files.length}-files`
      
      await ZipService.downloadFilesAsZip(files, zipName, onProgress)
    } catch (error) {
      logError(error, "BatchOperationsService.downloadAllFiles")
      throw error // Re-throw as ZipService already creates proper error
    }
  }

  /**
   * Download selected files as a zip archive
   */
  static async downloadSelectedFiles(
    files: GalleryItem[],
    onProgress?: (progress: ZipProgress) => void
  ): Promise<void> {
    if (files.length === 0) {
      throw createAppError(ERROR_CODES.VALIDATION_ERROR, "No files selected for download")
    }

    try {
      const zipName = files.length === 1 
        ? `${files[0].title}-export`
        : `selected-files-${files.length}-items`
      
      await ZipService.downloadFilesAsZip(files, zipName, onProgress)
    } catch (error) {
      logError(error, "BatchOperationsService.downloadSelectedFiles")
      throw error
    }
  }

  /**
   * Get estimated zip size for files
   */
  static getEstimatedZipSize(files: GalleryItem[]): string {
    const estimatedBytes = ZipService.estimateZipSize(files)
    return ZipService.formatFileSize(estimatedBytes)
  }
}
