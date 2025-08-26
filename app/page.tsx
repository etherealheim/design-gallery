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
    onPendingTags: (fileId, tags) => {
      setPendingTags((prev: PendingTags) => ({ ...prev, [fileId]: tags }))
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
  } = usePreviewModal()

  // Handle tag operations with the preview modal
  const handleAddTag = () => addTag(updateFile)
  const handleRemoveTag = (tag: string) => removeTag(tag, updateFile)

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
      
      toast.success("Zip download complete!", {
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
      
      toast.success("Selected files downloaded!", {
        id: toastId,
        description: `Successfully packaged ${selectedFiles.length} selected files`,
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
      />

      <div className="flex">
        {/* Filter Sidebar - Slide Out */}
        <div
          className={cn(
            "fixed left-0 top-20 bottom-0 w-80 bg-background/95 backdrop-blur-md border-r border-border shadow-xl z-50 transition-transform duration-300",
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
        <main className="flex-1 bg-background">
          <div className="container mx-auto px-4 py-8 animate-fade-in">
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
