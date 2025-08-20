"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TagInputProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
  className?: string
}

const defaultSuggestions = [
  "button",
  "navigation",
  "form",
  "card",
  "modal",
  "dropdown",
  "menu",
  "header",
  "footer",
  "sidebar",
  "dashboard",
  "table",
  "chart",
  "graph",
  "login",
  "signup",
  "profile",
  "settings",
  "search",
  "filter",
  "pagination",
  "tabs",
  "accordion",
  "carousel",
  "gallery",
  "timeline",
  "notification",
  "tooltip",
  "popover",
  "dialog",
  "alert",
  "badge",
  "avatar",
  "progress",
  "loading",
  "skeleton",
  "modern",
  "minimal",
  "creative",
  "clean",
  "elegant",
  "bold",
  "subtle",
  "gradient",
  "flat",
  "blue",
  "green",
  "red",
  "purple",
  "orange",
  "pink",
  "yellow",
  "gray",
  "black",
  "white",
  "mobile",
  "desktop",
  "responsive",
  "dark",
  "light",
  "colorful",
  "monochrome",
  "pastel",
  "ux",
  "ui",
  "design",
  "layout",
  "component",
  "pattern",
  "inspiration",
  "concept",
  "prototype",
]

export function TagInput({
  tags,
  onTagsChange,
  suggestions = defaultSuggestions,
  placeholder = "Add tags...",
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = suggestions
        .filter(
          (suggestion) => suggestion.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(suggestion),
        )
        .slice(0, 8)
      setFilteredSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }, [inputValue, suggestions, tags])

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onTagsChange([...tags, trimmedTag])
    }
    setInputValue("")
    setShowSuggestions(false)
  }

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      if (inputValue.trim()) {
        addTag(inputValue)
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className={cn("relative", className)}>
      <div className="flex flex-wrap gap-2 p-3 border border-input rounded-lg bg-background min-h-[2.5rem] focus-within:ring-2 focus-within:ring-ring focus-within:border-input">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs font-medium">
            {tag}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
              onClick={() => removeTag(tag)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue && setShowSuggestions(filteredSuggestions.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="border-0 p-0 h-6 flex-1 min-w-[120px] focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
        />
      </div>

      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2"
              onClick={() => addTag(suggestion)}
            >
              <Plus className="h-3 w-3 text-muted-foreground" />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
