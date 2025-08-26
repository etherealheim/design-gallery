import JSZip from 'jszip'
import type { GalleryItem } from '@/types'
import { createAppError, ERROR_CODES, logError } from '@/lib/errors'
import { sanitizeFilename } from '@/lib/validation'

export interface ZipProgress {
  currentFile: number
  totalFiles: number
  currentFileName: string
  status: 'preparing' | 'downloading' | 'compressing' | 'complete' | 'error'
  percentage: number
}

export class ZipService {
  /**
   * Download multiple files and package them into a zip archive
   */
  static async downloadFilesAsZip(
    files: GalleryItem[],
    zipName: string = 'gallery-files',
    onProgress?: (progress: ZipProgress) => void
  ): Promise<void> {
    if (files.length === 0) {
      throw createAppError(ERROR_CODES.VALIDATION_ERROR, "No files to download")
    }

    const zip = new JSZip()
    const totalFiles = files.length
    let completedFiles = 0

    const updateProgress = (status: ZipProgress['status'], currentFileName: string = '') => {
      const percentage = status === 'complete' ? 100 : Math.round((completedFiles / totalFiles) * 100)
      onProgress?.({
        currentFile: completedFiles + 1,
        totalFiles,
        currentFileName,
        status,
        percentage
      })
    }

    try {
      updateProgress('preparing')

      // Track successful downloads and failed ones
      const results = {
        successful: [] as string[],
        failed: [] as { filename: string; error: string }[]
      }

      // Download all files and add them to the zip
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const sanitizedTitle = sanitizeFilename(file.title)
        const extension = this.getFileExtension(file)
        const filename = `${sanitizedTitle}.${extension}`

        updateProgress('downloading', filename)

        try {
          const response = await fetch(file.url)
          if (!response.ok) {
            results.failed.push({
              filename,
              error: `HTTP ${response.status}: ${response.statusText}`
            })
            completedFiles++
            continue
          }

          const blob = await response.blob()
          
          // Add file to zip with unique filename if there are duplicates
          const uniqueFilename = this.getUniqueFilename(zip, filename)
          zip.file(uniqueFilename, blob)
          
          results.successful.push(filename)
          completedFiles++

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          results.failed.push({
            filename,
            error: errorMessage
          })
          completedFiles++
          console.warn(`Failed to download ${filename}:`, error)
        }
      }

      // If no files were successfully downloaded, throw an error
      if (results.successful.length === 0) {
        throw createAppError(
          ERROR_CODES.INTERNAL_ERROR, 
          "Failed to download any files"
        )
      }

      updateProgress('compressing')

      // Generate the zip file
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6 // Good balance between size and speed
        }
      })

      updateProgress('complete')

      // Create download link
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${sanitizeFilename(zipName)}.zip`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      URL.revokeObjectURL(url)

      // Log results
      if (results.failed.length > 0) {
        console.warn(`Downloaded ${results.successful.length}/${totalFiles} files. Failed files:`, results.failed)
      }

    } catch (error) {
      updateProgress('error')
      logError(error, "ZipService.downloadFilesAsZip")
      throw createAppError(
        ERROR_CODES.INTERNAL_ERROR, 
        `Failed to create zip archive: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get file extension from gallery item
   */
  private static getFileExtension(file: GalleryItem): string {
    if (file.mimeType) {
      // Handle common MIME types
      const mimeToExtension: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/svg+xml': 'svg',
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'video/quicktime': 'mov',
        'application/pdf': 'pdf',
        'text/plain': 'txt'
      }
      
      if (mimeToExtension[file.mimeType]) {
        return mimeToExtension[file.mimeType]
      }
      
      // Fallback to MIME type second part
      const parts = file.mimeType.split('/')
      if (parts.length === 2) {
        return parts[1]
      }
    }
    
    // Fallback to URL extension
    const urlParts = file.url.split('.')
    if (urlParts.length > 1) {
      return urlParts[urlParts.length - 1].split('?')[0] // Remove query params
    }
    
    return 'bin' // Default fallback
  }

  /**
   * Get unique filename to avoid conflicts in zip
   */
  private static getUniqueFilename(zip: JSZip, filename: string): string {
    let uniqueFilename = filename
    let counter = 1
    
    while (zip.file(uniqueFilename)) {
      const parts = filename.split('.')
      if (parts.length > 1) {
        const extension = parts.pop()
        const baseName = parts.join('.')
        uniqueFilename = `${baseName} (${counter}).${extension}`
      } else {
        uniqueFilename = `${filename} (${counter})`
      }
      counter++
    }
    
    return uniqueFilename
  }

  /**
   * Estimate zip file size (rough approximation)
   */
  static estimateZipSize(files: GalleryItem[]): number {
    const totalSize = files.reduce((sum, file) => sum + (file.fileSize || 0), 0)
    // Assume ~10% compression for mixed media files
    return Math.round(totalSize * 0.9)
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}
