"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Play, ImageIcon, Trash2 } from "lucide-react"
import CheckIcon from "pqoqubbw-icons/icons/check"
import XIcon from "pqoqubbw-icons/icons/x"
import EditIcon from "pqoqubbw-icons/icons/square-pen"
import type { GalleryItem } from "@/types"
import { useState, useRef, useCallback, useEffect } from "react"
import { toast } from "sonner"

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
}: GalleryCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(image.title)
  const [isHovered, setIsHovered] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [newTag, setNewTag] = useState("")
  
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

  const handleAddTag = async () => {
    if (!newTag.trim() || !onAddTag) return
    
    // Parse multiple tags from input - support both space and comma separation
    const rawTags = newTag.trim()
    let tags: string[] = []
    
    // First try comma separation
    if (rawTags.includes(',')) {
      tags = rawTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    } else {
      // Fall back to space separation - split on any whitespace
      tags = rawTags.split(/\s+/).map(tag => tag.trim()).filter(tag => tag.length > 0)
    }
    
    console.log("Gallery Card - Raw input:", rawTags)
    console.log("Gallery Card - Parsed tags:", tags)
    console.log("Gallery Card - Current tags:", image.tags)
    
    // Remove duplicates and filter out existing tags
    const uniqueTags = [...new Set(tags)].filter(tag => !image.tags.includes(tag))
    console.log("Gallery Card - Unique tags to add:", uniqueTags)
    
    if (uniqueTags.length === 0) {
      console.log("Gallery Card - No unique tags to add")
      setNewTag("")
      setIsAddingTag(false)
      return
    }
    
    // Add tags one by one with proper error handling
    for (const tag of uniqueTags) {
      console.log("Gallery Card - Adding tag:", tag)
      try {
        await onAddTag?.(image.id, tag) // Wait for each tag to be processed
        console.log("Gallery Card - Successfully added tag:", tag)
      } catch (error) {
        console.error("Gallery Card - Failed to add tag:", tag, error)
      }
    }
    
    // Show success toast immediately
    if (uniqueTags.length === 1) {
      toast.success("Tag added", {
        description: `"${uniqueTags[0]}" added to ${image.title}`,
      })
    } else {
      toast.success(`${uniqueTags.length} tags added`, {
        description: `${uniqueTags.map(tag => `"${tag}"`).join(', ')} added to ${image.title}`,
      })
    }
    
    setNewTag("")
    setIsAddingTag(false)
  }

  const handleCancelAddTag = () => {
    setNewTag("")
    setIsAddingTag(false)
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
          viewMode === "list" ? "h-auto" : "h-auto sm:h-48"
        }`}>
          {image.type === "video" ? (
            <video
              key={image.url} // Force re-render when URL changes
              src={image.url}
              className="w-full h-full object-contain sm:object-cover"
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
              className="w-full h-full object-contain sm:object-cover"
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
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleSaveRename()
                }}
                className="h-6 w-6 p-0 rounded-md inline-flex items-center justify-center bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <CheckIcon size={14} className="text-black dark:text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCancelRename()
                }}
                className="h-6 w-6 p-0 rounded-md inline-flex items-center justify-center bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <XIcon size={14} className="text-black dark:text-white" />
              </button>
            </div>
          ) : (
            <h3 className="font-medium text-sm truncate flex-1">{image.title}</h3>
          )}

        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            {isAddingTag ? (
              /* Overlay input that covers the entire tag area */
              <motion.div
                key="input"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 25,
                  duration: 0.2
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs border border-dashed border-muted-foreground/50 rounded-md bg-background/95 backdrop-blur-sm"
              >
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Space or comma"
                  className="flex-1 h-4 text-base md:text-xs border-0 p-0 pl-1 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddTag()
                    } else if (e.key === "Escape") {
                      handleCancelAddTag()
                    }
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddTag()
                  }}
                  className="h-4 w-4 p-0 rounded-sm inline-flex items-center justify-center bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <CheckIcon size={12} className="text-black dark:text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCancelAddTag()
                  }}
                  className="h-4 w-4 p-0 rounded-sm inline-flex items-center justify-center bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <XIcon size={12} className="text-black dark:text-white" />
                </button>
              </motion.div>
            ) : (
              /* Normal tag display */
              <motion.div
                key="tags"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 25,
                  duration: 0.2
                }}
                className="flex flex-wrap gap-1"
              >
                {image.tags.map((tag, tagIndex) => (
                  <Badge key={tagIndex} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}

                {/* Keep pending tags for backward compatibility */}
                {pendingTags.map((tag, tagIndex) => (
                  <div
                    key={`pending-${tagIndex}`}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-dashed border-muted-foreground/50 rounded-md bg-transparent"
                  >
                    <span className="text-muted-foreground">{tag}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onConfirmTag(image.id, tag)
                      }}
                      className="h-4 w-4 p-0 rounded-sm inline-flex items-center justify-center bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <CheckIcon size={12} className="text-black dark:text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onRejectTag(image.id, tag)
                      }}
                      className="h-4 w-4 p-0 rounded-sm inline-flex items-center justify-center bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <XIcon size={12} className="text-black dark:text-white" />
                    </button>
                  </div>
                ))}

                {/* Show "Add tag" dashed badge */}
                <div
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-dashed border-muted-foreground/40 rounded-md bg-transparent cursor-pointer transition-all duration-200 hover:!border-muted-foreground/60 hover:!bg-muted/20"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsAddingTag(true)
                  }}
                >
                  <span className="text-muted-foreground/70 hover:text-muted-foreground transition-colors duration-200">Add tag</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
