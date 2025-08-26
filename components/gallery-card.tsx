"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Edit3, X, Play, ImageIcon, Check, Trash2 } from "lucide-react"
import type { GalleryItem } from "@/types"
import { useState, useRef, useCallback, useEffect } from "react"

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
}: GalleryCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(image.title)
  const [isHovered, setIsHovered] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const handleSaveRename = async () => {
    if (editTitle.trim() && editTitle !== image.title) {
      const newTitle = editTitle.trim()
      
      // Optimistically update the title immediately
      const updatedImage = { ...image, title: newTitle }
      
      // Update parent component state immediately
      setIsEditing(false)
      
      try {
        // Call the rename function which should handle the API update
        await onRename(updatedImage)
      } catch (error) {
        // If rename fails, revert the title
        setEditTitle(image.title)
        console.error("Failed to rename:", error)
      }
    } else {
      setIsEditing(false)
    }
  }

  const handleCancelRename = () => {
    setEditTitle(image.title)
    setIsEditing(false)
  }

  // Long press handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isEditing) return
    
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    
    longPressTimerRef.current = setTimeout(() => {
      // Calculate menu position relative to the touch point
      const rect = e.currentTarget.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top
      
      setMenuPosition({ x, y })
      setShowMobileMenu(true)
      
      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500) // 500ms long press
  }, [isEditing])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    touchStartRef.current = null
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !longPressTimerRef.current) return
    
    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x)
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y)
    
    // Cancel long press if finger moves too much (more than 10px)
    if (deltaX > 10 || deltaY > 10) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const handleMobileRename = () => {
    setShowMobileMenu(false)
    setIsEditing(true)
  }

  const handleMobileDelete = () => {
    setShowMobileMenu(false)
    onDelete(image.id)
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

  return (
    <Card
      className={`hover:shadow-md transition-all duration-300 bg-card border-border cursor-pointer overflow-hidden p-0 my-0 relative ${
        viewMode === "list" ? "flex flex-row h-auto" : ""
      }`}
      onClick={() => !isEditing && !showMobileMenu && onPreview(image)}
      onMouseEnter={() => {
        setIsHovered(true)
        console.log('Card hover enter:', image.title)
      }}
      onMouseLeave={() => {
        setIsHovered(false)
        console.log('Card hover leave:', image.title)
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
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
        {/* Media Element - Consistent styling for both video and image */}
        <div className={`w-full transition-transform duration-300 ${isHovered ? 'scale-105' : 'scale-100'} ${
          viewMode === "list" ? "h-auto" : "h-48"
        }`}>
          {image.type === "video" ? (
            <video
              key={image.url} // Force re-render when URL changes
              src={image.url}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
              preload="metadata"
              crossOrigin="anonymous"
              style={{ pointerEvents: 'none' }} // Prevent video controls from interfering
              onMouseEnter={async (e) => {
                e.preventDefault()
                const video = e.currentTarget
                try {
                  if (video.readyState >= 2) { // HAVE_CURRENT_DATA or better
                    video.currentTime = 0
                    const playPromise = video.play()
                    if (playPromise) {
                      await playPromise
                      console.log('✅ Video autoplay started:', image.url)
                    }
                  } else {
                    console.log('⏳ Video not ready yet:', image.url)
                  }
                } catch (error) {
                  console.log('❌ Video autoplay blocked/failed:', error, image.url)
                }
              }}
              onMouseLeave={(e) => {
                e.preventDefault()
                const video = e.currentTarget
                try {
                  video.pause()
                  video.currentTime = 0
                  console.log('⏸️ Video autoplay paused:', image.url)
                } catch (error) {
                  console.log('Error pausing video:', error)
                }
              }}
              onError={(e) => {
                console.error('🚨 Gallery video loading error:', e.currentTarget.error);
                console.log('🔗 Video URL:', image.url);
              }}
              onCanPlay={() => {
                console.log('🎬 Video can play:', image.url)
              }}
              onLoadedData={() => {
                console.log('📊 Video loaded data:', image.url)
              }}
            />
          ) : (
            <img
              src={image.url || "/placeholder.svg"}
              alt={image.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                console.error('Gallery image loading error for:', image.url);
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
          )}
        </div>
        
        {/* Hover Overlay - Consistent for both types */}
        <div 
          className={`absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`} 
        />

        {/* Action Buttons - Left Side */}
        <div 
          className={`absolute top-2 left-2 flex gap-1 z-20 transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 bg-black/80 text-white hover:bg-black backdrop-blur-sm cursor-pointer border border-white/10"
            onClick={(e) => {
              e.stopPropagation()
              setIsEditing(true)
            }}
          >
            <Edit3 className="h-3 w-3" />
          </Button>
          {!image.id.match(/^\d+$/) && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 bg-black/80 text-white hover:bg-red-600 backdrop-blur-sm cursor-pointer border border-white/10"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(image.id)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Media Type Indicator - Right Side - Always Visible */}
        <div className="absolute top-2 right-2 z-10">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 bg-black/80 text-white hover:bg-black backdrop-blur-sm border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {image.type === "video" ? (
              <Play className="h-3 w-3" />
            ) : (
              <ImageIcon className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      <div className="p-3 pt-1">
        <div className="flex items-start gap-2 mb-2">
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-6 text-sm flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveRename()
                  } else if (e.key === "Escape") {
                    handleCancelRename()
                  }
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSaveRename()
                }}
                className="h-6 w-6 p-0 hover:bg-muted"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCancelRename()
                }}
                className="h-6 w-6 p-0 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <h3 className="font-medium text-sm truncate flex-1">{image.title}</h3>
          )}

        </div>

        <div className="flex flex-wrap gap-1">
          {image.tags.map((tag, tagIndex) => (
            <Badge key={tagIndex} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}

          {pendingTags.map((tag, tagIndex) => (
            <div
              key={`pending-${tagIndex}`}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-dashed border-muted-foreground/50 rounded-md bg-transparent"
            >
              <span className="text-muted-foreground">{tag}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onConfirmTag(image.id, tag)
                }}
                className="h-4 w-4 p-0 hover:bg-muted"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onRejectTag(image.id, tag)
                }}
                className="h-4 w-4 p-0 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Long Press Menu */}
      <DropdownMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        className="top-0 left-0"
        style={{
          top: `${menuPosition.y}px`,
          left: `${menuPosition.x}px`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <DropdownMenuItem onSelect={handleMobileRename}>
          <Edit3 className="h-4 w-4 mr-2" />
          Rename
        </DropdownMenuItem>
        {!image.id.match(/^\d+$/) && (
          <DropdownMenuItem onSelect={handleMobileDelete} destructive>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenu>
    </Card>
  )
}
