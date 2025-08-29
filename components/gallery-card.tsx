"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BorderTrail } from "@/components/ui/border-trail"
import { Play, ImageIcon, Edit3, X, FileImage } from "lucide-react"
import { TagDropdown } from "@/components/tag-dropdown"

import type { GalleryItem } from "@/types"
import { useState, useRef, useCallback, useEffect } from "react"

// Mobile detection utility
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768
}

interface GalleryCardProps {
  image: GalleryItem
  viewMode: "grid" | "list"
  isNewlyUploaded: boolean
  pendingTags: string[]
  onPreview: (item: GalleryItem) => void
  onEdit: (item: GalleryItem) => void
  onDelete: (id: string) => void
  onConfirmTag: (id: string, tag: string) => void
  onRejectTag: (id: string, tag: string) => void
  onRename: (item: GalleryItem) => void
  onAddTag?: (id: string, tag: string) => void
  onAddMultipleTags?: (id: string, tags: string[]) => void
  selectedTags: string[]
  onToggleTagFilter: (tag: string) => void
  allTags: string[]
}

export function GalleryCard({
  image,
  viewMode,
  isNewlyUploaded,
  pendingTags,
  onPreview,
  onEdit,
  onDelete,
  onConfirmTag,
  onRejectTag,
  onRename,
  onAddTag,
  onAddMultipleTags,
  selectedTags,
  onToggleTagFilter,
  allTags,
}: GalleryCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showMobileControls, setShowMobileControls] = useState(false)
  const [videoThumbnailGenerated, setVideoThumbnailGenerated] = useState(false)
  const [isMobile] = useState(() => isMobileDevice())
  const [tapCount, setTapCount] = useState(0)
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle mobile tap behavior
  const handleMobileTap = useCallback(() => {
    if (!isMobile) return

    setTapCount(prev => prev + 1)

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current)
    }

    tapTimeoutRef.current = setTimeout(() => {
      if (tapCount === 0) {
        // First tap - show controls
        setShowMobileControls(true)
      } else if (tapCount === 1) {
        // Second tap - open modal
        onPreview(image)
      }
      setTapCount(0)
    }, 300)
  }, [isMobile, tapCount, onPreview, image])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current)
      }
    }
  }, [])

  return (
    <Card
      className={`hover:shadow-md transition-all duration-150 bg-card border-border cursor-pointer overflow-hidden p-0 my-0 relative ${
        viewMode === "list" ? "flex flex-row h-auto" : ""
      }`}
      onClick={() => {
        if (isMobile) {
          handleMobileTap()
        } else {
          onPreview(image)
        }
      }}
      onMouseEnter={() => {
        setIsHovered(true)
        console.log('Card hover enter:', image.title)
      }}
      onMouseLeave={() => {
        setIsHovered(false)
        console.log('Card hover leave:', image.title)
      }}
    >
      <div 
        className="relative overflow-hidden"
        onMouseEnter={image.type === "video" ? (e) => {
          const video = e.currentTarget.querySelector('video')
          if (video) {
            try {
              video.currentTime = 0
              video.play().then(() => {
                console.log('✅ Video hover play triggered via card:', image.url)
              }).catch((error) => {
                console.log('❌ Video hover play failed via card:', error)
              })
            } catch (error) {
              console.log('❌ Video hover error via card:', error)
            }
          }
        } : undefined}
        onMouseLeave={image.type === "video" ? (e) => {
          const video = e.currentTarget.querySelector('video')
          if (video) {
            try {
              video.pause()
              video.currentTime = 0
              console.log('⏸️ Video hover pause triggered via card:', image.url)
            } catch (error) {
              console.log('❌ Video pause error via card:', error)
            }
          }
        } : undefined}
      >
        {/* Media Element - Full cover */}
        <div className={`w-full h-48 sm:h-64 transition-transform duration-150 ease-out ${isHovered ? 'scale-105' : 'scale-100'}`}>
          {image.type === "video" ? (
            <video
              key={image.url} // Force re-render when URL changes
              src={image.url}
              className="w-full h-full object-cover cursor-pointer"
              muted
              loop
              playsInline
              preload="metadata"
              poster={`${image.url}#t=0.5`} // Request thumbnail at 0.5 seconds
              crossOrigin="anonymous"
              style={{ pointerEvents: 'none' }} // Prevent video controls from interfering
              onLoadedMetadata={(e) => {
                // Generate thumbnail for mobile devices
                const video = e.currentTarget
                if (video.duration && !videoThumbnailGenerated) {
                  const thumbnailTime = Math.min(0.5, video.duration / 10)
                  video.currentTime = thumbnailTime
                  console.log(`📊 Video metadata loaded (Mobile: ${isMobile}), setting thumbnail time:`, thumbnailTime)
                }
              }}
              onSeeked={(e) => {
                // Mark thumbnail as generated when seeking is complete
                const video = e.currentTarget
                if (!videoThumbnailGenerated) {
                  setVideoThumbnailGenerated(true)
                  console.log('📊 Video thumbnail generated successfully')
                  
                  // On mobile, pause immediately to preserve thumbnail
                  if (isMobile) {
                    video.pause()
                  }
                }
              }}
              onError={(e) => {
                console.error('🚨 Gallery video loading error:', e.currentTarget.error);
                console.log('🔗 Video URL:', image.url);
                console.log('🔗 Mobile device:', isMobile);
              }}
              onMouseEnter={async (e) => {
                // Skip autoplay on mobile devices
                if (isMobile) return
                
                e.preventDefault()
                const video = e.currentTarget
                try {
                  if (video.readyState >= 2 && videoThumbnailGenerated) {
                    video.currentTime = 0
                    const playPromise = video.play()
                    if (playPromise) {
                      await playPromise
                      console.log('✅ Video autoplay started (desktop):', image.url)
                    }
                  } else {
                    console.log('⏳ Video not ready or thumbnail not generated yet:', image.url)
                  }
                } catch (error) {
                  console.log('❌ Video autoplay blocked/failed:', error, image.url)
                }
              }}
              onMouseLeave={(e) => {
                // Skip on mobile devices
                if (isMobile) return
                
                e.preventDefault()
                const video = e.currentTarget
                try {
                  video.pause()
                  // Reset to thumbnail time instead of 0 for better preview
                  const thumbnailTime = video.duration ? Math.min(0.5, video.duration / 10) : 0
                  video.currentTime = thumbnailTime
                  console.log('⏸️ Video autoplay paused (desktop):', image.url)
                } catch (error) {
                  console.log('Error pausing video:', error)
                }
              }}
              onCanPlay={() => {
                console.log('🎬 Video can play (Mobile:', isMobile, '):', image.url)
              }}
            />
          ) : (
            <img
              src={image.url || "/placeholder.svg"}
              alt={image.title}
              className="w-full h-full object-cover cursor-pointer"
              loading="lazy"
              onError={(e) => {
                console.warn('Gallery image failed to load, using placeholder:', image.url);
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
          )}
        </div>
        
        {/* Action Buttons - Top Left (Desktop hover or Mobile controls visible) */}
        <div 
          className={`absolute top-2 left-2 flex gap-1 z-20 transition-opacity duration-150 ${
            (isHovered && !isMobile) || (isMobile && showMobileControls) ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 bg-black/80 text-white hover:bg-black backdrop-blur-sm cursor-pointer border border-white/10"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(image)
            }}
          >
            <Edit3 className="h-3 w-3" />
          </Button>
          {!image.id.match(/^\d+$/) && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 bg-black/80 text-white hover:bg-white/20 backdrop-blur-sm cursor-pointer border border-white/10"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(image.id)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Media Type Indicator - Top Right (Desktop hover or Mobile controls visible) */}
        <div 
          className={`absolute top-2 right-2 z-10 transition-opacity duration-150 ${
            (isHovered && !isMobile) || (isMobile && showMobileControls) ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 bg-black/80 text-white hover:bg-black backdrop-blur-sm border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {image.type === "video" ? (
              <Play className="h-3 w-3" />
            ) : image.type === "gif" ? (
              <FileImage className="h-3 w-3" />
            ) : (
              <ImageIcon className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* Tag Button - Bottom Left (Always visible on mobile, hover on desktop) */}
        <div 
          className={`absolute bottom-2 left-2 z-20 transition-opacity duration-150 ${
            isMobile ? 'opacity-100' : (isHovered ? 'opacity-100' : 'opacity-0')
          }`}
        >
          <TagDropdown
            imageId={image.id}
            imageTitle={image.title}
            existingTags={image.tags}
            allTags={allTags}
            onAddTag={onAddTag}
            onAddMultipleTags={onAddMultipleTags}
          />
        </div>
      </div>
      
      {/* Border Trail Effect */}
      {isHovered && (
        <BorderTrail
          style={{
            boxShadow:
              '0px 0px 60px 30px rgb(255 255 255 / 50%), 0 0 100px 60px rgb(0 0 0 / 50%), 0 0 140px 90px rgb(0 0 0 / 50%)',
          }}
          size={150}
        />
      )}
    </Card>
  )
}