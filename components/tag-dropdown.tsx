"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tag, X } from "lucide-react"
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
  isHovered?: boolean
  isMobile?: boolean
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
  isHovered = false,
  isMobile = false
}: TagDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [dropdownPosition, setDropdownPosition] = useState({ 
    buttonTop: 0,
    buttonLeft: 0,
    cardTop: 0,
    cardLeft: 0,
    cardWidth: 200,
    cardHeight: 300
  })
  
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Filter tags based on search and exclude existing tags
  const filteredAllTags = allTags
    .filter(tag => !existingTags.includes(tag))
    .filter(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 10)

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      const totalItems = filteredAllTags.length + (searchQuery.trim() && !allTags.includes(searchQuery.trim()) ? 1 : 0)

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex(prev => {
            const newIndex = prev < totalItems - 1 ? prev + 1 : prev
            // Scroll into view
            setTimeout(() => {
              const container = scrollContainerRef.current
              if (container && newIndex >= 0) {
                const items = container.querySelectorAll('[data-tag-item]')
                const selectedItem = items[newIndex] as HTMLElement
                if (selectedItem) {
                  if (newIndex === totalItems - 1) {
                    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
                  } else {
                    selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
                  }
                }
              }
            }, 0)
            return newIndex
          })
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex(prev => {
            const newIndex = prev > -1 ? prev - 1 : -1
            // Scroll into view
            setTimeout(() => {
              const container = scrollContainerRef.current
              if (container && newIndex >= 0) {
                const items = container.querySelectorAll('[data-tag-item]')
                const selectedItem = items[newIndex] as HTMLElement
                if (selectedItem) {
                  if (newIndex === 0) {
                    container.scrollTo({ top: 0, behavior: 'smooth' })
                  } else {
                    selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
                  }
                }
              }
            }, 0)
            return newIndex
          })
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

  // Calculate positioning
  const calculatePosition = useCallback(() => {
    const containerEl = containerRef.current
    const cardElement = containerEl?.closest('.gallery-card')
    
    if (containerEl && cardElement) {
      const containerRect = containerEl.getBoundingClientRect()
      const cardRect = cardElement.getBoundingClientRect()
      
      setDropdownPosition({
        buttonTop: containerRect.top - cardRect.top,
        buttonLeft: containerRect.left - cardRect.left,
        cardTop: 8, // relative to card
        cardLeft: 8,
        cardWidth: cardRect.width - 16,
        cardHeight: cardRect.height - 16
      })
    }
  }, [])

  // Calculate position on mount and when needed
  useEffect(() => {
    if (containerRef.current) {
      calculatePosition()
    }
  }, [calculatePosition, isHovered, isMobile])
  // Recalculate position on scroll and resize to keep alignment
  useEffect(() => {
    const handleScrollResize = () => {
      calculatePosition()
    }

    window.addEventListener('scroll', handleScrollResize, true)
    window.addEventListener('resize', handleScrollResize)

    return () => {
      window.removeEventListener('scroll', handleScrollResize, true)
      window.removeEventListener('resize', handleScrollResize)
    }
  }, [calculatePosition])

  const handleOpen = useCallback(() => {
    calculatePosition()
    setIsOpen(true)
    setSearchQuery("")
    setSelectedIndex(-1)
    // Make input active without focus (no keyboard popup)
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.click()
      }
    }, 150)
  }, [calculatePosition])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setSearchQuery("")
    setSelectedIndex(-1)
  }, [])

  const handleToggle = useCallback(() => {
    if (isOpen) {
      handleClose()
    } else {
      handleOpen()
    }
  }, [isOpen, handleOpen, handleClose])

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (isOpen && 
          !document.querySelector('[data-tag-morphing]')?.contains(target)) {
        handleClose()
      }
    }

    if (isOpen) {
      const timeoutId = window.setTimeout(() => {
        document.addEventListener("click", handleClickOutside)
      }, 100) // small delay to avoid initial tap being treated as outside click
      return () => {
        window.clearTimeout(timeoutId)
        document.removeEventListener("click", handleClickOutside)
      }
    }
  }, [isOpen, handleClose])

  const handleSelectTag = async (tag: string) => {
    if (!onAddTag) return
    try {
      await onAddTag(imageId, tag)
      toast.success("Tag added", {
        description: `${tag} added to ${imageType}`,
      })
      // keep dropdown open for multiple selections
      setSearchQuery("")
      setSelectedIndex(-1)
      // focus back to input
      setTimeout(() => inputRef.current?.focus(), 0)
    } catch (error) {
      console.error("Failed to add tag:", error)
      toast.error("Failed to add tag")
    }
  }

  const handleCreateNewTag = async () => {
    const rawInput = searchQuery.trim()
    if (!rawInput || !onAddMultipleTags) return

    // Parse multiple tags from input
    let tags: string[] = []
    if (rawInput.includes(',')) {
      tags = rawInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    } else {
      tags = rawInput.split(/\s+/).map(tag => tag.trim()).filter(tag => tag.length > 0)
    }
    
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
      // stay open for further tagging
      setSearchQuery("")
      setSelectedIndex(-1)
      setTimeout(() => inputRef.current?.focus(), 0)
    } catch (error) {
      console.error("Failed to create tags:", error)
      toast.error("Failed to create tags")
    }
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

  const showButton = isHovered || isMobile

  return (
    <>
      {/* Invisible positioning container */}
      <div 
        ref={containerRef}
        className="absolute top-[16px] right-[16px] z-10 w-8 h-8 pointer-events-none"
      />

      {/* Morphing Button/Dropdown */}
      <AnimatePresence>
          {(isOpen || showButton) && (
            <motion.div
              data-tag-morphing
              className={`absolute ${isOpen ? 'z-[9999]' : 'z-30'} overflow-hidden flex flex-col border border-white/10 transition-colors duration-150 rounded-lg
                ${isOpen ? 'bg-popover text-popover-foreground cursor-default' : 'bg-black/80 text-white cursor-pointer hover:bg-black/60 backdrop-blur-sm'}`}
              initial={false}
              animate={{
                top: isOpen ? dropdownPosition.cardTop : dropdownPosition.buttonTop,
                left: isOpen ? dropdownPosition.cardLeft : dropdownPosition.buttonLeft,
                width: isOpen ? dropdownPosition.cardWidth : 32,
                height: isOpen ? dropdownPosition.cardHeight : 32,
                borderRadius: isOpen ? 12 : 8,
                ...(isOpen ? {
                  backgroundColor: 'hsl(var(--popover))',
                  borderColor: 'hsl(var(--border))',
                } : {}),
              }}
              exit={{
                top: dropdownPosition.buttonTop,
                left: dropdownPosition.buttonLeft,
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                opacity: 0,
              }}
              transition={{
                type: isOpen ? 'spring' : 'tween',
                duration: isOpen ? undefined : 0.15,
                stiffness: isOpen ? 350 : 300,
                damping: isOpen ? 24 : 30,
                mass: isOpen ? 0.65 : 1,
              }}
              style={{
                transformOrigin: "top right"
              }}
              onClick={(e) => {
                if (!isOpen) {
                  e.stopPropagation()
                  handleToggle()
                }
              }}
            >
              {/* Button State */}
              {!isOpen && (
                <div
                  className={`w-full h-full flex items-center justify-center transition-opacity duration-150 ${
                    showButton ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <Tag className="h-4 w-4" />
                </div>
              )}

              {/* Dropdown State */}
              {isOpen && (
                <motion.div
                  className="w-full h-full flex flex-col text-popover-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                >
                  {/* Header with Search and Close */}
                  <div className="p-2">
                    <div className="flex gap-2 items-center">
                      <Input
                        ref={inputRef}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search tags or create new..."
                        className="h-8 text-sm flex-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 shrink-0 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleClose()
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Existing Tags */}
                    {existingTags.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex flex-wrap gap-1 mt-3"
                      >
                        {existingTags.map((tag, index) => (
                          <motion.div
                            key={tag}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.15 + index * 0.03 }}
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
                                className="ml-1 rounded-sm p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {/* Scrollable Tags List */}
                  <div ref={scrollContainerRef} className="overflow-y-auto p-2 pt-0 pb-2 flex-1 space-y-0.5">
                    {/* Filtered Tags */}
                    {filteredAllTags.map((tag, index) => (
                      <motion.div
                        key={tag}
                        data-tag-item
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                        onClick={() => handleSelectTag(tag)}
                        className={`flex items-center px-2 py-2 text-sm cursor-pointer rounded-lg transition-colors ${
                          index === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        <span>{tag}</span>
                      </motion.div>
                    ))}

                    {/* Create New Tag Option */}
                    {searchQuery.trim() && !allTags.includes(searchQuery.trim()) && (() => {
                      const rawInput = searchQuery.trim()
                      let tags: string[] = []
                      
                      if (rawInput.includes(',')) {
                        tags = rawInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
                      } else {
                        tags = rawInput.split(/\s+/).map(tag => tag.trim()).filter(tag => tag.length > 0)
                      }
                      
                      const uniqueTags = [...new Set(tags)].filter(tag => !existingTags.includes(tag))
                      
                      return (
                        <motion.div
                          data-tag-item
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + filteredAllTags.length * 0.05 }}
                          onClick={handleCreateNewTag}
                          className={`flex items-start gap-2 px-2 py-2 text-sm cursor-pointer rounded-lg transition-colors ${
                            selectedIndex === filteredAllTags.length ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                          }`}
                        >
                          <span className="text-muted-foreground shrink-0 mt-0.5">Create</span>
                          <div className="flex flex-wrap gap-1 min-w-0">
                            {uniqueTags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs bg-background/80">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </motion.div>
                      )
                    })()}

                    {/* No Results */}
                    {filteredAllTags.length === 0 && !searchQuery.trim() && (
                      <div className="px-2 py-2 text-sm text-muted-foreground">
                        Start typing to search or create tags...
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
    </>
  )
}