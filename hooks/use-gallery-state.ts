"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import type { GalleryItem, UploadedFile, FilterState, ViewState, PendingTags } from "@/types"
import { DataService } from "@/lib/services/data-service"
import { FileFilterService, FileOperationsService } from "@/lib/services/file-service"
import { createUserFriendlyMessage } from "@/lib/errors"
import { toast } from "sonner"

interface UseGalleryStateProps {
  initialViewMode?: ViewState["mode"]
  initialGalleryMode?: ViewState["galleryMode"] 
}

export function useGalleryState({ 
  initialViewMode = "grid",
  initialGalleryMode = "recent" 
}: UseGalleryStateProps = {}) {
  // Core data state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [hasAllFilesLoaded, setHasAllFilesLoaded] = useState(false)
  const [isLoadingSearch, setIsLoadingSearch] = useState(false)
  const [allTags, setAllTags] = useState<string[]>([])
  const [noTagCount, setNoTagCount] = useState(0)
  
  // Filter and view state
  const [filters, setFilters] = useState<FilterState>({
    fileTypes: [],
    selectedTags: [],
    sortBy: "date",
    sortOrder: "desc",
  })
  
  const [viewState, setViewState] = useState<ViewState>({
    mode: initialViewMode,
    galleryMode: initialGalleryMode,
    isFilterOpen: false,
    selectedFiles: new Set<string>(),
  })
  
  // Upload state
  const [newlyUploadedFiles, setNewlyUploadedFiles] = useState<Set<string>>(new Set())
  const [pendingTags, setPendingTags] = useState<PendingTags>({})
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([])
  
  // Random view state
  const [randomSeed, setRandomSeed] = useState(0)
  
  // Track loading state to prevent infinite loops
  const isLoadingAllFilesRef = useRef(false)
  const lastLoadingStateRef = useRef<{
    needsAllFiles: boolean
    hasAllFilesLoaded: boolean
  }>({ needsAllFiles: false, hasAllFilesLoaded: false })



  // Load initial data with pagination
  const loadFiles = useCallback(async () => {
    try {
      setIsLoading(true)
      setCurrentPage(1)
      setHasAllFilesLoaded(false)
      isLoadingAllFilesRef.current = false // Reset loading ref
      const result = await DataService.loadFilesWithPagination(1, 20) // No filters - we filter client-side
      const uploadedFilesList = result.items.map(file => ({ ...file, file: undefined })) as UploadedFile[]
      setUploadedFiles(uploadedFilesList)
      setHasMore(result.hasMore)
      setTotalCount(result.totalCount)
    } catch (error) {
      console.error("Failed to load files:", error)
      toast({
        title: "Error loading files",
        description: createUserFriendlyMessage(error),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, []) // Removed filters dependency - we use client-side filtering now

  // Load all tags from database
  const loadAllTags = useCallback(async () => {
    try {
      const tags = await DataService.getAllTags()
      setAllTags(tags)
    } catch (error) {
      console.error("Failed to load all tags:", error)
    }
  }, [])

  // Load no-tag count from database
  const loadNoTagCount = useCallback(async () => {
    try {
      const count = await DataService.getNoTagCount()
      setNoTagCount(count)
    } catch (error) {
      console.error("Failed to load no-tag count:", error)
    }
  }, [])

  // Load more files for infinite scrolling
  const loadMoreFiles = useCallback(async () => {
    if (!hasMore || isLoadingMore) {
      console.log("Skipping loadMoreFiles:", { hasMore, isLoadingMore })
      return
    }

    try {
      setIsLoadingMore(true)
      const nextPage = currentPage + 1
      console.log("Loading page:", nextPage)
      const result = await DataService.loadFilesWithPagination(nextPage, 20) // No filters - we filter client-side
      const newFiles = result.items.map(file => ({ ...file, file: undefined })) as UploadedFile[]
      
      console.log("Loaded files:", { 
        newFilesCount: newFiles.length, 
        totalCount: result.totalCount, 
        hasMore: result.hasMore 
      })
      
      setUploadedFiles(prev => [...prev, ...newFiles])
      setCurrentPage(nextPage)
      setHasMore(result.hasMore)
      setTotalCount(result.totalCount)
    } catch (error) {
      console.error("Failed to load more files:", error)
      // Only show toast for actual errors, not for "no more files" scenarios
      if (error instanceof Error && !error.message.includes("no more")) {
        toast.error("Failed to load more files", {
          description: createUserFriendlyMessage(error),
        })
      }
    } finally {
      setIsLoadingMore(false)
    }
  }, [currentPage, hasMore, isLoadingMore]) // Removed filters - using client-side filtering

  // Load all files for search (only when needed)
  const loadAllFilesForSearch = useCallback(async () => {
    if (isLoadingAllFilesRef.current) {
      console.log("Already loading all files, skipping...")
      return
    }
    
    try {
      isLoadingAllFilesRef.current = true
      setIsLoadingSearch(true)
      const files = await DataService.loadAllFiles()
      const uploadedFilesList = files.map(file => ({ ...file, file: undefined })) as UploadedFile[]
      setUploadedFiles(uploadedFilesList)
      setTotalCount(files.length)
      setHasMore(false) // No pagination for search
      setHasAllFilesLoaded(true)
    } catch (error) {
      console.error("Failed to load files for search:", error)
      toast.error("Search failed", {
        description: createUserFriendlyMessage(error),
      })
    } finally {
      setIsLoadingSearch(false)
      isLoadingAllFilesRef.current = false
    }
  }, [])

  // File operations
  const updateFile = useCallback(async (fileId: string, updates: { title?: string; tags?: string[] }) => {
    try {
      const updatedFile = await FileOperationsService.updateFile(fileId, updates)
      
      setUploadedFiles(prev => 
        prev.map(file => 
          file.id === fileId 
            ? { ...file, title: updatedFile.title, tags: updatedFile.tags }
            : file
        )
      )
      
      // If tags were updated, reload the no-tag count
      if (updates.tags !== undefined) {
        loadNoTagCount()
      }
      
      return updatedFile
    } catch (error) {
      console.error("Failed to update file:", error)
      toast.error("Update failed", {
        description: createUserFriendlyMessage(error),
      })
      throw error
    }
  }, [loadNoTagCount])

  const deleteFile = useCallback(async (fileId: string) => {
    // Find the file to delete
    const fileToDelete = uploadedFiles.find(file => file.id === fileId)
    if (!fileToDelete) {
      toast.error("Delete failed", {
        description: "File not found",
      })
      return
    }

    // Optimistically remove from UI immediately
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
    setViewState(prev => ({
      ...prev,
      selectedFiles: new Set([...prev.selectedFiles].filter(id => id !== fileId))
    }))
    // Update total count immediately
    setTotalCount(prev => Math.max(0, prev - 1))
    
    let apiCallMade = false
    let toastDismissed = false

    // Undo function to restore the file
    const undoDelete = () => {
      if (toastDismissed) return
      
      // Restore the file in UI
      setUploadedFiles(prev => {
        const newFiles = [...prev, fileToDelete]
        return newFiles.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
      })
      // Restore total count
      setTotalCount(prev => prev + 1)
      
      // Dismiss the delete toast
      toast.dismiss(toastId)
      toastDismissed = true
      
      // Show undo confirmation
      toast.success("File restored", {
        description: `${fileToDelete.title} has been restored`,
      })
    }

    // Show success toast with undo button
    const toastId = toast(`${fileToDelete.title} deleted`, {
      description: "File removed successfully",
      duration: 5000, // 5 seconds
      action: {
        label: "Undo",
        onClick: undoDelete,
      },
      classNames: {
        actionButton: "toast-undo-button"
      }
    })

    // Start API call after a short delay (to allow for undo)
    setTimeout(async () => {
      if (toastDismissed) return // User clicked undo, don't delete
      
      try {
        apiCallMade = true
        await FileOperationsService.deleteFile(fileId)
      } catch (error) {
        console.error("Failed to delete file:", error)
        
        // Only restore if toast hasn't been dismissed (user didn't undo)
        if (!toastDismissed) {
          // Restore the file if API call failed
          setUploadedFiles(prev => {
            const newFiles = [...prev, fileToDelete]
            return newFiles.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
          })
          // Restore total count
          setTotalCount(prev => prev + 1)
          
          // Dismiss the success toast and show error
          toast.dismiss(toastId)
          toast.error(`Failed to delete ${fileToDelete.title}`, {
            description: createUserFriendlyMessage(error),
          })
        }
      }
    }, 100) // Small delay to ensure toast is shown first

  }, [uploadedFiles])

  const batchDelete = useCallback(async () => {
    const selectedFileIds = Array.from(viewState.selectedFiles)
    
    if (selectedFileIds.length === 0) return
    
    // Find files to delete
    const filesToDelete = uploadedFiles.filter(file => selectedFileIds.includes(file.id))
    
    // Optimistically remove from UI immediately
    setUploadedFiles(prev => prev.filter(file => !selectedFileIds.includes(file.id)))
    setViewState(prev => ({ ...prev, selectedFiles: new Set() }))
    // Update total count immediately
    setTotalCount(prev => Math.max(0, prev - selectedFileIds.length))
    
    // Show success toast immediately
    const toastId = toast.success("Files deleted", {
      description: `${selectedFileIds.length} file${selectedFileIds.length !== 1 ? 's' : ''} removed successfully`,
    })

    try {
      // Delete files in background
      const promises = selectedFileIds.map(fileId => FileOperationsService.deleteFile(fileId))
      await Promise.all(promises)
    } catch (error) {
      console.error("Batch delete failed:", error)
      
      // Restore all files if batch operation fails
      setUploadedFiles(prev => {
        const newFiles = [...prev, ...filesToDelete]
        return newFiles.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
      })
      // Restore total count
      setTotalCount(prev => prev + selectedFileIds.length)
      
      toast.dismiss(toastId)
      toast.error("Batch delete failed", {
        description: createUserFriendlyMessage(error),
      })
    }
  }, [viewState.selectedFiles, uploadedFiles])

  // Tag operations
  const confirmTag = useCallback(async (fileId: string, tag: string) => {
    const currentFile = uploadedFiles.find(f => f.id === fileId)
    if (!currentFile) return

    // Optimistically update UI immediately
    setUploadedFiles(prev => 
      prev.map(file => 
        file.id === fileId 
          ? { ...file, tags: [...file.tags, tag] }
          : file
      )
    )
    
    // Remove from pending tags immediately
    setPendingTags(prev => ({
      ...prev,
      [fileId]: prev[fileId]?.filter(t => t !== tag) || []
    }))

    try {
      // Update in background
      await updateFile(fileId, { tags: [...currentFile.tags, tag] })
      // Reload no-tag count since tags were modified
      loadNoTagCount()
    } catch (error) {
      console.error("Failed to confirm tag:", error)
      // Revert optimistic update
      setUploadedFiles(prev => 
        prev.map(file => 
          file.id === fileId 
            ? { ...file, tags: currentFile.tags }
            : file
        )
      )
      // Add tag back to pending
      setPendingTags(prev => ({
        ...prev,
        [fileId]: [...(prev[fileId] || []), tag]
      }))
      toast.error("Failed to add tag", {
        description: createUserFriendlyMessage(error),
      })
    }
  }, [uploadedFiles, updateFile])

  const rejectTag = useCallback((fileId: string, tag: string) => {
    // Remove from pending tags immediately - no API call needed
    setPendingTags(prev => ({
      ...prev,
      [fileId]: prev[fileId]?.filter(t => t !== tag) || []
    }))
    
    toast.info("Tag rejected", {
      description: `"${tag}" removed from suggestions`,
    })
  }, [])

  // Computed values
  const combinedItems = useMemo(() => [...uploadedFiles], [uploadedFiles])

  const processedItems = useMemo(() => {
    let items = [...combinedItems]
    
    // Always apply client-side filtering to get accurate filtered results
    const filteredItems = FileFilterService.filterItems(items, searchQuery, filters)
    const availableTags = allTags // Use all tags from database instead of just visible items
    
    // Apply sorting
    const sortedItems = FileFilterService.sortItems(filteredItems, filters.sortBy, filters.sortOrder)
    
    // Handle view mode specific logic
    let displayItems = sortedItems
    
    if (viewState.galleryMode === "random") {
      // Apply seeded shuffle for consistent random view
      const shuffled = [...sortedItems]
      const seededRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000
        return x - Math.floor(x)
      }

      for (let i = shuffled.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(seededRandom(randomSeed + i) * (i + 1))
        ;[shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]]
      }
      displayItems = shuffled
    } else if (viewState.galleryMode === "no-tag") {
      // Filter items without tags from the already filtered items
      displayItems = sortedItems.filter(item => item.tags.length === 0)
    } else {
      // Prioritize newly uploaded files
      displayItems = FileFilterService.prioritizeNewlyUploaded(sortedItems, newlyUploadedFiles)
    }
    
    return {
      displayItems,
      filteredItems,
      availableTags,
      totalItems: searchQuery ? filteredItems.length : totalCount, // Use filtered count for search, total count for pagination
    }
  }, [combinedItems, searchQuery, filters, viewState.galleryMode, randomSeed, newlyUploadedFiles, totalCount, allTags])

  // View state actions
  const updateViewState = useCallback((updates: Partial<ViewState>) => {
    setViewState(prev => ({ ...prev, ...updates }))
  }, [])

  const handleViewModeChange = useCallback((newMode: ViewState["galleryMode"]) => {
    setViewState(prev => ({ ...prev, galleryMode: newMode }))
    if (newMode === "random") {
      setRandomSeed(Date.now())
    }
  }, [])

  const selectAllFiles = useCallback(() => {
    const allFileIds = new Set(uploadedFiles.map(f => f.id))
    setViewState(prev => ({ ...prev, selectedFiles: allFileIds }))
  }, [uploadedFiles])

  const deselectAllFiles = useCallback(() => {
    setViewState(prev => ({ ...prev, selectedFiles: new Set() }))
  }, [])

  const toggleFileSelection = useCallback((fileId: string) => {
    setViewState(prev => {
      const newSelectedFiles = new Set(prev.selectedFiles)
      if (newSelectedFiles.has(fileId)) {
        newSelectedFiles.delete(fileId)
      } else {
        newSelectedFiles.add(fileId)
      }
      return { ...prev, selectedFiles: newSelectedFiles }
    })
  }, [])

  const handleTagClick = useCallback((tag: string) => {
    setFilters(prev => {
      const newSelectedTags = prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag]
      
      return { ...prev, selectedTags: newSelectedTags }
    })
  }, [])

  // Enhanced upload handler that updates total count
  const handleFileUpload = useCallback((file: UploadedFile) => {
    setUploadedFiles(prev => [file, ...prev])
    // Update total count immediately for real-time badge updates
    setTotalCount(prev => prev + 1)
  }, [])

  // Add tag to file
  const addTagToFile = useCallback(async (fileId: string, tag: string) => {
    let currentTags: string[] = []
    let fileExists = false
    
    // Optimistically update UI and capture current tags for API call
    setUploadedFiles(prev => {
      const currentFile = prev.find(f => f.id === fileId)
      if (!currentFile || currentFile.tags.includes(tag)) {
        return prev
      }
      
      fileExists = true
      currentTags = [...currentFile.tags, tag]
      
      // Return updated state with new tag
      return prev.map(file => 
        file.id === fileId 
          ? { ...file, tags: currentTags }
          : file
      )
    })

    if (!fileExists) return

    try {
      // Update in background with the captured current tags
      await updateFile(fileId, { tags: currentTags })
      
      // Reload all tags to include the new tag in sidebar
      loadAllTags()
      // Reload no-tag count since tags were modified
      loadNoTagCount()
      
      // Note: Toast will be handled by the component for multiple tags
    } catch (error) {
      console.error("Failed to add tag:", error)
      // Revert optimistic update
      setUploadedFiles(prev => 
        prev.map(file => 
          file.id === fileId 
            ? { ...file, tags: file.tags.filter(t => t !== tag) }
            : file
        )
      )
      toast.error("Failed to add tag", {
        description: createUserFriendlyMessage(error),
      })
      throw error
    }
  }, [updateFile])

  // Add multiple tags to file in a single operation
  const addMultipleTagsToFile = useCallback(async (fileId: string, newTags: string[]) => {
    if (newTags.length === 0) return

    let currentFile: UploadedFile | undefined
    let updatedTags: string[] = []
    
    // Optimistically update UI and capture current state
    setUploadedFiles(prev => {
      currentFile = prev.find(f => f.id === fileId)
      if (!currentFile) return prev
      
      // Merge new tags with existing ones, removing duplicates
      updatedTags = [...new Set([...currentFile.tags, ...newTags])]
      
      // Return updated state
      return prev.map(file => 
        file.id === fileId 
          ? { ...file, tags: updatedTags }
          : file
      )
    })

    if (!currentFile) return

    try {
      // Single API call with all tags
      await updateFile(fileId, { tags: updatedTags })
      
      // Reload all tags to include the new tags in sidebar
      loadAllTags()
      // Reload no-tag count since tags were modified
      loadNoTagCount()
      
      console.log("Successfully added multiple tags:", newTags)
    } catch (error) {
      console.error("Failed to add multiple tags:", error)
      // Revert optimistic update
      setUploadedFiles(prev => 
        prev.map(file => 
          file.id === fileId 
            ? { ...file, tags: currentFile!.tags }
            : file
        )
      )
      toast.error("Failed to add tags", {
        description: createUserFriendlyMessage(error),
      })
      throw error
    }
  }, [updateFile])

  // Initialize data on mount
  useEffect(() => {
    loadFiles()
    loadAllTags()
    loadNoTagCount()
  }, [loadFiles, loadAllTags, loadNoTagCount])

  // Memoize the active filters state to prevent unnecessary effect triggers
  const hasActiveFilters = useMemo(() => {
    return filters.fileTypes.length > 0 || filters.selectedTags.length > 0
  }, [filters.fileTypes.length, filters.selectedTags.length])

  // Handle data loading based on search, filters, and view mode
  useEffect(() => {
    const isSearching = searchQuery.trim().length > 0
    const isNoTagMode = viewState.galleryMode === "no-tag"
    const needsAllFiles = isSearching || hasActiveFilters || isNoTagMode
    
    // Check if the state has actually changed to prevent infinite loops
    const lastState = lastLoadingStateRef.current
    const stateChanged = lastState.needsAllFiles !== needsAllFiles || lastState.hasAllFilesLoaded !== hasAllFilesLoaded
    
    if (!stateChanged) {
      return
    }
    
    // Update the last state
    lastLoadingStateRef.current = { needsAllFiles, hasAllFilesLoaded }
    
    if (needsAllFiles && !hasAllFilesLoaded && !isLoadingAllFilesRef.current) {
      // Need all files for search, filters, or no-tag mode
      console.log("Loading all files for:", { 
        isSearching, 
        hasActiveFilters, 
        isNoTagMode, 
        hasAllFilesLoaded 
      })
      loadAllFilesForSearch()
    } else if (!needsAllFiles && hasAllFilesLoaded && viewState.galleryMode === "recent") {
      // Only reload if we're actually switching away from filters, not just modifying them
      // Add a small delay to prevent immediate reload when quickly changing filters
      const timeoutId = setTimeout(() => {
        if (!hasActiveFilters && hasAllFilesLoaded && viewState.galleryMode === "recent") {
          console.log("Returning to paginated view")
          loadFiles()
        }
      }, 300) // 300ms delay to allow for quick filter changes
      
      return () => clearTimeout(timeoutId)
    }
  }, [
    searchQuery, 
    hasActiveFilters,
    viewState.galleryMode, 
    hasAllFilesLoaded,
    loadAllFilesForSearch,
    loadFiles
  ])

  // Note: Removed automatic reload on filter changes since we now use client-side filtering
  // This allows real-time filtering without server requests

  return {
    // Data state
    uploadedFiles,
    isLoading,
    searchQuery,
    setSearchQuery,
    
    // Processed data
    processedItems,
    
    // Filter state  
    filters,
    setFilters,
    hasActiveFilters,
    
    // View state
    viewState,
    updateViewState,
    handleViewModeChange,
    
    // Selection state
    selectAllFiles,
    deselectAllFiles,
    toggleFileSelection,
    
    // Upload state
    newlyUploadedFiles,
    setNewlyUploadedFiles,
    pendingTags,
    setPendingTags,
    uploadingFiles,
    setUploadingFiles,
    
    // File operations
    updateFile,
    deleteFile,
    batchDelete,
    loadFiles,
    
    // Tag operations
    confirmTag,
    rejectTag,
    handleTagClick,
    
    // Upload management
    setUploadedFiles,
    handleFileUpload,
    
    // Tag management
    addTagToFile,
    addMultipleTagsToFile,
    allTags,
    
    // Pagination state
    hasMore,
    isLoadingMore,
    loadMoreFiles,
    totalCount,
    isLoadingSearch,
    noTagCount,
  }
}
