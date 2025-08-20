"use client"

import type React from "react"
import { useState, useCallback, useRef, useMemo, useEffect } from "react"
import {
  Search,
  Upload,
  X,
  Edit3,
  Moon,
  Sun,
  Clock,
  Shuffle,
  Edit,
  Settings,
  Play,
  ImageIcon,
  Check,
  Filter,
  List,
  Grid3X3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { TagEditorModal } from "@/components/tag-editor-modal"
import { FilterSidebar, type FilterState } from "@/components/filter-sidebar"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface UploadedFile {
  id: string
  file: File
  url: string
  title: string
  tags: string[]
  type: "image" | "video"
  dateAdded: Date
}

interface GalleryItem {
  id: string
  url: string
  title: string
  tags: string[]
  type: "image" | "video"
  dateAdded: Date
}

const mockImages: GalleryItem[] = [
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

const SkeletalCard = () => (
  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
    <Card className="group hover:shadow-md transition-all duration-300 bg-card border-border overflow-hidden p-0 animate-pulse">
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
    </Card>
  </motion.div>
)

export default function DesignVault() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [mockImagesList, setMockImagesList] = useState<GalleryItem[]>(mockImages)
  const [allImages, setAllImages] = useState<GalleryItem[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ fileName: string; progress: number } | null>(null)
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [galleryViewMode, setGalleryViewMode] = useState<"recent" | "random">("recent")
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    fileTypes: [],
    selectedTags: [],
    sortBy: "title",
    sortOrder: "asc",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOverWindow, setIsDragOverWindow] = useState(false)
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editingTitle, setEditingTitle] = useState("")
  const [newTag, setNewTag] = useState("")
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const [newlyUploadedFiles, setNewlyUploadedFiles] = useState<Set<string>>(new Set())
  const [pendingTags, setPendingTags] = useState<Record<string, string[]>>({})
  const [newFileTimers, setNewFileTimers] = useState<Record<string, number>>({})

  const generateTagsWithAI = async (filename: string, imageUrl: string): Promise<string[]> => {
    try {
      const userApiKey = localStorage.getItem("openai-api-key")
      if (!userApiKey) {
        throw new Error("No API key provided")
      }

      console.log("[v0] Generating tags for:", filename, "URL:", imageUrl)

      const response = await fetch("/api/generate-tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename,
          imageUrl: imageUrl || "", // Ensure we always pass a string
          apiKey: userApiKey,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate tags")
      }

      const data = await response.json()
      console.log("[v0] Generated tags:", data.tags)
      return data.tags || []
    } catch (error) {
      console.error("Failed to generate tags:", error)
      const filename_lower = filename.toLowerCase()
      const fallbackTags: string[] = []
      if (filename_lower.includes("button")) fallbackTags.push("button")
      if (filename_lower.includes("card")) fallbackTags.push("card")
      if (filename_lower.includes("form")) fallbackTags.push("form")
      if (filename_lower.includes("nav")) fallbackTags.push("navigation")
      if (filename_lower.includes("dashboard")) fallbackTags.push("dashboard")
      return fallbackTags
    }
  }

  const uploadFileToStorage = async (file: File, title: string, tags: string[]) => {
    try {
      toast({
        title: "Uploading file...",
        description: `Starting upload of ${file.name}`,
      })

      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `uploads/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("design-vault")
        .upload(filePath, file)

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`)
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("design-vault").getPublicUrl(filePath)

      const fileData = {
        id: globalThis.crypto.randomUUID(),
        title,
        file_path: publicUrl,
        file_type: file.type.startsWith("video/") ? "video" : "image",
        file_size: file.size,
        tags: [], // Start with empty tags, AI tags will be pending
        created_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("uploaded_files").insert(fileData).select().single()

      if (error) {
        throw new Error(`Database insert failed: ${error.message}`)
      }

      setNewlyUploadedFiles((prev) => new Set([...prev, data.id]))
      setPendingTags((prev) => ({ ...prev, [data.id]: tags }))

      setTimeout(() => {
        setNewlyUploadedFiles((prev) => {
          const newSet = new Set(prev)
          newSet.delete(data.id)
          return newSet
        })
      }, 5000)

      toast({
        title: "Upload successful!",
        description: `${file.name} has been uploaded with ${tags.length} AI-generated tags`,
      })

      return { ...data }
    } catch (error) {
      console.error("Upload failed:", error)
      toast({
        title: "Upload failed",
        description: `Failed to upload ${file.name}: ${error.message}`,
        variant: "destructive",
      })
      throw error
    }
  }

  useEffect(() => {
    loadPersistedFiles()
  }, [])

  const loadPersistedFiles = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("uploaded_files")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading files:", error)
        return
      }

      const persistedFiles: UploadedFile[] = data.map((item) => ({
        id: item.id,
        file: null as any, // File object not needed for persisted files
        url: item.file_path,
        title: item.title,
        tags: item.tags || [],
        type: item.file_type as "image" | "video",
        dateAdded: new Date(item.created_at),
      }))

      setUploadedFiles(persistedFiles)
    } catch (error) {
      console.error("Failed to load persisted files:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveFileToDatabase = async (file: UploadedFile, fileUrl: string) => {
    try {
      const { data, error } = await supabase
        .from("uploaded_files")
        .insert({
          id: file.id,
          title: file.title,
          file_path: fileUrl,
          file_type: file.type,
          file_size: file.file?.size || 0,
          tags: file.tags,
        })
        .select()

      if (error) {
        console.error("Error saving file to database:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Failed to save file to database:", error)
      return null
    }
  }

  const handleFileDrop = useCallback(async (files: FileList) => {
    setIsUploading(true)
    setIsDragOverWindow(false)

    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(validateFile)

    const newUploadedFiles: UploadedFile[] = []

    for (const file of validFiles) {
      const isVideo = file.type.startsWith("video/")
      const title = file.name.replace(/\.[^/.]+$/, "")

      try {
        toast({
          title: "📤 Processing file...",
          description: `Preparing ${file.name} for upload`,
        })

        setUploadProgress({ fileName: file.name, progress: 10 })

        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2)}`
        const skeletalFile: UploadedFile = {
          id: tempId,
          file,
          url: URL.createObjectURL(file),
          title,
          tags: [],
          type: isVideo ? "video" : "image",
          dateAdded: new Date(),
        }

        setUploadedFiles((prev) => [skeletalFile, ...prev])

        toast({
          title: "☁️ Uploading to storage...",
          description: `Saving ${file.name} to cloud storage`,
        })

        setUploadProgress({ fileName: file.name, progress: 30 })

        const serverFile = await uploadFileToStorage(file, title, [])

        toast({
          title: "🤖 Generating tags...",
          description: `AI is analyzing ${file.name} for smart tags`,
        })

        setUploadProgress({ fileName: file.name, progress: 70 })

        const tags = await generateTagsWithAI(title, serverFile.file_path)

        setPendingTags((prev) => ({ ...prev, [serverFile.id]: tags }))

        const uploadedFile: UploadedFile = {
          id: serverFile.id,
          file,
          url: serverFile.file_path,
          title: serverFile.title,
          tags: [], // Start with empty tags, AI tags are pending
          type: isVideo ? "video" : "image",
          dateAdded: new Date(serverFile.created_at),
        }

        setUploadedFiles((prev) => {
          const withoutSkeletal = prev.filter((f) => f.id !== tempId)
          return [uploadedFile, ...withoutSkeletal]
        })

        newUploadedFiles.push(uploadedFile)
        setUploadProgress({ fileName: file.name, progress: 100 })

        toast({
          title: "✅ Upload complete!",
          description: `${file.name} uploaded with ${tags.length} AI-generated tags: ${tags.slice(0, 3).join(", ")}${tags.length > 3 ? "..." : ""}`,
        })
      } catch (error) {
        console.error("Failed to upload file:", file.name, error)
        setUploadedFiles((prev) => prev.filter((f) => f.id !== `temp-${Date.now()}`))
        setUploadProgress(null)

        toast({
          title: "❌ Upload failed",
          description: `Failed to upload ${file.name}: ${error.message}`,
          variant: "destructive",
        })
      }
    }

    setIsUploading(false)
    setUploadProgress(null)
  }, [])

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

    window.addEventListener("drop", handleDrop)

    return () => {
      window.removeEventListener("drop", handleDrop)
    }
  }, [handleFileDrop])

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      setIsDragOverWindow(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      setIsDragOverWindow(false)
    }

    window.addEventListener("dragover", handleDragOver)
    window.addEventListener("dragleave", handleDragLeave)

    return () => {
      window.removeEventListener("dragover", handleDragOver)
      window.removeEventListener("dragleave", handleDragLeave)
    }
  }, [])

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      setIsUploading(true)
      const fileArray = Array.from(files)
      const validFiles = fileArray.filter(validateFile)

      const newUploadedFiles: UploadedFile[] = []

      for (const file of validFiles) {
        const isVideo = file.type.startsWith("video/")
        const title = file.name.replace(/\.[^/.]+$/, "")

        try {
          toast({
            title: "Processing file...",
            description: `Preparing ${file.name} for upload`,
          })

          setUploadProgress({ fileName: file.name, progress: 10 })

          const serverFile = await uploadFileToStorage(file, title, [])

          toast({
            title: "🤖 AI analyzing content...",
            description: `Generating smart tags for ${file.name} using GPT-4o`,
          })

          const tags = await generateTagsWithAI(title, serverFile.file_path)

          toast({
            title: "☁️ Uploading to storage...",
            description: `Saving ${file.name} to cloud storage`,
          })

          setUploadProgress({ fileName: file.name, progress: 70 })

          const uploadedFile: UploadedFile = {
            id: serverFile.id,
            file,
            url: serverFile.file_path,
            title: serverFile.title,
            tags: [], // Start with empty tags are pending
            type: isVideo ? "video" : "image",
            dateAdded: new Date(serverFile.created_at),
          }

          newUploadedFiles.push(uploadedFile)
          setUploadProgress({ fileName: file.name, progress: 100 })
        } catch (error) {
          console.error("Failed to upload file:", file.name, error)
          setUploadProgress(null)
        }
      }

      setUploadedFiles((prev) => [
        ...newUploadedFiles.sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime()),
        ...prev,
      ])
      setIsUploading(false)
      setUploadProgress(null)
    },
    [], // Removed generateTagsWithAI from dependencies
  )

  const handleDeleteFile = async (fileId: string) => {
    try {
      // Immediate UI update for instant feedback
      const fileToDelete = uploadedFiles.find((f) => f.id === fileId)
      if (fileToDelete) {
        setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId))

        // Background database deletion
        deleteFileFromServer(fileId).catch((error) => {
          console.error("Background delete failed:", error)
          // Revert UI change if database delete fails
          setUploadedFiles((prev) => [...prev, fileToDelete])
          toast({
            title: "Delete failed",
            description: "Failed to delete file from database",
            variant: "destructive",
          })
        })

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

      // Update local state immediately
      setUploadedFiles((prev) => prev.map((file) => (file.id === fileId ? { ...file, tags: newTags } : file)))
      setPendingTags(newPendingTags)

      // Update database
      await updateFileOnServer(fileId, { tags: newTags })
    } catch (error) {
      console.error("Failed to confirm tag:", error)
      // Revert on error
      loadPersistedFiles()
    }
  }

  const rejectTag = (fileId: string, tag: string) => {
    setPendingTags((prev) => ({
      ...prev,
      [fileId]: prev[fileId]?.filter((t) => t !== tag) || [],
    }))
  }

  const { filteredImages, availableTags, displayImages } = useMemo(() => {
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
        display = [...combined].sort(() => Math.random() - 0.5).slice(0, 20)
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

    if (filters.fileTypes.length > 0) {
      filtered = filtered.filter((image) => filters.fileTypes.includes(image.type))
      display = display.filter((image) => filters.fileTypes.includes(image.type))
    }

    if (filters.selectedTags.length > 0) {
      filtered = filtered.filter((image) =>
        filters.selectedTags.some((selectedTag) => image.tags.includes(selectedTag)),
      )
      display = display.filter((image) => filters.selectedTags.some((selectedTag) => image.tags.includes(selectedTag)))
    }

    const sortFunction = (a: GalleryItem, b: GalleryItem) => {
      // Always prioritize newly uploaded files first, regardless of view mode
      const aIsNewlyUploaded = newlyUploadedFiles.has(a.id)
      const bIsNewlyUploaded = newlyUploadedFiles.has(b.id)

      if (aIsNewlyUploaded && !bIsNewlyUploaded) return -1
      if (!aIsNewlyUploaded && bIsNewlyUploaded) return 1

      if (galleryViewMode === "recent" && !searchQuery) {
        const aIsUploaded = a.id.startsWith("uploaded-") || !a.id.match(/^\d+$/)
        const bIsUploaded = b.id.startsWith("uploaded-") || !a.id.match(/^\d+$/)

        if (aIsUploaded && !bIsUploaded) return -1
        if (!aIsUploaded && bIsUploaded) return 1
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
  }, [uploadedFiles, mockImagesList, searchQuery, filters, galleryViewMode, newlyUploadedFiles, pendingTags])

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

  const handleBatchTag = () => {}

  const handleBatchTagSave = (newTags: string[]) => {}

  const handleBatchDelete = async () => {
    const selectedFileIds = Array.from(selectedFiles)

    // Delete from server for uploaded files
    const deletePromises = selectedFileIds.map(async (fileId) => {
      const isUploadedFile = uploadedFiles.some((file) => file.id === fileId)
      if (isUploadedFile) {
        return await deleteFileFromServer(fileId)
      }
      return true // For mock files, just remove from local state
    })

    const results = await Promise.all(deletePromises)
    const allSuccessful = results.every((result) => result === true)

    if (allSuccessful) {
      setUploadedFiles((prev) => prev.filter((file) => !selectedFiles.has(file.id)))
      setAllImages((prev) => prev.filter((image) => !selectedFiles.has(image.id)))
      setSelectedFiles(new Set())
      setIsSelectionMode(false)
    } else {
      console.error("Some files failed to delete")
    }
  }

  const validateFile = (file: File): boolean => {
    const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
    const validVideoTypes = ["video/mp4", "video/webm", "video/ogg", "video/avi", "video/mov"]
    const maxSize = 50 * 1024 * 1024

    const isValidType = [...validImageTypes, ...validVideoTypes].includes(file.type)
    const isValidSize = file.size <= maxSize

    return isValidType && isValidSize
  }

  const handleEditTags = (item: GalleryItem) => {
    setEditingItem(item)
  }

  const handleSaveEdit = async (id: string, newTitle: string, newTags: string[]) => {
    try {
      await updateFileOnServer(id, { title: newTitle, tags: newTags })

      setUploadedFiles((prev) =>
        prev.map((file) => (file.id === id ? { ...file, title: newTitle, tags: newTags } : file)),
      )
      setAllImages((prev) =>
        prev.map((image) => (image.id === id ? { ...image, title: newTitle, tags: newTags } : image)),
      )
      setEditingItem(null)
    } catch (error) {
      console.error("Failed to save changes:", error)
    }
  }

  const handlePreviewSave = async (id: string, newTitle: string, newTags: string[]) => {
    try {
      await updateFileOnServer(id, { title: newTitle, tags: newTags })

      setUploadedFiles((prev) =>
        prev.map((file) => (file.id === id ? { ...file, title: newTitle, tags: newTags } : file)),
      )
      setAllImages((prev) =>
        prev.map((image) => (image.id === id ? { ...image, title: newTitle, tags: newTags } : image)),
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

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  const handleCardClick = (item: GalleryItem) => {
    setPreviewItem(item)
  }

  const handleTitleEdit = () => {
    if (!previewItem) return
    setEditingTitle(previewItem.title)
    setIsEditingTitle(true)
  }

  const handleTitleSave = async () => {
    if (!previewItem || !editingTitle.trim()) return

    const isUploadedFile = !previewItem.id.match(/^\d+$/)

    if (isUploadedFile) {
      await handleSaveEdit(previewItem.id, editingTitle.trim(), previewItem.tags)
    } else {
      setMockImagesList((prev) =>
        prev.map((item) => (item.id === previewItem.id ? { ...item, title: editingTitle.trim() } : item)),
      )
    }

    setPreviewItem({ ...previewItem, title: editingTitle.trim() })
    setIsEditingTitle(false)
    setEditingTitle("")
  }

  const handleTitleCancel = () => {
    setIsEditingTitle(false)
    setEditingTitle("")
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
    const isUploadedFile = !previewItem.id.match(/^\d+$/)

    if (isUploadedFile) {
      await handlePreviewSave(previewItem.id, previewItem.title, updatedTags)
    } else {
      setMockImagesList((prev) =>
        prev.map((item) => (item.id === previewItem.id ? { ...item, tags: updatedTags } : item)),
      )
    }

    setPreviewItem({ ...previewItem, tags: updatedTags })
    setNewTag("")
    setIsAddingTag(false)
  }

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!previewItem) return

    const updatedTags = previewItem.tags.filter((tag) => tag !== tagToRemove)
    const isUploadedFile = !previewItem.id.match(/^\d+$/)

    // Immediate UI update for instant feedback
    setPreviewItem({ ...previewItem, tags: updatedTags })

    if (isUploadedFile) {
      // Update uploaded files state immediately
      setUploadedFiles((prev) =>
        prev.map((file) => (file.id === previewItem.id ? { ...file, tags: updatedTags } : file)),
      )

      // Background database update
      handlePreviewSave(previewItem.id, previewItem.title, updatedTags).catch((error) => {
        console.error("Background tag update failed:", error)
        // Revert UI changes if database update fails
        setPreviewItem({ ...previewItem, tags: previewItem.tags })
        setUploadedFiles((prev) =>
          prev.map((file) => (file.id === previewItem.id ? { ...file, tags: previewItem.tags } : file)),
        )
        toast({
          title: "Update failed",
          description: "Failed to update tags in database",
          variant: "destructive",
        })
      })
    } else {
      // Update mock images immediately
      setMockImagesList((prev) =>
        prev.map((item) => (item.id === previewItem.id ? { ...item, tags: updatedTags } : item)),
      )
    }

    setNewTag("")
    setIsAddingTag(false)
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
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      processFiles(files)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault()
      setIsDragOverWindow(true)
    }

    const handleWindowDragLeave = (e: DragEvent) => {
      if (!e.relatedTarget) {
        setIsDragOverWindow(false)
      }
    }

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault()
      setIsDragOverWindow(false)

      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        processFiles(files)
      }
    }

    window.addEventListener("dragover", handleWindowDragOver)
    window.addEventListener("dragleave", handleWindowDragLeave)
    window.addEventListener("drop", handleWindowDrop)

    return () => {
      window.removeEventListener("dragover", handleWindowDragOver)
      window.removeEventListener("dragleave", handleWindowDragLeave)
      window.removeEventListener("drop", handleWindowDrop)
    }
  }, [processFiles])

  useEffect(() => {
    const combined = [...uploadedFiles, ...mockImagesList]
    setAllImages(combined)
  }, [mockImagesList, uploadedFiles])

  useEffect(() => {
    const timers: Record<string, number> = {}
    newlyUploadedFiles.forEach((fileId) => {
      timers[fileId] = window.setTimeout(() => {
        setNewFileTimers((prev) => {
          const { [fileId]: _, ...rest } = prev
          return rest
        })
      }, 5000)
    })

    setNewFileTimers(timers)

    return () => {
      Object.values(timers).forEach(clearTimeout)
    }
  }, [newlyUploadedFiles])

  const handleViewModeChange = async (newMode: "recent" | "random") => {
    if (newMode === galleryViewMode) return

    setIsTransitioning(true)

    // Wait for fade out animation to complete
    await new Promise((resolve) => setTimeout(resolve, 600))

    setGalleryViewMode(newMode)

    // Wait for fade in animation to start
    await new Promise((resolve) => setTimeout(resolve, 100))

    setIsTransitioning(false)
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
              <SkeletalCard key={i} />
            ))}
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnimatePresence>
        {isDragOverWindow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-card text-card-foreground rounded-lg border-2 border-dashed border-border p-12 shadow-lg max-w-md mx-4"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Drop files to upload</h3>
                  <p className="text-sm text-muted-foreground">Support for images and videos</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {uploadProgress && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-4 right-4 bg-card border rounded-lg p-4 shadow-lg z-40 min-w-[280px]"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{uploadProgress.fileName}</p>
                <div className="w-full bg-muted rounded-full h-2 mt-1">
                  <motion.div
                    className="bg-primary h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress.progress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{uploadProgress.progress}% complete</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">Design Vault</h1>
              <p className="text-sm text-muted-foreground">UI Inspiration Gallery</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center gap-4 flex-1 max-w-md mx-8"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by tags or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center gap-2"
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="default"
                      className="h-10 bg-transparent"
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle Filters</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex border rounded-md">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="sm"
                        className="rounded-r-none border-r-0 h-10"
                        onClick={() => setViewMode("grid")}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Grid View</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        className="rounded-l-none h-10"
                        onClick={() => setViewMode("list")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>List View</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {selectedFiles.size > 0 && (
                <>
                  <Button variant="outline" size="default" className="h-10 bg-transparent" onClick={selectAllFiles}>
                    Select All
                  </Button>
                  <Button variant="outline" size="default" className="h-10 bg-transparent" onClick={deselectAllFiles}>
                    Clear
                  </Button>
                  <Button variant="destructive" size="default" className="h-10" onClick={handleBatchDelete}>
                    Delete ({selectedFiles.size})
                  </Button>
                </>
              )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="default"
                      className="h-10 bg-transparent"
                      onClick={() => setIsSettingsOpen(true)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Settings</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="default" className="h-10 bg-transparent" onClick={toggleDarkMode}>
                      {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle Theme</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <div className="flex">
        <div className={cn("transition-all duration-300 lg:block", isFilterOpen ? "w-80" : "w-0 overflow-hidden")}>
          <div className="sticky top-20 p-4">
            <FilterSidebar
              isOpen={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
              filters={filters}
              onFiltersChange={setFilters}
              availableTags={availableTags}
              totalItems={allImages.length}
              filteredItems={filteredImages.length}
            />
          </div>
        </div>

        <main className="flex-1 px-4 py-8 bg-background">
          <div className="container mx-auto animate-fade-in">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {!searchQuery && (
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Button
                    variant={galleryViewMode === "recent" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleViewModeChange("recent")}
                    className="flex items-center gap-2"
                    disabled={isTransitioning}
                  >
                    <Clock className="h-4 w-4" />
                    Recent
                  </Button>
                  <Button
                    variant={galleryViewMode === "random" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleViewModeChange("random")}
                    className="flex items-center gap-2"
                    disabled={isTransitioning}
                  >
                    <Shuffle className="h-4 w-4" />
                    Random
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {displayImages.length} designs {galleryViewMode === "random" ? "(showing 20 random)" : ""}
                </p>
              </div>
            )}

            <motion.div
              layout
              className={`grid gap-6 ${
                viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
              }`}
            >
              <AnimatePresence mode="popLayout">
                {displayImages.map((image, index) => (
                  <motion.div
                    key={`${galleryViewMode}-${image.id}`}
                    layout
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{
                      opacity: isTransitioning ? 0 : 1,
                      scale: isTransitioning ? 0.8 : 1,
                      y: isTransitioning ? 20 : 0,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.8,
                      y: -20,
                      transition: { duration: 0.3, delay: index * 0.05 },
                    }}
                    transition={{
                      duration: 0.4,
                      delay: isTransitioning ? 0 : index * 0.08,
                      ease: "easeOut",
                    }}
                  >
                    <Card
                      className={`group hover:shadow-md transition-all duration-300 bg-card border-border cursor-pointer overflow-hidden p-0 my-0 ${
                        viewMode === "list" ? "flex flex-row h-auto" : ""
                      }`}
                      onClick={() => setPreviewItem(image)}
                    >
                      <div className="relative">
                        {image.type === "video" ? (
                          <video
                            src={image.url}
                            className={`w-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                              viewMode === "list" ? "h-auto" : "h-48"
                            }`}
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            onMouseEnter={(e) => {
                              try {
                                e.currentTarget.currentTime = 0
                                e.currentTarget.play()
                              } catch (error) {
                                console.log("Video autoplay failed:", error)
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.pause()
                            }}
                          />
                        ) : (
                          <img
                            src={image.url || "/placeholder.svg"}
                            alt={image.title}
                            className={`w-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                              viewMode === "list" ? "h-auto" : "h-48"
                            }`}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <div className="absolute top-2 left-2 flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-all duration-300 h-6 w-6 p-0 bg-black/80 text-white hover:bg-black/90"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditTags(image)
                            }}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          {!image.id.match(/^\d+$/) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 transition-all duration-300 h-6 w-6 p-0 bg-black/80 text-white hover:bg-black/90"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteFile(image.id)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>

                        <div className="absolute top-2 right-2">
                          <Button variant="secondary" size="sm" className="h-6 w-6 p-0">
                            {image.type === "video" ? <Play className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>

                      <div className="p-3 pt-2">
                        <div className="flex items-start gap-2 mb-2">
                          <h3 className="font-medium text-sm truncate flex-1">{image.title}</h3>
                          {newlyUploadedFiles.has(image.id) && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                              style={{ backgroundColor: "#ECF1FF", color: "#1A57DA" }}
                            >
                              <span>new</span>
                              <motion.svg width="12" height="12" viewBox="0 0 24 24" className="text-current">
                                <motion.circle
                                  cx="12"
                                  cy="12"
                                  r="8"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeDasharray="50.27"
                                  strokeDashoffset="0"
                                  animate={{
                                    strokeDashoffset: [0, 50.27],
                                  }}
                                  transition={{
                                    duration: 5,
                                    ease: "linear",
                                  }}
                                />
                              </motion.svg>
                            </motion.div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {image.tags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {pendingTags[image.id]?.map((tag, tagIndex) => (
                            <Badge
                              key={`pending-${tagIndex}`}
                              variant="outline"
                              className="text-xs flex items-center gap-1 border-dashed"
                            >
                              {tag}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  confirmTag(image.id, tag)
                                }}
                                className="ml-1 hover:bg-green-100 rounded-full p-0.5"
                              >
                                <Check className="h-2 w-2 text-green-600" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  rejectTag(image.id, tag)
                                }}
                                className="hover:bg-red-100 rounded-full p-0.5"
                              >
                                <X className="h-2 w-2 text-red-600" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {displayImages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center py-12"
              >
                <div className="text-muted-foreground mb-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 opacity-50" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No images found</h3>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              </motion.div>
            )}
          </div>
        </main>
      </div>

      <TagEditorModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveEdit}
        initialTitle={editingItem?.title || ""}
        initialTags={editingItem?.tags || []}
      />

      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-6xl max-h-[95vh] p-0">
          <DialogHeader className="p-6 pb-0 flex flex-row items-center justify-between space-y-0 pt-4 pl-4 pr-4">
            <div className="flex items-center flex-1 gap-0">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTitleSave()
                      if (e.key === "Escape") handleTitleCancel()
                    }}
                    autoFocus
                  />
                  <Button size="sm" onClick={handleTitleSave}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleTitleCancel}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <DialogTitle className="text-left">{previewItem?.title}</DialogTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer hover:cursor-pointer ml-2"
                    onClick={handleTitleEdit}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer hover:cursor-pointer"
              onClick={() => setPreviewItem(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="p-6 pt-0 pl-4 pr-4 pb-4">
            {previewItem && (
              <div className="relative">
                {previewItem.type === "video" ? (
                  <video
                    src={previewItem.url}
                    className="w-full max-h-[90vh] object-contain rounded-lg"
                    controls
                    autoPlay
                    muted
                    loop
                  />
                ) : (
                  <img
                    src={previewItem.url || "/placeholder.svg"}
                    alt={previewItem.title}
                    className="w-full max-h-[90vh] object-contain rounded-lg"
                  />
                )}
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-2 items-center">
                    {previewItem.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-sm flex items-center gap-1 pr-1 h-6">
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:bg-muted-foreground/20 rounded-sm p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {!isAddingTag && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 bg-transparent"
                        onClick={() => setIsAddingTag(true)}
                      >
                        Add tag
                      </Button>
                    )}
                  </div>

                  {isAddingTag && (
                    <div className="flex items-center gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Enter tag name..."
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddTag()
                          if (e.key === "Escape") {
                            setIsAddingTag(false)
                            setNewTag("")
                          }
                        }}
                        autoFocus
                      />
                      <Button size="sm" onClick={handleAddTag}>
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsAddingTag(false)
                          setNewTag("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="api-key" className="text-sm font-medium text-foreground">
                OpenAI API Key
              </label>
              <Input
                id="api-key"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Required for AI-powered tag generation. Your key is stored locally and never sent to our servers.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  localStorage.setItem("openai-api-key", apiKey)
                  setIsSettingsOpen(false)
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
