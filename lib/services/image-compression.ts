import sharp from 'sharp'

interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
  progressive?: boolean
}

interface CompressionResult {
  buffer: Buffer
  format: string
  size: number
  originalSize: number
  compressionRatio: number
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 85,
  format: 'webp',
  progressive: true
}

export class ImageCompressionService {
  /**
   * Compress an image buffer
   */
  static async compressImage(
    buffer: Buffer,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    const originalSize = buffer.length

    try {
      // Create Sharp instance
      let pipeline = sharp(buffer)

      // Get image metadata
      const metadata = await pipeline.metadata()
      
      // Skip compression for very small images
      if (originalSize < 50 * 1024) { // Less than 50KB
        return {
          buffer,
          format: metadata.format || 'unknown',
          size: originalSize,
          originalSize,
          compressionRatio: 1
        }
      }

      // Resize if needed
      if (opts.maxWidth || opts.maxHeight) {
        pipeline = pipeline.resize(opts.maxWidth, opts.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
      }

      // Apply format and quality
      let compressedBuffer: Buffer

      switch (opts.format) {
        case 'webp':
          compressedBuffer = await pipeline
            .webp({ 
              quality: opts.quality,
              progressive: opts.progressive
            })
            .toBuffer()
          break
          
        case 'jpeg':
          compressedBuffer = await pipeline
            .jpeg({ 
              quality: opts.quality,
              progressive: opts.progressive
            })
            .toBuffer()
          break
          
        case 'png':
          compressedBuffer = await pipeline
            .png({ 
              progressive: opts.progressive,
              compressionLevel: 9
            })
            .toBuffer()
          break
          
        default:
          // Auto-detect best format
          if (metadata.hasAlpha) {
            compressedBuffer = await pipeline
              .webp({ quality: opts.quality })
              .toBuffer()
          } else {
            compressedBuffer = await pipeline
              .webp({ quality: opts.quality })
              .toBuffer()
          }
      }

      const compressionRatio = originalSize / compressedBuffer.length

      return {
        buffer: compressedBuffer,
        format: opts.format || 'webp',
        size: compressedBuffer.length,
        originalSize,
        compressionRatio
      }

    } catch (error) {
      console.error('Image compression failed:', error)
      // Return original buffer if compression fails
      return {
        buffer,
        format: 'original',
        size: originalSize,
        originalSize,
        compressionRatio: 1
      }
    }
  }

  /**
   * Generate multiple sizes/formats for responsive images
   */
  static async generateResponsiveSizes(
    buffer: Buffer,
    sizes: number[] = [400, 800, 1200, 2048]
  ): Promise<{ [size: string]: CompressionResult }> {
    const results: { [size: string]: CompressionResult } = {}

    for (const size of sizes) {
      try {
        const compressed = await this.compressImage(buffer, {
          maxWidth: size,
          maxHeight: size,
          quality: size <= 400 ? 80 : 85,
          format: 'webp'
        })
        
        results[`${size}w`] = compressed
      } catch (error) {
        console.error(`Failed to generate ${size}px version:`, error)
      }
    }

    return results
  }

  /**
   * Check if file should be compressed
   */
  static shouldCompress(mimeType: string, size: number): boolean {
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff']
    const minSize = 100 * 1024 // 100KB minimum
    
    return imageTypes.includes(mimeType) && size > minSize
  }

  /**
   * Get optimal compression settings based on file type and size
   */
  static getOptimalSettings(mimeType: string, size: number): CompressionOptions {
    // Large images get more aggressive compression
    if (size > 5 * 1024 * 1024) { // > 5MB
      return {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 75,
        format: 'webp'
      }
    }
    
    // Medium images
    if (size > 1 * 1024 * 1024) { // > 1MB
      return {
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 80,
        format: 'webp'
      }
    }

    // Small images - light compression
    return {
      maxWidth: 2048,
      maxHeight: 2048,
      quality: 90,
      format: 'webp'
    }
  }
}
