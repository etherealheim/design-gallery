"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { VideoCompressionService, VideoMetadata } from "@/lib/services/video-compression"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

interface VideoCompressionSettingsProps {
  file: File
  onCompressionComplete?: (compressedBlob: Blob, metadata: VideoMetadata) => void
  onCancel?: () => void
}

export function VideoCompressionSettings({ 
  file, 
  onCompressionComplete, 
  onCancel 
}: VideoCompressionSettingsProps) {
  const [enableCompression, setEnableCompression] = useState(
    VideoCompressionService.shouldCompress(file)
  )
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionProgress, setCompressionProgress] = useState(0)
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null)

  // Get video metadata on component mount
  useState(() => {
    VideoCompressionService.getVideoMetadata(file).then((metadata) => {
      setVideoMetadata({
        ...metadata,
        size: file.size,
        type: file.type
      })
    }).catch(console.error)
  })

  const handleCompress = async () => {
    if (!enableCompression) {
      // Skip compression, return original file
      const metadata: VideoMetadata = videoMetadata || {
        width: 0,
        height: 0,
        duration: 0,
        size: file.size,
        type: file.type
      }
      onCompressionComplete?.(file, metadata)
      return
    }

    setIsCompressing(true)
    setCompressionProgress(0)

    try {
      const result = await VideoCompressionService.optimizeVideo(
        file,
        undefined, // Let service determine target size
        (progress) => {
          setCompressionProgress(progress)
        }
      )

      const metadata: VideoMetadata = {
        width: videoMetadata?.width || 0,
        height: videoMetadata?.height || 0,
        duration: result.duration,
        size: result.compressedSize,
        type: result.blob.type
      }

      toast.success("Video compression complete", {
        description: `Size reduced from ${VideoCompressionService.formatFileSize(result.originalSize)} to ${VideoCompressionService.formatFileSize(result.compressedSize)}`
      })

      onCompressionComplete?.(result.blob, metadata)
    } catch (error) {
      console.error("Compression failed:", error)
      toast.error("Compression failed", {
        description: "Using original video file"
      })
      
      // Fallback to original file
      const metadata: VideoMetadata = videoMetadata || {
        width: 0,
        height: 0,
        duration: 0,
        size: file.size,
        type: file.type
      }
      onCompressionComplete?.(file, metadata)
    } finally {
      setIsCompressing(false)
      setCompressionProgress(0)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const estimatedSavings = enableCompression && videoMetadata 
    ? Math.round((1 - (VideoCompressionService.shouldCompress(file) ? 0.6 : 1)) * 100)
    : 0

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Video Upload Settings</CardTitle>
        <CardDescription>
          Configure compression options for your video
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Video Info */}
        {videoMetadata && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">Resolution</div>
              <div className="text-muted-foreground">
                {videoMetadata.width} × {videoMetadata.height}
              </div>
            </div>
            <div>
              <div className="font-medium">Duration</div>
              <div className="text-muted-foreground">
                {formatDuration(videoMetadata.duration)}
              </div>
            </div>
            <div>
              <div className="font-medium">File Size</div>
              <div className="text-muted-foreground">
                {VideoCompressionService.formatFileSize(file.size)}
              </div>
            </div>
            <div>
              <div className="font-medium">Format</div>
              <div className="text-muted-foreground">
                {file.type.split('/')[1].toUpperCase()}
              </div>
            </div>
          </div>
        )}

        {/* Compression Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="font-medium">Enable Compression</div>
            <div className="text-sm text-muted-foreground">
              Reduce file size for faster uploads
            </div>
          </div>
          <Switch
            checked={enableCompression}
            onCheckedChange={setEnableCompression}
            disabled={isCompressing}
          />
        </div>

        {/* Compression Info */}
        {enableCompression && (
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">Compression Active</Badge>
              {estimatedSavings > 0 && (
                <Badge variant="outline">~{estimatedSavings}% smaller</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Video will be optimized for web playback with H.264 encoding
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {isCompressing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Compressing video...</span>
              <span>{compressionProgress}%</span>
            </div>
            <Progress value={compressionProgress} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={isCompressing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCompress}
            disabled={isCompressing}
            className="flex-1"
          >
            {isCompressing ? "Compressing..." : enableCompression ? "Compress & Upload" : "Upload Original"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
