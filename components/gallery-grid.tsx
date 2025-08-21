"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Clock, Shuffle, Search } from "lucide-react"
import { GalleryCard } from "./gallery-card"
import { SkeletalCard } from "./skeletal-card"
import type { GalleryItem } from "@/types/gallery"

interface GalleryGridProps {
  searchQuery: string
  galleryViewMode: "recent" | "random"
  handleViewModeChange: (mode: "recent" | "random") => void
  sortedAndFilteredImages: {
    displayImages: GalleryItem[]
    filteredImages: GalleryItem[]
    availableTags: string[]
  }
  viewMode: "grid" | "list"
  newlyUploadedFiles: Set<string>
  pendingTags: Record<string, string[]>
  uploadingFiles: string[]
  setPreviewItem: (item: GalleryItem) => void
  handleEditTags: (item: GalleryItem) => void
  handleDeleteFile: (id: string) => void
  confirmTag: (fileId: string, tag: string) => void
  rejectTag: (fileId: string, tag: string) => void
  handleRename: (item: GalleryItem) => void
}

export function GalleryGrid({
  searchQuery,
  galleryViewMode,
  handleViewModeChange,
  sortedAndFilteredImages,
  viewMode,
  newlyUploadedFiles,
  pendingTags,
  uploadingFiles,
  setPreviewItem,
  handleEditTags,
  handleDeleteFile,
  confirmTag,
  rejectTag,
  handleRename,
}: GalleryGridProps) {
  return (
    <>
      {!searchQuery && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant={galleryViewMode === "recent" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewModeChange("recent")}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Recent
            </Button>
            <Button
              variant={galleryViewMode === "random" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewModeChange("random")}
              className="flex items-center gap-2"
            >
              <Shuffle className="h-4 w-4" />
              Random
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {sortedAndFilteredImages.displayImages.length} designs{" "}
            {galleryViewMode === "random" ? "(showing 20 random)" : ""}
          </p>
        </div>
      )}

      {searchQuery && sortedAndFilteredImages.displayImages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No results found</h3>
          <p className="text-muted-foreground max-w-md">
            No designs match your search for "{searchQuery}". Try different keywords or browse all designs.
          </p>
        </div>
      )}

      {sortedAndFilteredImages.displayImages.length > 0 && (
        <motion.div
          layout
          className={`grid gap-6 ${
            viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
          }`}
        >
          <AnimatePresence mode="popLayout">
            {uploadingFiles.map((skeletalId) => (
              <motion.div
                key={skeletalId}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <SkeletalCard viewMode={viewMode} />
              </motion.div>
            ))}

            {sortedAndFilteredImages.displayImages.map((image, index) => (
              <motion.div
                key={`${galleryViewMode}-${image.id}`}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <GalleryCard
                  image={image}
                  viewMode={viewMode}
                  isNewlyUploaded={newlyUploadedFiles.has(image.id)}
                  pendingTags={pendingTags[image.id] || []}
                  onPreview={setPreviewItem}
                  onEdit={handleEditTags}
                  onDelete={handleDeleteFile}
                  onConfirmTag={confirmTag}
                  onRejectTag={rejectTag}
                  onRename={handleRename}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  )
}
