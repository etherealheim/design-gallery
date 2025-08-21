"use client"

import type React from "react"
import { useCallback } from "react"
import { useState, useRef, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { FilterSidebar } from "@/components/filter-sidebar"
import { GalleryHeader } from "@/components/gallery-header"
import { supabase } from "@/lib/supabase/client"
import { GalleryGrid } from "@/components/gallery-grid"
import { PreviewModal } from "@/components/preview-modal"
import type { GalleryItem, UploadedFile } from "@/types/gallery"
import type { FilterState } from "@/types"
import { useUploadHandler } from "@/hooks/use-upload-handler"

const mockImagesList: GalleryItem[] = [
  {
    id: "1",
    url: "/modern-button-design.png",
    title: "Modern Button Collection",
    tags: ["button", "modern", "blue", "interactive"],
    type: "image",
    dateAdded: new Date("2024-01-15"),
  },
  {
    id: "2",
    url: "/creative-navigation-menu.png",
    title: "Creative Navigation",
    tags: ["navigation", "creative", "menu", "ux"],
    type: "image",
    dateAdded: new Date("2024-01-10"),
  },
  {
    id: "3",
    url: "/placeholder-596db.png",
    title: "Card Design Inspiration",
    tags: ["card", "layout", "clean", "minimal"],
    type: "image",
    dateAdded: new Date("2024-01-20"),
  },
  {
    id: "4",
    url: "/form-design-patterns.png",
    title: "Form Design Patterns",
    tags: ["form", "input", "validation", "ux"],
    type: "image",
    dateAdded: new Date("2024-01-05"),
  },
]

export default function DesignVault() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<FilterState>({
    fileTypes: [],
    selectedTags: [],
    sortBy: "date",
    sortOrder: "desc",
  })
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null)
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [newTag, setNewTag] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [galleryViewMode, setGalleryViewMode] = useState<"recent" | "random">("recent")
  const [randomSeed, setRandomSeed] = useState(0)
  const [newlyUploadedFiles, setNewlyUploadedFiles] = useState<Set<string>>(new Set())
  const [pendingTags, setPendingTags] = useState<Record<string, string[]>>({})
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ fileName: string; progress: number } | null>(null)
  const [isDragOverWindow, setIsDragOverWindow] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const { handleFileDrop } = useUploadHandler({
    isUploading,
    setIsUploading,
    setUploadProgress,
    setNewlyUploadedFiles,
    setPendingTags,
    setUploadedFiles,
    setUploadingFiles,
  })

  const loadPersistedFiles = async () => {
    try {
      const { data, error } = await supabase
        .from("uploaded_files")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading files:", error)
        return
      }

      const persistedFiles: UploadedFile[] = data.map((file) => ({
        id: file.id,
        file: null,
        url: file.file_path,
        title: file.title,
        tags: file.tags || [],
        type: file.file_type === "video" ? "video" : "image",
        dateAdded: new Date(file.created_at),
      }))

      setUploadedFiles(persistedFiles)
    } catch (error) {
      console.error("Failed to load persisted files:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFileDrop(files)
      }
    },
    [handleFileDrop],
  )

  useEffect(() => {
    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      setIsDragOverWindow(false)

      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        handleFileDrop(files)
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      setIsDragOverWindow(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      if (!e.relatedTarget) {
        setIsDragOverWindow(false)
      }
    }

    window.addEventListener("dragover", handleDragOver)
    window.addEventListener("dragleave", handleDragLeave)
    window.addEventListener("drop", handleDrop)

    return () => {
      window.removeEventListener("dragover", handleDragOver)
      window.removeEventListener("dragleave", handleDragLeave)
      window.removeEventListener("drop", handleDrop)
    }
  }, [handleFileDrop])

  const handleDeleteFile = async (fileId: string) => {
    try {
      const fileToDelete = uploadedFiles.find((f) => f.id === fileId)
      if (fileToDelete) {
        setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId))

        await deleteFileFromServer(fileId)

        toast({
          title: "File deleted",
          description: "File removed successfully",
        })
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Delete failed",
        description: "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  const confirmTag = async (fileId: string, tag: string) => {
    try {
      const currentFile = uploadedFiles.find((f) => f.id === fileId)
      if (!currentFile) return

      const newTags = [...currentFile.tags, tag]
      const newPendingTags = { ...pendingTags }
      newPendingTags[fileId] = newPendingTags[fileId]?.filter((t) => t !== tag) || []

      setUploadedFiles((prev) => prev.map((file) => (file.id === fileId ? { ...file, tags: newTags } : file)))
      setPendingTags(newPendingTags)

      await updateFileOnServer(fileId, { tags: newTags })
    } catch (error) {
      console.error("Failed to confirm tag:", error)
      loadPersistedFiles()
    }
  }

  const rejectTag = (fileId: string, tag: string) => {
    setPendingTags((prev) => ({
      ...prev,
      [fileId]: prev[fileId]?.filter((t) => t !== tag) || [],
    }))
  }

  const sortedAndFilteredImages = useMemo(() => {
    const combined = [...uploadedFiles, ...mockImagesList]
    let filtered = [...combined]
    let display = [...combined]

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (image) =>
          image.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          image.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
      display = filtered
    } else {
      if (galleryViewMode === "random") {
        const shuffled = [...combined]
        const seededRandom = (seed: number) => {
          const x = Math.sin(seed) * 10000
          return x - Math.floor(x)
        }

        for (let i = shuffled.length - 1; i > 0; i--) {
          const randomIndex = Math.floor(seededRandom(randomSeed + i) * (i + 1))
          ;[shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]]
        }
        display = shuffled.slice(0, 20)
      } else {
        display = [...combined].sort((a, b) => {
          const aIsUploaded = a.id.startsWith("uploaded-") || !a.id.match(/^\d+$/)
          const bIsUploaded = b.id.startsWith("uploaded-") || !b.id.match(/^\d+$/)

          if (aIsUploaded && !bIsUploaded) return -1
          if (!aIsUploaded && bIsUploaded) return 1

          return b.dateAdded.getTime() - a.dateAdded.getTime()
        })
      }
    }

    if (filters.selectedTags.includes("__no_tags__")) {
      const noTagsFilter = combined.filter((item) => item.tags.length === 0)
      const otherTagsFilter = filters.selectedTags.filter((tag) => tag !== "__no_tags__")

      if (otherTagsFilter.length > 0) {
        const taggedItems = combined.filter((item) =>
          otherTagsFilter.some((selectedTag) => item.tags.includes(selectedTag)),
        )
        filtered = [...noTagsFilter, ...taggedItems]
        display = [...noTagsFilter, ...taggedItems]
      } else {
        filtered = noTagsFilter
        display = noTagsFilter
      }
    } else if (filters.selectedTags.length > 0) {
      filtered = filtered.filter((image) =>
        filters.selectedTags.some((selectedTag) => image.tags.includes(selectedTag)),
      )
      display = display.filter((image) => filters.selectedTags.some((selectedTag) => image.tags.includes(selectedTag)))
    }

    if (filters.fileTypes.length > 0) {
      filtered = filtered.filter((image) => filters.fileTypes.includes(image.type))
      display = display.filter((image) => filters.fileTypes.includes(image.type))
    }

    const sortFunction = (a: GalleryItem, b: GalleryItem) => {
      const aIsNewlyUploaded = newlyUploadedFiles.has(a.id)
      const bIsNewlyUploaded = newlyUploadedFiles.has(b.id)

      if (aIsNewlyUploaded && !bIsNewlyUploaded) return -1
      if (!aIsNewlyUploaded && bIsNewlyUploaded) return 1

      if (aIsNewlyUploaded && bIsNewlyUploaded) {
        return b.dateAdded.getTime() - a.dateAdded.getTime()
      }

      if (galleryViewMode === "recent" && !searchQuery) {
        const aIsUploaded = a.id.startsWith("uploaded-") || !a.id.match(/^\d+$/)
        const bIsUploaded = b.id.startsWith("uploaded-") || !b.id.match(/^\d+$/)

        if (aIsUploaded && !bIsUploaded) return -1
        if (!aIsUploaded && bIsUploaded) return 1

        if (aIsUploaded && bIsUploaded) {
          return b.dateAdded.getTime() - a.dateAdded.getTime()
        }
      }

      let comparison = 0

      switch (filters.sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title)
          break
        case "date":
          comparison = a.dateAdded.getTime() - b.dateAdded.getTime()
          break
        case "tags":
          comparison = a.tags.length - b.tags.length
          break
      }

      return filters.sortOrder === "desc" ? -comparison : comparison
    }

    filtered.sort(sortFunction)
    display.sort(sortFunction)

    const tagSet = new Set<string>()
    combined.forEach((image) => {
      image.tags.forEach((tag) => tagSet.add(tag))
    })
    const availableTags = Array.from(tagSet).sort()

    return { filteredImages: filtered, availableTags, displayImages: display }
  }, [
    uploadedFiles,
    mockImagesList,
    searchQuery,
    filters,
    galleryViewMode,
    newlyUploadedFiles,
    pendingTags,
    randomSeed,
  ])

  const selectedUploadedFiles = useMemo(() => {
    return uploadedFiles.filter((file) => selectedFiles.has(file.id))
  }, [uploadedFiles, selectedFiles])

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(fileId)) {
        newSet.delete(fileId)
      } else {
        newSet.add(fileId)
      }
      return newSet
    })
  }

  const selectAllFiles = () => {
    setSelectedFiles(new Set(uploadedFiles.map((f) => f.id)))
  }

  const deselectAllFiles = () => {
    setSelectedFiles(new Set())
  }

  const handleBatchDelete = async () => {
    const selectedFileIds = Array.from(selectedFiles)

    const deletePromises = selectedFileIds.map(async (fileId) => {
      const isUploadedFile = uploadedFiles.some((file) => file.id === fileId)
      if (isUploadedFile) {
        return await deleteFileFromServer(fileId)
      }
      return true
    })

    const results = await Promise.all(deletePromises)
    const allSuccessful = results.every((result) => result === true)

    if (allSuccessful) {
      setUploadedFiles((prev) => prev.filter((file) => !selectedFiles.has(file.id)))
      setSelectedFiles(new Set())
    } else {
      console.error("Some files failed to delete")
    }
  }

  const handleEditTags = (item: GalleryItem) => {
    setPreviewItem(item)
  }

  const handleRename = (item: GalleryItem) => {
    setPreviewItem(item)
  }

  const handlePreviewSave = async (id: string, newTitle: string, newTags: string[]) => {
    try {
      await updateFileOnServer(id, { title: newTitle, tags: newTags })

      setUploadedFiles((prev) =>
        prev.map((file) => (file.id === id ? { ...file, title: newTitle, tags: newTags } : file)),
      )
      setPreviewItem((prev) => (prev ? { ...prev, title: newTitle, tags: newTags } : null))
    } catch (error) {
      console.error("Failed to save changes:", error)
    }
  }

  const handleTagClick = (tag: string) => {
    if (filters.selectedTags.includes(tag)) {
      setFilters((prev) => ({
        ...prev,
        selectedTags: prev.selectedTags.filter((t) => t !== tag),
      }))
    } else {
      setFilters((prev) => ({
        ...prev,
        selectedTags: [...prev.selectedTags, tag],
      }))
    }
  }

  const handleCardClick = (item: GalleryItem) => {
    setPreviewItem(item)
  }

  const handleAddTag = async () => {
    if (!previewItem || !newTag.trim()) return

    const trimmedTag = newTag.trim().toLowerCase()
    if (previewItem.tags.includes(trimmedTag)) {
      setNewTag("")
      setIsAddingTag(false)
      return
    }

    const updatedTags = [...previewItem.tags, trimmedTag]

    await handlePreviewSave(previewItem.id, previewItem.title, updatedTags)

    setPreviewItem({ ...previewItem, tags: updatedTags })
    setNewTag("")
    setIsAddingTag(false)
  }

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!previewItem) return

    const updatedTags = previewItem.tags.filter((tag) => tag !== tagToRemove)

    setPreviewItem({ ...previewItem, tags: updatedTags })

    await handlePreviewSave(previewItem.id, previewItem.title, updatedTags)
  }

  const updateFileOnServer = async (fileId: string, updates: { title?: string; tags?: string[] }) => {
    try {
      const response = await fetch(`/api/update-file/${fileId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Update failed")
      }

      const data = await response.json()
      return data.file
    } catch (error) {
      console.error("Failed to update file:", error)
      throw error
    }
  }

  const deleteFileFromServer = async (fileId: string) => {
    try {
      const response = await fetch(`/api/delete-file/${fileId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Delete failed")
      }

      return true
    } catch (error) {
      console.error("Failed to delete file:", error)
      return false
    }
  }

  useEffect(() => {
    loadPersistedFiles()
  }, [])

  const handleViewModeChange = (newMode: "recent" | "random") => {
    setGalleryViewMode(newMode)
    if (newMode === "random") {
      setRandomSeed(Date.now())
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            className="flex items-center justify-between mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-48 mb-2"></div>
              <div className="h-4 bg-muted rounded w-32"></div>
            </div>
            <div className="flex gap-2">
              <div className="w-10 h-10 bg-muted rounded animate-pulse"></div>
              <div className="w-10 h-10 bg-muted rounded animate-pulse"></div>
            </div>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="group hover:shadow-md transition-all duration-300 bg-card border-border overflow-hidden p-0 animate-pulse"
              >
                <div className="relative">
                  <div className="w-full h-48 bg-muted"></div>
                  <div className="absolute top-2 left-2 flex gap-1">
                    <div className="w-8 h-8 bg-muted-foreground/20 rounded"></div>
                    <div className="w-8 h-8 bg-muted-foreground/20 rounded"></div>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-muted rounded w-16"></div>
                    <div className="h-6 bg-muted rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen bg-background text-foreground transition-colors duration-300")}>
      <GalleryHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        selectedFiles={selectedFiles}
        selectAllFiles={selectAllFiles}
        deselectAllFiles={deselectAllFiles}
        handleBatchDelete={handleBatchDelete}
      />

      <div className="flex">
        <div
          className={cn(
            "fixed left-0 top-0 h-full bg-background border-r border-border z-40 transition-transform duration-300 lg:relative lg:z-auto",
            isFilterOpen ? "translate-x-0 w-80" : "-translate-x-full w-0 lg:w-0",
          )}
        >
          <div className="sticky top-20 p-4 h-full overflow-y-auto">
            <FilterSidebar
              isOpen={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
              filters={filters}
              onFiltersChange={setFilters}
              availableTags={sortedAndFilteredImages.availableTags}
              totalItems={sortedAndFilteredImages.displayImages.length}
              filteredItems={sortedAndFilteredImages.filteredImages.length}
            />
          </div>
        </div>

        {isFilterOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsFilterOpen(false)} />
        )}

        <main className="flex-1 bg-background">
          <div className="container mx-auto px-4 py-8 animate-fade-in">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <GalleryGrid
              searchQuery={searchQuery}
              galleryViewMode={galleryViewMode}
              handleViewModeChange={handleViewModeChange}
              sortedAndFilteredImages={sortedAndFilteredImages}
              viewMode={viewMode}
              newlyUploadedFiles={newlyUploadedFiles}
              pendingTags={pendingTags}
              uploadingFiles={uploadingFiles}
              setPreviewItem={setPreviewItem}
              handleEditTags={handleEditTags}
              handleDeleteFile={handleDeleteFile}
              confirmTag={confirmTag}
              rejectTag={rejectTag}
              handleRename={handleRename}
            />

            {isDragOverWindow && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              >
                <div className="p-8 border-2 border-dashed border-primary/50 bg-background/90 backdrop-blur-sm rounded-lg">
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 mx-auto text-primary">📁</div>
                    <div className="text-xl font-medium">Drop files here</div>
                    <div className="text-sm text-muted-foreground">Upload images and videos to your gallery</div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </main>
      </div>

      <PreviewModal
        previewItem={previewItem}
        setPreviewItem={setPreviewItem}
        isAddingTag={isAddingTag}
        setIsAddingTag={setIsAddingTag}
        newTag={newTag}
        setNewTag={setNewTag}
        handleAddTag={handleAddTag}
        handleRemoveTag={handleRemoveTag}
      />
    </div>
  )
}
