"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tag, Check, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

interface TagDropdownProps {
  imageId: string
  imageTitle: string
  imageType: "image" | "video" | "gif"
  existingTags: string[]
  allTags: string[]
  recentTags?: string[]
  onAddTag?: (id: string, tag: string) => void
  onAddMultipleTags?: (id: string, tags: string[]) => void
  onRemoveTag?: (id: string, tag: string) => void
  className?: string
  autoOpenAfterDelay?: boolean
  onAutoClose?: () => void
}

export function TagDropdown({
  imageId,
  imageTitle,
  imageType,
  existingTags,
  allTags,
  recentTags = [],
  onAddTag,
  onAddMultipleTags,
  onRemoveTag,
  className = "",
  autoOpenAfterDelay = false,
  onAutoClose
}: TagDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isManuallyOpened, setIsManuallyOpened] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 0, buttonX: 0, buttonY: 0 })
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const bridgeRef = useRef<HTMLDivElement>(null)
  const autoOpenTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Filter all tags based on search and exclude existing tags
  const filteredAllTags = allTags
    .filter(tag => !existingTags.includes(tag))
    .filter(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 10) // Limit to 10 suggestions

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      const totalItems = filteredAllTags.length + (searchQuery.trim() && !allTags.includes(searchQuery.trim()) ? 1 : 0)

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < totalItems - 1 ? prev + 1 : prev
          )
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex(prev => prev > -1 ? prev - 1 : -1)
          break
        case "Enter":
          e.preventDefault()
          if (selectedIndex >= 0) {
            if (selectedIndex < filteredAllTags.length) {
              handleSelectTag(filteredAllTags[selectedIndex])
            } else if (searchQuery.trim()) {
              handleCreateNewTag()
            }
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
  }, [isOpen, selectedIndex, filteredAllTags, searchQuery, allTags])

  // Reset selected index when filtered tags change
  useEffect(() => {
    setSelectedIndex(-1)
  }, [searchQuery])

  const handleOpen = useCallback((manual = false) => {
    // Prefer button position; fallback to container -> closest gallery card
    const anchorEl = buttonRef.current || containerRef.current
    if (anchorEl) {
      const buttonRect = anchorEl.getBoundingClientRect()
      const cardElement = anchorEl.closest('.gallery-card')
      const cardRect = cardElement ? cardElement.getBoundingClientRect() : buttonRect

      // Position dropdown 4px below the tag button
      const dropdownTop = buttonRect.bottom + 4
      // Calculate height so bottom aligns with card bottom
      const maxHeight = cardRect.bottom - dropdownTop - 8 // 8px padding from card bottom

      setDropdownPosition({
        top: dropdownTop,
        left: cardRect.left + 8, // Add left padding
        width: cardRect.width - 16, // Account for left and right padding
        maxHeight: Math.max(200, maxHeight), // Minimum height of 200px
        buttonX: buttonRect.left + buttonRect.width / 2, // Center of button X
        buttonY: buttonRect.top + buttonRect.height / 2, // Center of button Y
      })
    }
    setIsOpen(true)
    setIsManuallyOpened(manual)
    setSearchQuery("")
    setSelectedIndex(-1)
    // Focus input after a brief delay for spring animation
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  // Auto-open immediately when requested by parent (no extra delay)
  useEffect(() => {
    if (autoOpenAfterDelay && !isOpen) {
      handleOpen(false)
    }
  }, [autoOpenAfterDelay, isOpen, handleOpen])



  // Auto-close when parent signal turns off and dropdown was auto-opened
  useEffect(() => {
    if (!autoOpenAfterDelay && isOpen && !isManuallyOpened) {
      handleClose()
    }
  }, [autoOpenAfterDelay, isOpen, isManuallyOpened])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
          bridgeRef.current && !bridgeRef.current.contains(event.target as Node)) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsOpen(false)
    setIsManuallyOpened(false)
    setSearchQuery("")
    setSelectedIndex(-1)
    // If this was an auto-opened dropdown, notify parent
    if (!isManuallyOpened && onAutoClose) {
      onAutoClose()
    }
  }

  const handleToggle = () => {
    if (isOpen) {
      handleClose()
    } else {
      handleOpen(true)
    }
  }

  const handleSelectTag = async (tag: string) => {
    if (!onAddTag) return

    try {
      await onAddTag(imageId, tag)
      toast.success("Tag added", {
        description: `${tag} added to ${imageType}`,
      })
      handleClose()
    } catch (error) {
      console.error("Failed to add tag:", error)
      toast.error("Failed to add tag")
    }
  }

  const handleCreateNewTag = async () => {
    const rawInput = searchQuery.trim()
    if (!rawInput || !onAddMultipleTags) return

    // Parse multiple tags from input - support both space and comma separation
    let tags: string[] = []
    
    // First try comma separation
    if (rawInput.includes(',')) {
      tags = rawInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    } else {
      // Fall back to space separation - split on any whitespace
      tags = rawInput.split(/\s+/).map(tag => tag.trim()).filter(tag => tag.length > 0)
    }
    
    // Remove duplicates and filter out existing tags
    const uniqueTags = [...new Set(tags)].filter(tag => !existingTags.includes(tag))
    
    if (uniqueTags.length === 0) {
      handleClose()
      return
    }

    try {
      await onAddMultipleTags(imageId, uniqueTags)
      if (uniqueTags.length === 1) {
        toast.success("Tag created and added", {
          description: `${uniqueTags[0]} created and added to ${imageType}`,
        })
      } else {
        toast.success(`${uniqueTags.length} tags created and added`, {
          description: `${uniqueTags.join(', ')} added to ${imageType}`,
        })
      }
      handleClose()
    } catch (error) {
      console.error("Failed to create tags:", error)
      toast.error("Failed to create tags")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setSelectedIndex(-1)
  }

  const handleRemoveExistingTag = async (tag: string) => {
    if (!onRemoveTag) return

    try {
      await onRemoveTag(imageId, tag)
      toast.success("Tag removed", {
        description: `${tag} removed from ${imageType}`,
      })
    } catch (error) {
      console.error("Failed to remove tag:", error)
      toast.error("Failed to remove tag")
    }
  }

  return (
    <>
      <div ref={containerRef} className="inline-block">
      <Button
        ref={buttonRef}
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0 bg-black/80 text-white hover:bg-black backdrop-blur-sm cursor-pointer border border-white/10 rounded-lg"
        onMouseDown={(e) => {
          // Use mousedown to ensure activation before click handlers higher up
          e.stopPropagation()
          handleToggle()
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Tag className="h-4 w-4" />
      </Button>
      </div>

      {/* Working dropdown with proper positioning */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Invisible bridge to prevent accidental closing when hovering over gap */}
              <div
                ref={bridgeRef}
                className="fixed z-[9998]"
                            style={{
              top: dropdownPosition.top - 4, // Cover the 4px gap
              left: dropdownPosition.left,
              width: dropdownPosition.width || 256,
              height: 4, // Height of the gap
              backgroundColor: 'transparent', // Invisible
            }}
              />
              <motion.div
            ref={dropdownRef}
            className="fixed z-[9999] overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-lg flex flex-col"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width || 256,
              maxHeight: dropdownPosition.maxHeight || 400,
              transformOrigin: `${dropdownPosition.buttonX - dropdownPosition.left}px ${dropdownPosition.buttonY - dropdownPosition.top}px`,
            }}
            initial={{ 
              opacity: 0, 
              scale: 0.3,
              y: -10
            }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: 0
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.8,
              y: -5
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              mass: 0.8
            }}
            onClick={(e) => e.stopPropagation()}
          >
          <div className="p-4 pb-2">
            <div className="relative flex gap-2">
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={handleInputChange}
                placeholder="Search tags or create new..."
                className="h-8 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-input flex-1"
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-muted cursor-pointer shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClose()
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Existing tags as badges - moved below search */}
            {existingTags.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  delay: 0.15
                }}
                className="flex flex-wrap gap-1 mt-3"
              >
                {existingTags.map((tag, index) => (
                  <motion.div
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                      delay: 0.2 + index * 0.03
                    }}
                  >
                    <Badge
                      variant="secondary"
                      className="text-sm flex items-center gap-1 pr-1 h-7"
                    >
                      {tag}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveExistingTag(tag)
                        }}
                        className="ml-1 rounded-sm p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          <div 
            className="overflow-y-auto px-2 py-1 flex-1"
          >
            {/* All tags section */}
            {filteredAllTags.map((tag, index) => (
              <motion.div
                key={`all-${tag}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: index * 0.05 // Stagger delay
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelectTag(tag)
                }}
                className={`flex items-center px-2 py-2 mx-1 text-sm cursor-pointer rounded-lg transition-colors ${
                  index === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <span>{tag}</span>
              </motion.div>
            ))}

            {/* Create new tag option */}
            {searchQuery.trim() && !allTags.includes(searchQuery.trim()) && (() => {
              const rawInput = searchQuery.trim()
              let tags: string[] = []
              
              // Parse multiple tags from input - support both space and comma separation
              if (rawInput.includes(',')) {
                tags = rawInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
              } else {
                tags = rawInput.split(/\s+/).map(tag => tag.trim()).filter(tag => tag.length > 0)
              }
              
              // Remove duplicates and filter out existing tags
              const uniqueTags = [...new Set(tags)].filter(tag => !existingTags.includes(tag))
              
              return (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: filteredAllTags.length * 0.05 // Appears after all filtered tags
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCreateNewTag()
                  }}
                  className={`flex items-start gap-2 px-2 py-2 mx-1 mb-2 text-sm cursor-pointer rounded-lg transition-colors ${
                    selectedIndex === filteredAllTags.length ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <span className="text-muted-foreground shrink-0 mt-0.5">Create</span>
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {uniqueTags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-background/80 hover:bg-background">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              )
            })()}

            {/* No results */}
            {filteredAllTags.length === 0 && !searchQuery.trim() && (
              <div className="px-2 py-2 mx-1 text-sm text-muted-foreground">
                Start typing to search or create tags...
              </div>
            )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
