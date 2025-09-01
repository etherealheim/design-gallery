"use client"

import { motion, AnimatePresence } from "framer-motion"
import { memo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { Edit3, X } from "lucide-react"
import { PlayIcon, ImageIcon, FileImageIcon } from "@/components/icons"
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
  onRemoveTag?: (id: string, tag: string) => void
  selectedTags: string[]
  onToggleTagFilter: (tag: string) => void
  allTags: string[]
}

function GalleryCardComponent({
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
  onRemoveTag,
  selectedTags,
  onToggleTagFilter,
  allTags,
}: GalleryCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [videoThumbnailGenerated, setVideoThumbnailGenerated] = useState(false)
  const [isMobile] = useState(() => isMobileDevice())
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const actionButtonsVisible = isMobile || isHovered

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  return (
    <Card
      className={`gallery-card hover:shadow-md transition-all duration-150 bg-card border-border cursor-pointer overflow-hidden p-0 my-0 relative rounded-2xl ${
        viewMode === "list" ? "flex flex-row h-auto" : ""
      }`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      onClick={() => onPreview(image)}
      onMouseEnter={() => {
        setIsHovered(true)
      }}
      onMouseLeave={() => {
        setIsHovered(false)
      }}
    >
      <div 
        className="relative overflow-hidden"
        onMouseEnter={image.type === "video" ? (e) => {
          const video = e.currentTarget.querySelector('video')
          if (video) {
            video.currentTime = 0
            video.play().catch(() => {
              // Silently handle autoplay failures
            })
          }
        } : undefined}
        onMouseLeave={image.type === "video" ? (e) => {
          const video = e.currentTarget.querySelector('video')
          if (video) {
            video.pause()
            video.currentTime = 0
          }
        } : undefined}
      >
        {/* Media Element - Full cover */}
        <div className={`w-full h-[256px] transition-transform duration-200 ease-out overflow-hidden rounded-2xl ${isHovered ? 'scale-[1.02]' : 'scale-100'}`}>
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
                }
              }}
              onSeeked={(e) => {
                // Mark thumbnail as generated when seeking is complete
                const video = e.currentTarget
                if (!videoThumbnailGenerated) {
                  setVideoThumbnailGenerated(true)
                  
                  // On mobile, pause immediately to preserve thumbnail
                  if (isMobile) {
                    video.pause()
                  }
                }
              }}
              onError={(e) => {
                console.error('Video loading error:', e.currentTarget.error);
              }}
              onMouseEnter={(e) => {
                // Skip autoplay on mobile devices
                if (isMobile) return
                
                e.preventDefault()
                const video = e.currentTarget
                if (video.readyState >= 2 && videoThumbnailGenerated) {
                  video.currentTime = 0
                  video.play().catch(() => {
                    // Silently handle autoplay failures
                  })
                }
              }}
              onMouseLeave={(e) => {
                // Skip on mobile devices
                if (isMobile) return
                
                e.preventDefault()
                const video = e.currentTarget
                video.pause()
                // Reset to thumbnail time for better preview
                const thumbnailTime = video.duration ? Math.min(0.5, video.duration / 10) : 0
                video.currentTime = thumbnailTime
              }}
              onCanPlay={() => {
                // Video is ready to play
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
          className={`absolute top-[16px] left-[16px] flex gap-1 z-20 transition-opacity duration-150 ${
            actionButtonsVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 bg-black/80 text-white hover:bg-black backdrop-blur-sm cursor-pointer border border-white/10 rounded-lg"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(image)
            }}
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          {!image.id.match(/^\d+$/) && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 bg-black/80 text-white hover:bg-white/20 backdrop-blur-sm cursor-pointer border border-white/10 rounded-lg"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(image.id)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Tag Overlay - Full Card Coverage */}
        <TagDropdown
          imageId={image.id}
          imageTitle={image.title}
          imageType={image.type}
          existingTags={image.tags}
          allTags={allTags}
          recentTags={allTags.slice(0, 5)} // TODO: Replace with actual recent tags logic
          onAddTag={onAddTag}
          onAddMultipleTags={onAddMultipleTags}
          onRemoveTag={onRemoveTag}
          isHovered={isHovered}
          isMobile={isMobile}
        />

        {/* Media Type Indicator - Bottom Left (Always visible) */}
        <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
          <div className="h-6 w-6 rounded-lg flex items-center justify-center bg-black/40 backdrop-blur-sm text-white border border-white/10">
            {image.type === "video" ? (
              <PlayIcon className="h-3.5 w-3.5" />
            ) : image.type === "gif" ? (
              <FileImageIcon className="h-3.5 w-3.5" />
            ) : (
              <ImageIcon className="h-3.5 w-3.5" />
            )}
          </div>
        </div>
      </div>
      

    </Card>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const GalleryCard = memo(GalleryCardComponent, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.image.id === nextProps.image.id &&
    prevProps.image.title === nextProps.image.title &&
    prevProps.image.url === nextProps.image.url &&
    prevProps.image.tags.length === nextProps.image.tags.length &&
    prevProps.image.tags.every((tag, i) => tag === nextProps.image.tags[i]) &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.isNewlyUploaded === nextProps.isNewlyUploaded &&
    prevProps.pendingTags.length === nextProps.pendingTags.length &&
    prevProps.selectedTags.length === nextProps.selectedTags.length &&
    prevProps.allTags.length === nextProps.allTags.length
  )
})