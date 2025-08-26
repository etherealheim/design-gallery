"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Edit3, Check } from "lucide-react"
import type { GalleryItem } from "@/types"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface PreviewModalProps {
  previewItem: GalleryItem | null
  setPreviewItem: (item: GalleryItem | null) => void
  isAddingTag: boolean
  setIsAddingTag: (adding: boolean) => void
  newTag: string
  setNewTag: (tag: string) => void
  handleAddTag: () => void
  handleRemoveTag: (tag: string) => void
  onSave?: (id: string, newTitle: string, newTags: string[]) => Promise<void>
}

export function PreviewModal({
  previewItem,
  setPreviewItem,
  isAddingTag,
  setIsAddingTag,
  newTag,
  setNewTag,
  handleAddTag,
  handleRemoveTag,
  onSave,
}: PreviewModalProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState("")

  const handleStartRename = () => {
    if (previewItem) {
      setEditTitle(previewItem.title)
      setIsEditingTitle(true)
    }
  }

  const handleSaveTitle = async () => {
    if (!previewItem || !editTitle.trim()) return
    
    try {
      if (onSave) {
        await onSave(previewItem.id, editTitle.trim(), previewItem.tags)
      }
      setPreviewItem({ ...previewItem, title: editTitle.trim() })
      setIsEditingTitle(false)
    } catch (error) {
      console.error("Failed to save title:", error)
    }
  }

  const handleCancelTitle = () => {
    setEditTitle(previewItem?.title || "")
    setIsEditingTitle(false)
  }

  return (
    <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-[100vw] h-[100vh] sm:max-w-[95vw] sm:max-h-[95vh] sm:w-auto sm:h-auto p-4 sm:p-6 border-0 rounded-none sm:border sm:rounded-lg" showCloseButton={false}>
        {previewItem && (
          <div className="flex flex-col h-full max-h-full overflow-hidden">
            <DialogTitle className="sr-only">
              {previewItem.title} - Preview
            </DialogTitle>
            
            {/* Header - Fixed at top */}
            <div className="flex items-center justify-between min-w-0 pb-4 pt-2 shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-lg sm:text-xl font-semibold h-8 min-w-0"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveTitle()
                        } else if (e.key === "Escape") {
                          handleCancelTitle()
                        }
                      }}
                      autoFocus
                    />
                    <button
                      className="h-8 w-8 p-0 shrink-0 rounded-md inline-flex items-center justify-center bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={handleSaveTitle}
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <button
                      className="h-8 w-8 p-0 shrink-0 rounded-md inline-flex items-center justify-center bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={handleCancelTitle}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-lg sm:text-xl font-semibold flex-1 min-w-0 truncate">{previewItem.title}</h2>
                    <button
                      className="h-8 w-8 p-0 shrink-0 rounded-md inline-flex items-center justify-center bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={handleStartRename}
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
              <button 
                onClick={() => setPreviewItem(null)} 
                className="h-8 w-8 shrink-0 ml-2 rounded-md inline-flex items-center justify-center bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Media - Takes available space but reserves space for tags */}
            <div className="flex-1 min-h-0 flex items-center justify-center mb-4 max-h-[calc(100%-8rem)]">
              {previewItem.type === "video" ? (
                <video
                  src={previewItem.url}
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    console.error('Video loading error:', e.currentTarget.error);
                    console.log('Video URL:', previewItem.url);
                  }}
                  onLoadStart={() => {
                    console.log('Video loading started:', previewItem.url);
                  }}
                  onLoadedData={() => {
                    console.log('Video loaded successfully:', previewItem.url);
                  }}
                />
              ) : (
                <img
                  src={previewItem.url || "/placeholder.svg"}
                  alt={previewItem.title}
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                  onLoad={() => console.log('Image loaded:', previewItem.url)}
                  onError={(e) => {
                    console.error('Image loading error for:', previewItem.url);
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              )}
            </div>

            {/* Tags - Fixed at bottom with overlay input design */}
            <div className="shrink-0 min-w-0 flex flex-col items-center sm:items-start">
              <div className="relative w-full max-w-full">
                <AnimatePresence mode="wait">
                  {isAddingTag ? (
                    /* Overlay input that covers the entire tag area */
                    <motion.div
                      key="input"
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 600, 
                        damping: 20,
                        duration: 0.12
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-background/95 backdrop-blur-sm border border-dashed border-muted-foreground/50 rounded-lg"
                    >
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Space or comma"
                        className="flex-1 border-0 p-0 pl-2 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 text-base md:text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddTag()
                          if (e.key === "Escape") {
                            setIsAddingTag(false)
                            setNewTag("")
                          }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={handleAddTag}
                        className="h-6 w-6 p-0 rounded-sm inline-flex items-center justify-center bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingTag(false)
                          setNewTag("")
                        }}
                        className="h-6 w-6 p-0 rounded-sm inline-flex items-center justify-center bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  ) : (
                    /* Normal tag display */
                    <motion.div
                      key="tags"
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 600, 
                        damping: 20,
                        duration: 0.12
                      }}
                      className="flex flex-wrap gap-2 items-center justify-center sm:justify-start"
                    >
                      {previewItem.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-sm flex items-center gap-1 pr-1 h-6">
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 rounded-sm p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      <div
                        className="inline-flex items-center gap-1 px-2 py-1 text-sm border border-dashed border-muted-foreground/40 rounded-md bg-transparent cursor-pointer transition-all duration-200 h-6 hover:!border-muted-foreground/60 hover:!bg-muted/20"
                        onClick={() => setIsAddingTag(true)}
                      >
                        <span className="text-muted-foreground/70 hover:text-muted-foreground transition-colors duration-200">Add tag</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
