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
  } = useGalleryState()

  // File upload management
  const {
    isDragOverWindow,
    fileInputRef,
    handleFileInputChange,
    triggerFileInput,
  } = useFileUpload({
    onUploadComplete: (file) => {
      setUploadedFiles(prev => [file, ...prev])
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

  // Show loading skeleton
  if (isLoading) {
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
