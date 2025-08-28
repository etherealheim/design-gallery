interface VideoCompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxBitrate?: number
  reduceFrameRate?: boolean
  targetFrameRate?: number
}

export interface VideoMetadata {
  width: number
  height: number
  duration: number
  size: number
  type: string
}

interface VideoCompressionResult {
  blob: Blob
  originalSize: number
  compressedSize: number
  compressionRatio: number
  duration: number
}

const DEFAULT_OPTIONS: VideoCompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  maxBitrate: 2000000, // 2 Mbps
  reduceFrameRate: false,
  targetFrameRate: 30
}

export class VideoCompressionService {
  /**
   * Check if video should be compressed based on file size and dimensions
   */
  static shouldCompress(file: File): boolean {
    const minSize = 10 * 1024 * 1024 // 10MB minimum
    return file.type.startsWith('video/') && file.size > minSize
  }

  /**
   * Get optimal compression settings based on file size
   */
  static getOptimalSettings(fileSize: number): VideoCompressionOptions {
    // Very large videos (>100MB) - aggressive compression
    if (fileSize > 100 * 1024 * 1024) {
      return {
        maxWidth: 1280,
        maxHeight: 720,
        quality: 0.7,
        maxBitrate: 1500000, // 1.5 Mbps
        reduceFrameRate: true,
        targetFrameRate: 24
      }
    }
    
    // Large videos (>50MB) - moderate compression
    if (fileSize > 50 * 1024 * 1024) {
      return {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.75,
        maxBitrate: 2000000, // 2 Mbps
        reduceFrameRate: false,
        targetFrameRate: 30
      }
    }

    // Medium videos - light compression
    return {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.85,
      maxBitrate: 3000000, // 3 Mbps
      reduceFrameRate: false,
      targetFrameRate: 30
    }
  }

  /**
   * Compress video using Canvas API and MediaRecorder (lightweight browser-native approach)
   */
  static async compressVideo(
    file: File,
    options: VideoCompressionOptions = {},
    onProgress?: (progress: number) => void
  ): Promise<VideoCompressionResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    const originalSize = file.size

    try {
      // Create video element to get dimensions and duration
      const video = document.createElement('video')
      video.muted = true
      
      const videoMetadata = await new Promise<{ width: number; height: number; duration: number }>((resolve, reject) => {
        video.onloadedmetadata = () => {
          resolve({
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration
          })
        }
        video.onerror = reject
        video.src = URL.createObjectURL(file)
      })

      // Calculate target dimensions maintaining aspect ratio
      const aspectRatio = videoMetadata.width / videoMetadata.height
      let targetWidth = Math.min(videoMetadata.width, opts.maxWidth || 1920)
      let targetHeight = Math.min(videoMetadata.height, opts.maxHeight || 1080)

      if (targetWidth / targetHeight > aspectRatio) {
        targetWidth = targetHeight * aspectRatio
      } else {
        targetHeight = targetWidth / aspectRatio
      }

      // Create canvas for video processing
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      canvas.width = targetWidth
      canvas.height = targetHeight

      // Set up MediaRecorder for compression with fallback codecs for mobile compatibility
      const stream = canvas.captureStream(opts.targetFrameRate || 30)
      
      // Try different codecs in order of preference, with fallbacks for mobile
      let mediaRecorderOptions = null
      const codecOptions = [
        { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: opts.maxBitrate },
        { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: opts.maxBitrate },
        { mimeType: 'video/webm', videoBitsPerSecond: opts.maxBitrate },
        { mimeType: 'video/mp4;codecs=h264', videoBitsPerSecond: opts.maxBitrate },
        { mimeType: 'video/mp4', videoBitsPerSecond: opts.maxBitrate },
        { videoBitsPerSecond: opts.maxBitrate } // Fallback with no specific codec
      ]
      
      for (const option of codecOptions) {
        try {
          if (MediaRecorder.isTypeSupported(option.mimeType || '')) {
            mediaRecorderOptions = option
            break
          }
        } catch (e) {
          continue
        }
      }
      
      if (!mediaRecorderOptions) {
        // Final fallback - use default MediaRecorder without specific codec
        mediaRecorderOptions = { videoBitsPerSecond: opts.maxBitrate }
      }
      
      const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions)

      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      const compressionPromise = new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          const compressedBlob = new Blob(chunks, { type: 'video/webm' })
          resolve(compressedBlob)
        }
      })

      // Start recording
      mediaRecorder.start(100) // Record in 100ms chunks

      // Process video frame by frame
      let currentTime = 0
      const frameInterval = 1 / (opts.targetFrameRate || 30)
      const totalFrames = Math.ceil(videoMetadata.duration * (opts.targetFrameRate || 30))
      let processedFrames = 0

      const processFrame = () => {
        return new Promise<void>((resolve) => {
          video.currentTime = currentTime
          video.onseeked = () => {
            // Draw current frame to canvas (this automatically handles resizing)
            ctx.drawImage(video, 0, 0, targetWidth, targetHeight)
            
            processedFrames++
            onProgress?.(Math.round((processedFrames / totalFrames) * 100))
            
            currentTime += frameInterval
            
            if (currentTime < videoMetadata.duration) {
              // Process next frame after a brief delay
              setTimeout(() => processFrame().then(resolve), 16) // ~60fps processing
            } else {
              resolve()
            }
          }
        })
      }

      // Start processing
      await processFrame()
      
      // Stop recording
      mediaRecorder.stop()
      
      // Wait for compression to complete
      const compressedBlob = await compressionPromise

      // Clean up
      URL.revokeObjectURL(video.src)

      const compressionRatio = originalSize / compressedBlob.size

      return {
        blob: compressedBlob,
        originalSize,
        compressedSize: compressedBlob.size,
        compressionRatio,
        duration: videoMetadata.duration
      }

    } catch (error) {
      console.error('Video compression failed:', error)
      // Return original file as blob if compression fails
      return {
        blob: file,
        originalSize,
        compressedSize: file.size,
        compressionRatio: 1,
        duration: 0
      }
    }
  }

  /**
   * Simple video optimization using HTMLVideoElement and Canvas
   * More reliable but less compression than full ffmpeg approach
   */
  static async optimizeVideo(
    file: File,
    targetSize?: number,
    onProgress?: (progress: number) => void
  ): Promise<VideoCompressionResult> {
    // For files smaller than target size, return as-is
    if (targetSize && file.size <= targetSize) {
      return {
        blob: file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
        duration: 0
      }
    }

    const settings = this.getOptimalSettings(file.size)
    return this.compressVideo(file, settings, onProgress)
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

  /**
   * Get video metadata without processing
   */
  static async getVideoMetadata(file: File): Promise<{ width: number; height: number; duration: number }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src)
        resolve({
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration
        })
      }
      video.onerror = reject
      video.src = URL.createObjectURL(file)
    })
  }
}
