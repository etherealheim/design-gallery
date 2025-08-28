"use client"

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL, fetchFile } from '@ffmpeg/util'

interface ConversionProgress {
  ratio: number
  time: string
  speed: string
}

interface VideoConversionResult {
  blob: Blob
  originalSize: number
  convertedSize: number
  duration: number
  format: string
}

export class VideoConversionService {
  private static ffmpeg: FFmpeg | null = null
  private static isLoaded = false
  private static isLoading = false

  /**
   * Initialize FFmpeg instance
   */
  private static async initFFmpeg(): Promise<void> {
    if (this.isLoaded || this.isLoading) {
      return
    }

    this.isLoading = true

    try {
      if (!this.ffmpeg) {
        this.ffmpeg = new FFmpeg()
      }

      // Load FFmpeg with progress logging
      this.ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg]', message)
      })

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd'
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })

      this.isLoaded = true
      console.log('[FFmpeg] Loaded successfully')
    } catch (error) {
      console.error('[FFmpeg] Failed to load:', error)
      this.isLoaded = false
      throw error
    } finally {
      this.isLoading = false
    }
  }

  /**
   * Check if a file should be converted (MOV files)
   */
  static shouldConvert(file: File): boolean {
    return file.name.toLowerCase().endsWith('.mov') || 
           file.type.includes('quicktime') ||
           file.type === 'video/quicktime'
  }

  /**
   * Convert MOV to MP4 using FFmpeg
   */
  static async convertMovToMp4(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<VideoConversionResult> {
    if (!this.shouldConvert(file)) {
      // Return original file if no conversion needed
      return {
        blob: file,
        originalSize: file.size,
        convertedSize: file.size,
        duration: 0,
        format: file.type
      }
    }

    console.log('[Video Conversion] Starting MOV to MP4 conversion:', file.name)
    
    // Check browser support first
    if (!this.isSupported()) {
      console.warn('[Video Conversion] Browser does not support FFmpeg.wasm (missing SharedArrayBuffer or WebAssembly)')
      console.warn('[Video Conversion] Requirements: HTTPS, recent browser version, SharedArrayBuffer support')
      console.warn('[Video Conversion] Chrome/Edge 92+, Firefox 79+, Safari 15.2+ required')
      
      // Return original file as fallback
      return {
        blob: file,
        originalSize: file.size,
        convertedSize: file.size,
        duration: 0,
        format: file.type
      }
    }
    
    try {
      // Initialize FFmpeg with timeout
      const initTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('FFmpeg initialization timeout')), 30000) // 30 second timeout
      )
      
      await Promise.race([this.initFFmpeg(), initTimeout])
      
      if (!this.ffmpeg) {
        throw new Error('FFmpeg failed to initialize')
      }

      onProgress?.(10) // Initialization complete

      // Write input file to FFmpeg filesystem
      const inputFileName = 'input.mov'
      const outputFileName = 'output.mp4'
      
      await this.ffmpeg.writeFile(inputFileName, await fetchFile(file))
      onProgress?.(20) // File loaded

      // Set up progress tracking
      let lastProgress = 20
      this.ffmpeg.on('progress', ({ ratio }) => {
        const progress = Math.min(20 + (ratio * 70), 90) // 20-90% for conversion
        if (progress > lastProgress + 5) { // Only update every 5% to reduce spam
          onProgress?.(Math.round(progress))
          lastProgress = progress
        }
      })

      console.log('[Video Conversion] Running FFmpeg conversion...')
      
      // Convert MOV to MP4 with web-optimized settings and timeout
      const conversionTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('FFmpeg conversion timeout - file may be too large or complex')), 5 * 60 * 1000) // 5 minute timeout
      )
      
      const conversionPromise = this.ffmpeg.exec([
        '-i', inputFileName,
        '-c:v', 'libx264',        // Use H.264 codec for video
        '-c:a', 'aac',            // Use AAC codec for audio
        '-preset', 'fast',        // Faster encoding (was 'medium')
        '-crf', '28',             // Slightly lower quality but faster (was 23)
        '-movflags', '+faststart', // Optimize for web streaming
        '-pix_fmt', 'yuv420p',    // Ensure compatibility
        '-max_muxing_queue_size', '9999', // Prevent queue overflow
        '-t', '300',              // Limit to 5 minutes max duration
        outputFileName
      ])
      
      await Promise.race([conversionPromise, conversionTimeout])

      onProgress?.(90) // Conversion complete

      // Read the converted file
      const data = await this.ffmpeg.readFile(outputFileName)
      const convertedBlob = new Blob([data], { type: 'video/mp4' })

      onProgress?.(95) // File read complete

      // Clean up FFmpeg filesystem
      try {
        await this.ffmpeg.deleteFile(inputFileName)
        await this.ffmpeg.deleteFile(outputFileName)
      } catch (cleanupError) {
        console.warn('[Video Conversion] Cleanup warning:', cleanupError)
      }

      onProgress?.(100) // Complete

      console.log('[Video Conversion] Conversion successful:', {
        originalSize: file.size,
        convertedSize: convertedBlob.size,
        compression: (file.size / convertedBlob.size).toFixed(2) + 'x'
      })

      return {
        blob: convertedBlob,
        originalSize: file.size,
        convertedSize: convertedBlob.size,
        duration: 0, // Duration would need separate extraction
        format: 'video/mp4'
      }

    } catch (error) {
      console.error('[Video Conversion] Failed:', error)
      
      // Return original file as fallback
      console.log('[Video Conversion] Falling back to original file')
      return {
        blob: file,
        originalSize: file.size,
        convertedSize: file.size,
        duration: 0,
        format: file.type
      }
    }
  }

  /**
   * Get estimated conversion time (rough estimate)
   */
  static estimateConversionTime(fileSize: number): string {
    const sizeInMB = fileSize / (1024 * 1024)
    const estimatedMinutes = Math.ceil(sizeInMB / 10) // ~10MB per minute estimate
    
    if (estimatedMinutes <= 1) {
      return '~1 minute'
    } else if (estimatedMinutes <= 5) {
      return `~${estimatedMinutes} minutes`
    } else {
      return `~${estimatedMinutes} minutes (large file)`
    }
  }

  /**
   * Check if browser supports FFmpeg.wasm
   */
  static isSupported(): boolean {
    if (typeof window === 'undefined') {
      console.log('[Video Conversion] Not in browser environment')
      return false
    }
    
    const hasSharedArrayBuffer = 'SharedArrayBuffer' in window
    const hasWebAssembly = 'WebAssembly' in window
    const isSecureContext = window.isSecureContext
    const hasCoopCoep = document.querySelector('meta[http-equiv="Cross-Origin-Embedder-Policy"]') !== null ||
                        document.querySelector('meta[http-equiv="Cross-Origin-Opener-Policy"]') !== null
    
    console.log('[Video Conversion] Browser support check:', {
      hasSharedArrayBuffer,
      hasWebAssembly, 
      isSecureContext,
      hasCoopCoep,
      userAgent: navigator.userAgent
    })
    
    return hasSharedArrayBuffer && hasWebAssembly && isSecureContext
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}
