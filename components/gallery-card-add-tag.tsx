"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Check, X } from "lucide-react"
import { useState, useRef, useLayoutEffect } from "react"
import { toast } from "sonner"

interface GalleryCardAddTagProps {
  imageId: string
  imageTitle: string
  existingTags: string[]
  onAddTag?: (id: string, tag: string) => void
  onAddMultipleTags?: (id: string, tags: string[]) => void
}

export function GalleryCardAddTag({
  imageId,
  imageTitle,
  existingTags,
  onAddTag,
  onAddMultipleTags,
}: GalleryCardAddTagProps) {
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [newTag, setNewTag] = useState("")
  const [collapsedWidth, setCollapsedWidth] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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
    
    // Remove duplicates and filter out existing tags
    const uniqueTags = [...new Set(tags)].filter(tag => !existingTags.includes(tag))
    
    if (uniqueTags.length === 0) {
      setNewTag("")
      setIsAddingTag(false)
      return
    }
    
    // INSTANT UI UPDATE - Clear input and close immediately for snappy feel
    setNewTag("")
    setIsAddingTag(false)
    
    // Show success toast immediately
    if (uniqueTags.length === 1) {
      toast.success("Tag added", {
        description: `"${uniqueTags[0]}" added to ${imageTitle}`,
      })
    } else {
      toast.success(`${uniqueTags.length} tags added`, {
        description: `${uniqueTags.map(tag => `"${tag}"`).join(', ')} added to ${imageTitle}`,
      })
    }

    // Add all tags in a single batch to prevent race conditions
    if (onAddMultipleTags) {
      try {
        await onAddMultipleTags(imageId, uniqueTags)
      } catch (error) {
        console.error("Failed to add tags:", error)
      }
    }
  }

  const handleCancelAddTag = () => {
    setNewTag("")
    setIsAddingTag(false)
  }

  // Initial measurement on mount
  useLayoutEffect(() => {
    if (containerRef.current && collapsedWidth === null) {
      const width = containerRef.current.getBoundingClientRect().width
      setCollapsedWidth(width)
    }
  }, [collapsedWidth])

  // Re-measure when returning to collapsed state
  useLayoutEffect(() => {
    if (!isAddingTag && containerRef.current) {
      // Small delay to ensure DOM has updated
      const timeoutId = setTimeout(() => {
        if (containerRef.current) {
          const width = containerRef.current.getBoundingClientRect().width
          setCollapsedWidth(width)
        }
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [isAddingTag])

  return (
    <>
      {/* Placeholder to maintain exact space when overlay is active */}
      {isAddingTag && collapsedWidth && (
        <div 
          className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-dashed rounded-md opacity-0 pointer-events-none" 
          style={{height: '24px', width: `${collapsedWidth}px`}}
        >
          <span className="text-muted-foreground/90 font-mono font-medium whitespace-nowrap">Add tag</span>
        </div>
      )}
      
      <motion.div
        ref={containerRef}
        layout
        layoutId="add-tag-container"
        className={`
          items-center gap-1 py-1 text-xs border border-dashed 
          rounded-md cursor-pointer overflow-hidden
          ${isAddingTag 
            ? 'absolute top-0 left-0 right-0 z-50 flex border-muted-foreground/50 bg-card/95 backdrop-blur-sm shadow-md px-1' 
            : 'inline-flex border-muted-foreground/80 hover:border-muted-foreground hover:bg-muted/30 px-2'
          }
        `}
        style={{
          height: '24px',
          width: !isAddingTag && collapsedWidth ? `${collapsedWidth}px` : undefined
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (!isAddingTag) setIsAddingTag(true)
        }}

        transition={{
          layout: { 
            type: "spring",
            stiffness: 800,
            damping: 60,
            mass: 0.3
          },
          backgroundColor: { 
            type: "spring",
            stiffness: 600,
            damping: 45
          },
          borderColor: { 
            type: "spring",
            stiffness: 600,
            damping: 45
          }
        }}
      >
      <AnimatePresence mode="wait" initial={false}>
        {isAddingTag ? (
          <motion.div
            key="input-content"
            className="flex items-center gap-1 w-full min-w-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 450,
              damping: 30,
              mass: 0.5,
              duration: 0.3
            }}
          >
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Use space or comma..."
              className="flex-1 h-4 text-base md:text-xs font-mono font-medium border-0 p-0 pl-1 !bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 min-w-24"
              style={{ backgroundColor: 'transparent !important' }}
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
            
            <motion.div
              className="flex items-center gap-0.5 flex-shrink-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 450,
                damping: 32,
                delay: 0.05
              }}
            >
              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAddTag()
                }}
                className="h-4 w-4 p-0 rounded-sm inline-flex items-center justify-center bg-black/20 dark:bg-white/20 hover:bg-white dark:hover:bg-white text-foreground dark:text-white hover:text-black dark:hover:text-black transition-all duration-150 cursor-pointer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                  delay: 0.08
                }}
              >
                <Check className="h-3 w-3" />
              </motion.button>
              
              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCancelAddTag()
                }}
                className="h-4 w-4 p-0 rounded-sm inline-flex items-center justify-center bg-black/20 dark:bg-white/20 hover:bg-white dark:hover:bg-white text-foreground dark:text-white hover:text-black dark:hover:text-black transition-all duration-150 cursor-pointer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                  delay: 0.12
                }}
              >
                <X className="h-3 w-3" />
              </motion.button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.span
            key="add-tag-text"
            className="text-muted-foreground/90 hover:text-foreground font-mono font-medium transition-colors duration-200 whitespace-nowrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 800,
              damping: 35,
              mass: 0.2
            }}
          >
            Add tag
          </motion.span>
        )}
      </AnimatePresence>
      </motion.div>
    </>
  )
}
