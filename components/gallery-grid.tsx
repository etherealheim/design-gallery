"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Clock, Shuffle, Search, Tag, Loader2 } from "lucide-react"
import { GalleryCard } from "./gallery-card"
import { SkeletalCard } from "./skeletal-card"
import { useIntersectionObserver } from "@/hooks/use-intersection-observer"
import type { GalleryItem } from "@/types"

interface GalleryGridProps {
  searchQuery: string
  galleryViewMode: "recent" | "random" | "no-tag"
  handleViewModeChange: (mode: "recent" | "random" | "no-tag") => void
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
  handleAddTag: (id: string, tag: string) => void
  // Infinite scroll props
  hasMore: boolean
  isLoadingMore: boolean
  loadMoreFiles: () => void
  totalCount: number
  isLoadingSearch: boolean
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
  handleAddTag,
  hasMore,
  isLoadingMore,
  loadMoreFiles,
  totalCount,
  isLoadingSearch,
}: GalleryGridProps) {
  // Use intersection observer for infinite scroll
  const { targetRef } = useIntersectionObserver({
    onIntersect: loadMoreFiles,
    enabled: hasMore && !isLoadingMore && !searchQuery,
    threshold: 0.1,
    rootMargin: "100px",
  })

  // Add a brief loading state when switching gallery modes to prevent layout shift
  const [isSwitchingMode, setIsSwitchingMode] = useState(false)
  const [currentMode, setCurrentMode] = useState(galleryViewMode)

  // Handle mode switching with loading state
  const handleModeSwitch = (mode: "recent" | "random" | "no-tag") => {
    if (mode !== currentMode) {
      setIsSwitchingMode(true)
      handleViewModeChange(mode)
      setCurrentMode(mode)
      
      // Brief delay to prevent jarring layout changes
      setTimeout(() => {
        setIsSwitchingMode(false)
      }, 150)
    }
  }

  // Calculate counts for each filter mode - use totalCount for recent, actual counts for others
  const recentCount = totalCount
  const randomCount = Math.min(20, totalCount)
  // For no-tag count, count from all available items (not limited by pagination)
  const noTagCount = searchQuery 
    ? sortedAndFilteredImages.filteredImages.filter(item => item.tags.length === 0).length
    : sortedAndFilteredImages.displayImages.filter(item => item.tags.length === 0).length

  return (
    <>
      {/* Search loading indicator */}
      {searchQuery && isLoadingSearch && (
        <div className="mb-4 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading all files for search...</span>
          </div>
        </div>
      )}

      {!searchQuery && (
        <div className="flex items-center justify-between mb-6 h-10">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={galleryViewMode === "recent" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleModeSwitch("recent")}
                    className="flex items-center gap-2 cursor-pointer min-w-[90px] sm:min-w-[110px] justify-start"
                  >
                    <Clock className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline shrink-0">Recent</span>
                    <Badge variant="secondary" className="ml-auto text-xs min-w-[24px] justify-center">
                      <AnimatedCounter value={recentCount} />
                    </Badge>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show recently uploaded files</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={galleryViewMode === "random" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleModeSwitch("random")}
                    className="flex items-center gap-2 cursor-pointer min-w-[90px] sm:min-w-[110px] justify-start"
                  >
                    <Shuffle className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline shrink-0">Random</span>
                    <Badge variant="secondary" className="ml-auto text-xs min-w-[24px] justify-center">
                      <AnimatedCounter value={randomCount} />
                    </Badge>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show files in random order</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={galleryViewMode === "no-tag" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleModeSwitch("no-tag")}
                  className="flex items-center gap-2 cursor-pointer min-w-[90px] sm:min-w-[110px] justify-start"
                >
                  <Tag className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline shrink-0">No Tag</span>
                  <Badge variant="secondary" className="ml-auto text-xs min-w-[24px] justify-center">
                    <AnimatedCounter value={noTagCount} />
                  </Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show files without any tags</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {searchQuery && sortedAndFilteredImages.displayImages.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center max-w-md">
            <Search className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p className="text-muted-foreground">
              No designs match your search for "{searchQuery}". Try different keywords or browse all designs.
            </p>
          </div>
        </div>
      )}

      {/* Mode switching loading indicator */}
      {isSwitchingMode && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Switching view...</span>
        </div>
      )}

      {!isSwitchingMode && sortedAndFilteredImages.displayImages.length > 0 && (
        <motion.div
          key={galleryViewMode} // Force re-mount on mode change to prevent layout issues
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={`grid gap-6 ${
            viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
          }`}
        >
          <AnimatePresence>
            {uploadingFiles.map((skeletalId) => (
              <motion.div
                key={skeletalId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <SkeletalCard viewMode={viewMode} />
              </motion.div>
            ))}

            {sortedAndFilteredImages.displayImages.map((image, index) => (
              <motion.div
                key={`${galleryViewMode}-${image.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
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
                  onAddTag={handleAddTag}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Infinite scroll trigger and loading indicator */}
      {!searchQuery && sortedAndFilteredImages.displayImages.length > 0 && (
        <div className="mt-8 flex justify-center">
          {hasMore && (
            <div ref={targetRef} className="flex items-center justify-center py-4">
              {isLoadingMore ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Loading more...</span>
                </div>
              ) : (
                <div className="h-4 w-4" /> // Invisible trigger element
              )}
            </div>
          )}
          {!hasMore && sortedAndFilteredImages.displayImages.length >= 20 && (
            <div className="flex items-center justify-center py-4 text-muted-foreground">
              <span className="text-sm">No more items to load</span>
            </div>
          )}
        </div>
      )}
    </>
  )
}
