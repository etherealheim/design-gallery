"use client"

import { useState, useCallback } from "react"
import type { GalleryItem } from "@/types"

export function usePreviewModal() {
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null)
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [newTag, setNewTag] = useState("")

  // Open preview modal with item
  const openPreview = useCallback((item: GalleryItem) => {
    setPreviewItem(item)
    setIsAddingTag(false)
    setNewTag("")
  }, [])

  // Close preview modal
  const closePreview = useCallback(() => {
    setPreviewItem(null)
    setIsAddingTag(false)
    setNewTag("")
  }, [])

  // Start adding a new tag
  const startAddingTag = useCallback(() => {
    setIsAddingTag(true)
    setNewTag("")
  }, [])

  // Cancel adding tag
  const cancelAddingTag = useCallback(() => {
    setIsAddingTag(false)
    setNewTag("")
  }, [])

  // Handle tag input change
  const handleTagInputChange = useCallback((value: string) => {
    setNewTag(value)
  }, [])

  // Add tag to current item
  const addTag = useCallback(async (
    onSave: (id: string, updates: { title?: string; tags?: string[] }) => Promise<void>
  ) => {
    if (!previewItem || !newTag.trim()) return false

    const trimmedTag = newTag.trim().toLowerCase()
    
    // Check if tag already exists
    if (previewItem.tags.includes(trimmedTag)) {
      setNewTag("")
      setIsAddingTag(false)
      return false
    }

    try {
      const updatedTags = [...previewItem.tags, trimmedTag]
      await onSave(previewItem.id, { tags: updatedTags })
      
      // Update local state
      setPreviewItem((prev: GalleryItem | null) => prev ? { ...prev, tags: updatedTags } : null)
      setNewTag("")
      setIsAddingTag(false)
      
      return true
    } catch (error) {
      console.error("Failed to add tag:", error)
      return false
    }
  }, [previewItem, newTag])

  // Remove tag from current item
  const removeTag = useCallback(async (
    tagToRemove: string,
    onSave: (id: string, updates: { title?: string; tags?: string[] }) => Promise<void>
  ) => {
    if (!previewItem) return false

    try {
      const updatedTags = previewItem.tags.filter((tag: string) => tag !== tagToRemove)
      await onSave(previewItem.id, { tags: updatedTags })
      
      // Update local state
      setPreviewItem((prev: GalleryItem | null) => prev ? { ...prev, tags: updatedTags } : null)
      
      return true
    } catch (error) {
      console.error("Failed to remove tag:", error)
      return false
    }
  }, [previewItem])

  // Update item title
  const updateTitle = useCallback(async (
    newTitle: string,
    onSave: (id: string, updates: { title?: string; tags?: string[] }) => Promise<void>
  ) => {
    if (!previewItem || !newTitle.trim()) return false

    try {
      const trimmedTitle = newTitle.trim()
      await onSave(previewItem.id, { title: trimmedTitle })
      
      // Update local state
      setPreviewItem((prev: GalleryItem | null) => prev ? { ...prev, title: trimmedTitle } : null)
      
      return true
    } catch (error) {
      console.error("Failed to update title:", error)
      return false
    }
  }, [previewItem])

  // Save all changes (title and tags)
  const saveChanges = useCallback(async (
    title: string,
    tags: string[],
    onSave: (id: string, updates: { title?: string; tags?: string[] }) => Promise<void>
  ) => {
    if (!previewItem) return false

    try {
      await onSave(previewItem.id, { title: title.trim(), tags })
      
      // Update local state
      setPreviewItem((prev: GalleryItem | null) => prev ? { 
        ...prev, 
        title: title.trim(), 
        tags: [...tags] 
      } : null)
      
      return true
    } catch (error) {
      console.error("Failed to save changes:", error)
      return false
    }
  }, [previewItem])

  // Navigate to next/previous item in a list
  const navigateToItem = useCallback((items: GalleryItem[], direction: "next" | "prev") => {
    if (!previewItem || items.length === 0) return

    const currentIndex = items.findIndex(item => item.id === previewItem.id)
    if (currentIndex === -1) return

    let nextIndex: number
    if (direction === "next") {
      nextIndex = currentIndex + 1 >= items.length ? 0 : currentIndex + 1
    } else {
      nextIndex = currentIndex - 1 < 0 ? items.length - 1 : currentIndex - 1
    }

    const nextItem = items[nextIndex]
    if (nextItem) {
      setPreviewItem(nextItem)
      setIsAddingTag(false)
      setNewTag("")
    }
  }, [previewItem])

  return {
    // State
    previewItem,
    isAddingTag,
    newTag,
    
    // Modal actions
    openPreview,
    closePreview,
    
    // Tag actions
    startAddingTag,
    cancelAddingTag,
    handleTagInputChange,
    addTag,
    removeTag,
    
    // Edit actions
    updateTitle,
    saveChanges,
    
    // Navigation
    navigateToItem,
    
    // Direct setters for advanced usage
    setPreviewItem,
    setIsAddingTag,
    setNewTag,
  }
}
