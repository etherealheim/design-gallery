"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

interface TagInputModalProps {
  imageId: string
  imageTitle: string
  existingTags: string[]
  allTags: string[]
  onAddTag?: (id: string, tag: string) => void
  onAddMultipleTags?: (id: string, tags: string[]) => void
  isOpen: boolean
  onClose: () => void
}

export function TagInputModal({
  imageId,
  imageTitle,
  existingTags,
  allTags,
  onAddTag,
  onAddMultipleTags,
  isOpen,
  onClose
}: TagInputModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Filter available tags based on search and exclude existing tags
  const filteredTags = allTags
    .filter(tag => !existingTags.includes(tag))
    .filter(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 10) // Limit to 10 suggestions

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < filteredTags.length - 1 ? prev + 1 : prev
          )
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex(prev => prev > -1 ? prev - 1 : -1)
          break
        case "Enter":
          e.preventDefault()
          if (selectedIndex >= 0 && selectedIndex < filteredTags.length) {
            handleSelectTag(filteredTags[selectedIndex])
          } else if (searchQuery.trim()) {
            handleCreateNewTag()
          }
          break
        case "Escape":
          e.preventDefault()
          handleClose()
          break
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, selectedIndex, filteredTags, searchQuery])

  // Reset selected index when filtered tags change
  useEffect(() => {
    setSelectedIndex(-1)
  }, [searchQuery])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleClose = () => {
    setSearchQuery("")
    setSelectedIndex(-1)
    onClose()
  }

  const handleSelectTag = async (tag: string) => {
    if (!onAddTag) return

    try {
      await onAddTag(imageId, tag)
      toast.success("Tag added", {
        description: `"${tag}" added to ${imageTitle}`,
      })
      handleClose()
    } catch (error) {
      console.error("Failed to add tag:", error)
      toast.error("Failed to add tag")
    }
  }

  const handleCreateNewTag = async () => {
    const newTag = searchQuery.trim()
    if (!newTag || !onAddTag) return

    try {
      await onAddTag(imageId, newTag)
      toast.success("Tag created and added", {
        description: `"${newTag}" created and added to ${imageTitle}`,
      })
      handleClose()
    } catch (error) {
      console.error("Failed to create tag:", error)
      toast.error("Failed to create tag")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setSelectedIndex(-1)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ 
          duration: 0.15,
          ease: "easeOut"
        }}
        className="flex items-center gap-1 px-2 py-1 text-sm border border-dashed border-muted-foreground/50 rounded-md bg-background/95 backdrop-blur-sm"
        ref={containerRef}
      >
        <Input
          ref={inputRef}
          value={searchQuery}
          onChange={handleInputChange}
          placeholder="Search tags or create new..."
          className="flex-1 h-4 text-base md:text-sm font-mono font-medium border-0 p-0 pl-1 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (selectedIndex >= 0 && selectedIndex < filteredTags.length) {
              handleSelectTag(filteredTags[selectedIndex])
            } else if (searchQuery.trim()) {
              handleCreateNewTag()
            }
          }}
          className="h-6 w-6 p-0 rounded-sm inline-flex items-center justify-center bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleClose()
          }}
          className="h-6 w-6 p-0 rounded-sm inline-flex items-center justify-center bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="h-3 w-3" />
        </button>
        
        {/* Suggestions dropdown */}
        {(filteredTags.length > 0 || searchQuery.trim()) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
            {/* Existing tags suggestions */}
            {filteredTags.map((tag, index) => (
              <div
                key={tag}
                onClick={() => handleSelectTag(tag)}
                className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors ${
                  index === selectedIndex ? 'bg-accent' : 'hover:bg-accent'
                }`}
              >
                <span>{tag}</span>
                <Badge variant="outline" className="text-xs">
                  existing
                </Badge>
              </div>
            ))}

            {/* Create new tag option */}
            {searchQuery.trim() && !filteredTags.includes(searchQuery.trim()) && (
              <div
                onClick={handleCreateNewTag}
                className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors ${
                  selectedIndex === filteredTags.length ? 'bg-accent' : 'hover:bg-accent'
                }`}
              >
                <span>Create "{searchQuery.trim()}"</span>
                <Badge variant="default" className="text-xs">
                  new
                </Badge>
              </div>
            )}

            {/* No results */}
            {filteredTags.length === 0 && !searchQuery.trim() && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Start typing to search or create tags...
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
