"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoPreviewProps {
  src: string
  title: string
  className?: string
  autoPlay?: boolean
  muted?: boolean
  controls?: boolean
  width?: number
  height?: number
}

export function VideoPreview({
  src,
  title,
  className,
  autoPlay = false,
  muted = true,
  controls = true,
  width = 400,
  height = 300
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(muted)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  const togglePlay = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const toggleFullscreen = () => {
    if (!videoRef.current) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      videoRef.current.requestFullscreen()
    }
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    setCurrentTime(videoRef.current.currentTime)
  }

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return
    setDuration(videoRef.current.duration)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return
    const time = (parseFloat(e.target.value) / 100) * duration
    videoRef.current.currentTime = time
    setCurrentTime(time)
  }

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0 relative group">
        <video
          ref={videoRef}
          src={src}
          width={width}
          height={height}
          autoPlay={autoPlay}
          muted={isMuted}
          className="w-full h-auto"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        >
          Your browser does not support the video tag.
        </video>

        {/* Custom Controls Overlay */}
        {controls && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200">
            {/* Play/Pause Button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                onClick={togglePlay}
                size="lg"
                className="rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </Button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4">
              {/* Progress Bar */}
              <div className="mb-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressPercentage}
                  onChange={handleSeek}
                  className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #ffffff ${progressPercentage}%, rgba(255,255,255,0.3) ${progressPercentage}%)`
                  }}
                />
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={togglePlay}
                    size="sm"
                    variant="ghost"
                    className="p-1 h-auto text-white hover:text-white hover:bg-white/20"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    onClick={toggleMute}
                    size="sm"
                    variant="ghost"
                    className="p-1 h-auto text-white hover:text-white hover:bg-white/20"
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>

                  <span className="text-sm font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <Button
                  onClick={toggleFullscreen}
                  size="sm"
                  variant="ghost"
                  className="p-1 h-auto text-white hover:text-white hover:bg-white/20"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {!duration && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="text-white text-sm">Loading video...</div>
          </div>
        )}
      </CardContent>
      
      {/* Video Title */}
      <div className="p-3 border-t">
        <h3 className="font-medium text-sm truncate">{title}</h3>
      </div>
    </Card>
  )
}
