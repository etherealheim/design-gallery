import { supabase } from "@/lib/supabase/client"
import type { GalleryItem, DatabaseFile, FilterState } from "@/types"
import { createAppError, ERROR_CODES, logError } from "@/lib/errors"
import { transformDatabaseFileToGalleryItem } from "./file-service"

export class DataService {
  /**
   * Load all files from the database
   */
  static async loadAllFiles(): Promise<GalleryItem[]> {
    try {
      const { data, error } = await supabase
        .from("uploaded_files")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        logError(error, "DataService.loadAllFiles")
        throw createAppError(ERROR_CODES.DATABASE_ERROR, `Failed to load files: ${error.message}`)
      }

      return (data || []).map(transformDatabaseFileToGalleryItem)
    } catch (error) {
      logError(error, "DataService.loadAllFiles")
      throw error
    }
  }

  /**
   * Load files with pagination
   */
  static async loadFilesWithPagination(
    page: number = 1,
    limit: number = 20,
    filters?: FilterState
  ): Promise<{ items: GalleryItem[]; totalCount: number; hasMore: boolean }> {
    try {
      let query = supabase
        .from("uploaded_files")
        .select("*", { count: "exact" })

      // Apply filters
      if (filters?.fileTypes && filters.fileTypes.length > 0) {
        const fileTypeFilters = filters.fileTypes.map(type => 
          type === "video" ? "video%" : "image%"
        )
        query = query.or(fileTypeFilters.map(filter => `file_type.like.${filter}`).join(","))
      }

      // Apply sorting
      if (filters?.sortBy) {
        const column = filters.sortBy === "date" ? "created_at" : 
                      filters.sortBy === "size" ? "file_size" :
                      filters.sortBy === "title" ? "title" : "created_at"
        
        query = query.order(column, { ascending: filters.sortOrder === "asc" })
      } else {
        query = query.order("created_at", { ascending: false })
      }

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        logError(error, "DataService.loadFilesWithPagination")
        throw createAppError(ERROR_CODES.DATABASE_ERROR, `Failed to load files: ${error.message}`)
      }

      const items = (data || []).map(transformDatabaseFileToGalleryItem)
      const totalCount = count || 0
      const hasMore = offset + items.length < totalCount

      return { items, totalCount, hasMore }
    } catch (error) {
      logError(error, "DataService.loadFilesWithPagination")
      throw error
    }
  }

  /**
   * Search files by query
   */
  static async searchFiles(
    query: string,
    filters?: FilterState,
    limit: number = 50
  ): Promise<GalleryItem[]> {
    try {
      let searchQuery = supabase
        .from("uploaded_files")
        .select("*")
        .limit(limit)

      // Text search in title
      if (query.trim()) {
        searchQuery = searchQuery.ilike("title", `%${query.trim()}%`)
      }

      // Apply file type filters
      if (filters?.fileTypes && filters.fileTypes.length > 0) {
        const fileTypeFilters = filters.fileTypes.map(type => 
          type === "video" ? "video%" : "image%"
        )
        searchQuery = searchQuery.or(fileTypeFilters.map(filter => `file_type.like.${filter}`).join(","))
      }

      // Apply sorting
      if (filters?.sortBy) {
        const column = filters.sortBy === "date" ? "created_at" : 
                      filters.sortBy === "size" ? "file_size" :
                      filters.sortBy === "title" ? "title" : "created_at"
        
        searchQuery = searchQuery.order(column, { ascending: filters.sortOrder === "asc" })
      } else {
        searchQuery = searchQuery.order("created_at", { ascending: false })
      }

      const { data, error } = await searchQuery

      if (error) {
        logError(error, "DataService.searchFiles")
        throw createAppError(ERROR_CODES.DATABASE_ERROR, `Search failed: ${error.message}`)
      }

      let results = (data || []).map(transformDatabaseFileToGalleryItem)

      // Apply tag filtering on the client side (since Supabase JSON queries can be complex)
      if (filters?.selectedTags && filters.selectedTags.length > 0) {
        results = this.applyTagFilters(results, filters.selectedTags)
      }

      return results
    } catch (error) {
      logError(error, "DataService.searchFiles")
      throw error
    }
  }

  /**
   * Get a single file by ID
   */
  static async getFileById(fileId: string): Promise<GalleryItem | null> {
    try {
      const { data, error } = await supabase
        .from("uploaded_files")
        .select("*")
        .eq("id", fileId)
        .single()

      if (error) {
        if (error.code === "PGRST116") { // Row not found
          return null
        }
        logError(error, "DataService.getFileById")
        throw createAppError(ERROR_CODES.DATABASE_ERROR, `Failed to get file: ${error.message}`)
      }

      return transformDatabaseFileToGalleryItem(data)
    } catch (error) {
      logError(error, "DataService.getFileById")
      throw error
    }
  }

  /**
   * Get files by IDs
   */
  static async getFilesByIds(fileIds: string[]): Promise<GalleryItem[]> {
    try {
      if (fileIds.length === 0) return []

      const { data, error } = await supabase
        .from("uploaded_files")
        .select("*")
        .in("id", fileIds)

      if (error) {
        logError(error, "DataService.getFilesByIds")
        throw createAppError(ERROR_CODES.DATABASE_ERROR, `Failed to get files: ${error.message}`)
      }

      return (data || []).map(transformDatabaseFileToGalleryItem)
    } catch (error) {
      logError(error, "DataService.getFilesByIds")
      throw error
    }
  }

  /**
   * Get all unique tags from the database
   */
  static async getAllTags(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from("uploaded_files")
        .select("tags")

      if (error) {
        logError(error, "DataService.getAllTags")
        throw createAppError(ERROR_CODES.DATABASE_ERROR, `Failed to get tags: ${error.message}`)
      }

      const tagSet = new Set<string>()
      data?.forEach(item => {
        if (Array.isArray(item.tags)) {
          item.tags.forEach(tag => {
            if (typeof tag === "string" && tag.trim()) {
              tagSet.add(tag.trim())
            }
          })
        }
      })

      return Array.from(tagSet).sort()
    } catch (error) {
      logError(error, "DataService.getAllTags")
      throw error
    }
  }

  /**
   * Get count of files with no tags
   */
  static async getNoTagCount(): Promise<number> {
    try {
      // Get all files and count those with empty tags arrays on the client side
      // This is more reliable than complex Supabase JSON queries
      const { data, error } = await supabase
        .from("uploaded_files")
        .select("tags")

      if (error) {
        logError(error, "DataService.getNoTagCount")
        throw createAppError(ERROR_CODES.DATABASE_ERROR, `Failed to get no-tag count: ${error.message}`)
      }

      // Count files with no tags (null, undefined, or empty array)
      const noTagCount = (data || []).filter(item => 
        !item.tags || 
        !Array.isArray(item.tags) || 
        item.tags.length === 0
      ).length

      return noTagCount
    } catch (error) {
      logError(error, "DataService.getNoTagCount")
      throw error
    }
  }

  /**
   * Get files created within a date range
   */
  static async getFilesByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<GalleryItem[]> {
    try {
      const { data, error } = await supabase
        .from("uploaded_files")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false })

      if (error) {
        logError(error, "DataService.getFilesByDateRange")
        throw createAppError(ERROR_CODES.DATABASE_ERROR, `Failed to get files by date range: ${error.message}`)
      }

      return (data || []).map(transformDatabaseFileToGalleryItem)
    } catch (error) {
      logError(error, "DataService.getFilesByDateRange")
      throw error
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    totalFiles: number
    totalSize: number
    imageCount: number
    videoCount: number
    avgFileSize: number
  }> {
    try {
      const { data, error } = await supabase
        .from("uploaded_files")
        .select("file_type, file_size")

      if (error) {
        logError(error, "DataService.getStorageStats")
        throw createAppError(ERROR_CODES.DATABASE_ERROR, `Failed to get storage stats: ${error.message}`)
      }

      const files = data || []
      const totalFiles = files.length
      const totalSize = files.reduce((sum, file) => sum + (file.file_size || 0), 0)
      const imageCount = files.filter(file => file.file_type.startsWith("image/")).length
      const videoCount = files.filter(file => file.file_type.startsWith("video/")).length
      const avgFileSize = totalFiles > 0 ? totalSize / totalFiles : 0

      return {
        totalFiles,
        totalSize,
        imageCount,
        videoCount,
        avgFileSize,
      }
    } catch (error) {
      logError(error, "DataService.getStorageStats")
      throw error
    }
  }

  /**
   * Check if storage is properly configured
   */
  static async checkStorageHealth(): Promise<{ isHealthy: boolean; error?: string }> {
    try {
      // Test basic database connectivity
      const { error: dbError } = await supabase
        .from("uploaded_files")
        .select("id")
        .limit(1)

      if (dbError) {
        return { isHealthy: false, error: `Database error: ${dbError.message}` }
      }

      // Test storage bucket access
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets()

      if (storageError) {
        return { isHealthy: false, error: `Storage error: ${storageError.message}` }
      }

      const hasDesignVaultBucket = buckets?.some(bucket => bucket.name === "design-vault")
      if (!hasDesignVaultBucket) {
        return { isHealthy: false, error: "design-vault bucket not found" }
      }

      return { isHealthy: true }
    } catch (error) {
      logError(error, "DataService.checkStorageHealth")
      return {
        isHealthy: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }
  }

  /**
   * Export all database records as JSON for backup purposes
   */
  static async exportTableData(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from("uploaded_files")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        logError(error, "DataService.exportTableData")
        throw createAppError(ERROR_CODES.DATABASE_ERROR, `Failed to export table data: ${error.message}`)
      }

      // Create export data with metadata
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          version: "1.0",
          totalRecords: data?.length || 0,
          tableName: "uploaded_files"
        },
        data: data || []
      }

      // Convert to JSON string
      const jsonString = JSON.stringify(exportData, null, 2)
      
      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      // Create download link
      const link = document.createElement('a')
      link.href = url
      const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      link.download = `design-gallery-backup-${date}.json`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      URL.revokeObjectURL(url)
    } catch (error) {
      logError(error, "DataService.exportTableData")
      throw error
    }
  }

  /**
   * Apply tag filters to items (client-side filtering)
   */
  private static applyTagFilters(items: GalleryItem[], selectedTags: string[]): GalleryItem[] {
    const hasNoTagsFilter = selectedTags.includes("__no_tags__")
    // Filter out file type tags from regular tag filtering since they're handled separately
    const otherTags = selectedTags.filter(tag => 
      tag !== "__no_tags__" && !tag.startsWith("type:")
    )

    if (hasNoTagsFilter && otherTags.length > 0) {
      // Show items with no tags OR items with selected tags
      return items.filter(item =>
        item.tags.length === 0 || 
        otherTags.some(selectedTag => item.tags.includes(selectedTag))
      )
    } else if (hasNoTagsFilter) {
      // Show only items with no tags
      return items.filter(item => item.tags.length === 0)
    } else if (otherTags.length > 0) {
      // Show items with any of the selected tags
      return items.filter(item =>
        otherTags.some(selectedTag => item.tags.includes(selectedTag))
      )
    }
    
    return items
  }
}
