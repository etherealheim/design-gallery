"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { FilterSidebar } from "@/components/filter-sidebar"
import { GalleryHeader } from "@/components/gallery-header"
import { GalleryGrid } from "@/components/gallery-grid"
import { PreviewModal } from "@/components/preview-modal"
import { DragDropOverlay } from "@/components/drag-drop-overlay"
import { LoadingSkeleton } from "@/components/loading-skeleton"
import { useGalleryState } from "@/hooks/use-gallery-state"
import { useFileUpload } from "@/hooks/use-file-upload"
import { usePreviewModal } from "@/hooks/use-preview-modal"
import { BatchOperationsService } from "@/lib/services/file-service"
import type { ZipProgress } from "@/lib/services/zip-service"
import { toast } from "sonner"
import type { GalleryItem, PendingTags } from "@/types"

export default function DesignVault() {
  // Main gallery state management
  const {
    isLoading,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    viewState,
    updateViewState,
    handleViewModeChange,
    processedItems,
    selectAllFiles,
    deselectAllFiles,
    toggleFileSelection,
    newlyUploadedFiles,
    setNewlyUploadedFiles,
    pendingTags,
    setPendingTags,
    uploadingFiles,
    setUploadingFiles,
    updateFile,
    deleteFile,
    batchDelete,
    confirmTag,
    rejectTag,
    handleTagClick,
    setUploadedFiles,
    handleFileUpload,
    addTagToFile,
    addMultipleTagsToFile,
    hasMore,
    isLoadingMore,
    loadMoreFiles,
    totalCount,
    isLoadingSearch,
  } = useGalleryState()

  // File upload management
  const {
    isDragOverWindow,
    fileInputRef,
    handleFileInputChange,
    triggerFileInput,
  } = useFileUpload({
    onUploadComplete: (file) => {
      handleFileUpload(file)
    },
    onUploadStart: (skeletalId) => {
      setUploadingFiles(prev => [...prev, skeletalId])
    },
    onUploadEnd: (skeletalId) => {
      setUploadingFiles((prev: string[]) => prev.filter(id => id !== skeletalId))
    },
    onNewlyUploaded: (fileId) => {
      setNewlyUploadedFiles(prev => new Set([...prev, fileId]))
      setTimeout(() => {
        setNewlyUploadedFiles((prev: Set<string>) => {
          const newSet = new Set(prev)
          newSet.delete(fileId)
          return newSet
        })
      }, 5000)
    },

  })

  // Preview modal management
  const {
    previewItem,
    isAddingTag,
    newTag,
    openPreview,
    closePreview,
    startAddingTag,
    cancelAddingTag,
    handleTagInputChange,
    addTag,
    removeTag,
    setIsAddingTag,
    setNewTag,
  } = usePreviewModal()

    // Handle tag operations with the preview modal
  const handleAddTag = async () => {
    console.log("🔥 PREVIEW MODAL - handleAddTag called")
    console.log("🔥 PREVIEW MODAL - previewItem:", previewItem)
    console.log("🔥 PREVIEW MODAL - newTag:", newTag)
    
    if (!previewItem || !newTag.trim()) {
      console.log("🔥 PREVIEW MODAL - Early return: no item or empty tag")
      return
    }

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
    
    console.log("🔥 PREVIEW MODAL - Raw input:", rawTags)
    console.log("🔥 PREVIEW MODAL - Parsed tags:", tags)
    console.log("🔥 PREVIEW MODAL - Current tags:", previewItem.tags)
    
    // Remove duplicates and filter out existing tags
    const uniqueTags = [...new Set(tags)].filter(tag => !previewItem.tags.includes(tag))
    console.log("🔥 PREVIEW MODAL - Unique tags to add:", uniqueTags)
    
    if (uniqueTags.length === 0) {
      console.log("🔥 PREVIEW MODAL - No unique tags to add")
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
        description: `"${uniqueTags[0]}" added to ${previewItem.title}`,
      })
    } else {
      toast.success(`${uniqueTags.length} tags added`, {
        description: `Added ${uniqueTags.length} tags to ${previewItem.title}`,
      })
    }

    // Add all tags in a single batch to prevent race conditions
    console.log("🔥 PREVIEW MODAL - Adding tags in batch:", uniqueTags)
    console.log("🔥 PREVIEW MODAL - addMultipleTagsToFile function:", addMultipleTagsToFile)
    try {
      await addMultipleTagsToFile(previewItem.id, uniqueTags)
      console.log("🔥 PREVIEW MODAL - Successfully added all tags")
      
      // Update the preview item to show the new tags immediately
      const updatedTags = [...previewItem.tags, ...uniqueTags]
      const updatedPreviewItem = { ...previewItem, tags: updatedTags }
      openPreview(updatedPreviewItem)
      console.log("🔥 PREVIEW MODAL - Updated preview item with new tags:", updatedTags)
    } catch (error) {
      console.error("🔥 PREVIEW MODAL - Failed to add tags:", error)
    }
  }
  const handleRemoveTag = (tag: string) => {
    if (!previewItem) return
    
    // Remove tag from preview item immediately
    const updatedTags = previewItem.tags.filter(t => t !== tag)
    const updatedPreviewItem = { ...previewItem, tags: updatedTags }
    openPreview(updatedPreviewItem)
    
    // Remove tag from database
    removeTag(tag, updateFile)
  }

  // Handle item actions
  const handleEditTags = (item: GalleryItem) => openPreview(item)
  const handleRename = async (item: GalleryItem) => {
    await updateFile(item.id, { title: item.title, tags: item.tags })
  }
  const handleCardClick = (item: GalleryItem) => openPreview(item)

  // Handle preview save
  const handlePreviewSave = async (id: string, newTitle: string, newTags: string[]) => {
    await updateFile(id, { title: newTitle, tags: newTags })
  }

  // Handle download all files
  const handleDownloadAll = async () => {
    const files = processedItems.displayItems
    const estimatedSize = BatchOperationsService.getEstimatedZipSize(files)
    
    const toastId = toast.loading("Preparing zip archive...", {
      description: `Packaging ${files.length} files (~${estimatedSize})`,
    })
    
    try {
      await BatchOperationsService.downloadAllFiles(files, (progress: ZipProgress) => {
        // Update toast with progress
        const statusMessages = {
          preparing: "Preparing files...",
          downloading: `Downloading: ${progress.currentFileName}`,
          compressing: "Creating zip archive...",
          complete: "Download ready!",
          error: "Download failed"
        }
        
        toast.loading(statusMessages[progress.status], {
          id: toastId,
          description: `${progress.currentFile}/${progress.totalFiles} files (${progress.percentage}%)`,
        })
      })
      
      toast.success("Download complete", {
        id: toastId,
        description: `Successfully packaged ${files.length} files`,
      })
    } catch (error) {
      console.error("Download failed:", error)
      toast.error("Download failed", {
        id: toastId,
        description: "Unable to create zip archive. Please try again.",
      })
    }
  }

  // Handle download selected files
  const handleDownloadSelected = async () => {
    // Get the actual GalleryItem objects for selected file IDs
    const selectedFileIds = Array.from(viewState.selectedFiles)
    const selectedFiles = processedItems.displayItems.filter(item => 
      selectedFileIds.includes(item.id)
    )
    
    if (selectedFiles.length === 0) {
      toast.error("No files selected", {
        description: "Please select files to download.",
      })
      return
    }

    const estimatedSize = BatchOperationsService.getEstimatedZipSize(selectedFiles)
    
    const toastId = toast.loading("Preparing selected files...", {
      description: `Packaging ${selectedFiles.length} selected files (~${estimatedSize})`,
    })
    
    try {
      await BatchOperationsService.downloadSelectedFiles(selectedFiles, (progress: ZipProgress) => {
        // Update toast with progress
        const statusMessages = {
          preparing: "Preparing files...",
          downloading: `Downloading: ${progress.currentFileName}`,
          compressing: "Creating zip archive...",
          complete: "Download ready!",
          error: "Download failed"
        }
        
        toast.loading(statusMessages[progress.status], {
          id: toastId,
          description: `${progress.currentFile}/${progress.totalFiles} files (${progress.percentage}%)`,
        })
      })
      
      toast.success("Download complete", {
        id: toastId,
        description: `Successfully packaged ${selectedFiles.length} files`,
      })
    } catch (error) {
      console.error("Download failed:", error)
      toast.error("Download failed", {
        id: toastId,
        description: "Unable to create zip archive. Please try again.",
      })
    }
  }

  // Show loading skeleton only for initial page load, not for search
  if (isLoading && !isLoadingSearch) {
    return <LoadingSkeleton />
  }

  return (
    <div className={cn("min-h-screen bg-background text-foreground transition-colors duration-300")}>
      {/* Header */}
      <GalleryHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewState.mode}
        setViewMode={(mode) => updateViewState({ mode })}
        isFilterOpen={viewState.isFilterOpen}
        setIsFilterOpen={(isOpen) => updateViewState({ isFilterOpen: isOpen })}
        selectedFiles={viewState.selectedFiles}
        selectAllFiles={selectAllFiles}
        deselectAllFiles={deselectAllFiles}
        handleBatchDelete={batchDelete}
        onUploadClick={triggerFileInput}
        onDownloadAllClick={handleDownloadAll}
        onDownloadSelectedClick={handleDownloadSelected}
        selectedTags={filters.selectedTags}
        onRemoveTag={(tag) => {
          setFilters(prev => ({
            ...prev,
            selectedTags: prev.selectedTags.filter(t => t !== tag)
          }))
        }}
      />

      <div className="flex">
        {/* Filter Sidebar Backdrop */}
        {viewState.isFilterOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 transition-opacity duration-300"
            onClick={() => updateViewState({ isFilterOpen: false })}
          />
        )}

        {/* Filter Sidebar - Slide Out */}
        <div
          className={cn(
            "fixed left-4 top-24 bottom-4 w-80 z-40 transition-transform duration-300 rounded-2xl",
            viewState.isFilterOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="p-4 h-full overflow-y-auto">
            <FilterSidebar
              isOpen={viewState.isFilterOpen}
              onClose={() => updateViewState({ isFilterOpen: false })}
              filters={filters}
              onFiltersChange={setFilters}
              availableTags={processedItems.availableTags}
              totalItems={processedItems.displayItems.length}
              filteredItems={processedItems.filteredItems.length}
            />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 bg-background pt-24">
          <div className="container mx-auto px-4 py-8">
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Gallery Grid */}
            <GalleryGrid
              searchQuery={searchQuery}
              galleryViewMode={viewState.galleryMode}
              handleViewModeChange={handleViewModeChange}
              hasActiveFilters={filters.fileTypes.length > 0 || filters.selectedTags.length > 0}
              sortedAndFilteredImages={{
                displayImages: processedItems.displayItems,
                filteredImages: processedItems.filteredItems,
                availableTags: processedItems.availableTags,
              }}
              viewMode={viewState.mode}
              newlyUploadedFiles={newlyUploadedFiles}
              pendingTags={pendingTags}
              uploadingFiles={uploadingFiles}
              setPreviewItem={openPreview}
              handleEditTags={handleEditTags}
              handleDeleteFile={deleteFile}
              confirmTag={confirmTag}
              rejectTag={rejectTag}
              handleRename={handleRename}
              handleAddTag={addTagToFile}
              handleAddMultipleTags={addMultipleTagsToFile}
              selectedTags={filters.selectedTags}
              onToggleTagFilter={(tag) => {
                setFilters(prev => ({
                  ...prev,
                  selectedTags: prev.selectedTags.includes(tag)
                    ? prev.selectedTags.filter(t => t !== tag)
                    : [...prev.selectedTags, tag]
                }))
              }}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              loadMoreFiles={loadMoreFiles}
              totalCount={totalCount}
              isLoadingSearch={isLoadingSearch}
            />
          </div>
        </main>
      </div>

      {/* Preview Modal */}
      <PreviewModal
        previewItem={previewItem}
        setPreviewItem={(item: GalleryItem | null) => item ? openPreview(item) : closePreview()}
        isAddingTag={isAddingTag}
        setIsAddingTag={(adding: boolean) => adding ? startAddingTag() : cancelAddingTag()}
        newTag={newTag}
        setNewTag={handleTagInputChange}
        handleAddTag={handleAddTag}
        handleRemoveTag={handleRemoveTag}
        onSave={handlePreviewSave}
      />

      {/* Drag and Drop Overlay */}
      {isDragOverWindow && <DragDropOverlay />}
    </div>
  )
}
