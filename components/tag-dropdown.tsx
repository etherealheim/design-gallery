"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Tag, Check, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

interface TagDropdownProps {
  imageId: string
  imageTitle: string
  existingTags: string[]
  allTags: string[]
  onAddTag?: (id: string, tag: string) => void
  onAddMultipleTags?: (id: string, tags: string[]) => void
  className?: string
}

export function TagDropdown({
  imageId,
  imageTitle,
  existingTags,
  allTags,
  onAddTag,
  onAddMultipleTags,
  className = ""
}: TagDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const handleOpen = () => {
    setIsOpen(true)
    setSearchQuery("")
    setSelectedIndex(-1)
    // Focus input after state update
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleClose = () => {
    setIsOpen(false)
    setSearchQuery("")
    setSelectedIndex(-1)
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

  return (
    <div className={`relative ${className}`}>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0 bg-black/80 text-white hover:bg-black backdrop-blur-sm cursor-pointer border border-white/10"
        onClick={(e) => {
          e.stopPropagation()
          handleOpen()
        }}
      >
        <Tag className="h-3 w-3" />
      </Button>

      <DropdownMenu
        isOpen={isOpen}
        onClose={handleClose}
        className="w-64 max-h-80 overflow-hidden bottom-full left-0 mb-2"
        ref={dropdownRef}
      >
        <div className="p-2 border-b border-border">
          <Input
            ref={inputRef}
            value={searchQuery}
            onChange={handleInputChange}
            placeholder="Search tags or create new..."
            className="h-8 text-sm"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div className="max-h-48 overflow-y-auto">
          {/* Existing tags suggestions */}
          {filteredTags.map((tag, index) => (
            <DropdownMenuItem
              key={tag}
              onSelect={() => handleSelectTag(tag)}
              className={`flex items-center justify-between px-3 py-2 ${
                index === selectedIndex ? 'bg-accent' : ''
              }`}
            >
              <span className="text-sm">{tag}</span>
              <Badge variant="outline" className="text-xs">
                existing
              </Badge>
            </DropdownMenuItem>
          ))}

          {/* Create new tag option */}
          {searchQuery.trim() && !filteredTags.includes(searchQuery.trim()) && (
            <DropdownMenuItem
              onSelect={handleCreateNewTag}
              className={`flex items-center justify-between px-3 py-2 ${
                selectedIndex === filteredTags.length ? 'bg-accent' : ''
              }`}
            >
              <span className="text-sm">Create "{searchQuery.trim()}"</span>
              <Badge variant="default" className="text-xs">
                new
              </Badge>
            </DropdownMenuItem>
          )}

          {/* No results */}
          {filteredTags.length === 0 && !searchQuery.trim() && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Start typing to search or create tags...
            </div>
          )}

          {filteredTags.length === 0 && searchQuery.trim() && !allTags.includes(searchQuery.trim()) && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No matching tags found. Press Enter to create "{searchQuery.trim()}"
            </div>
          )}
        </div>
      </DropdownMenu>
    </div>
  )
}
