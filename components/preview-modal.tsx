"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Edit3, Check } from "lucide-react"
import type { GalleryItem } from "@/types"
import { useState } from "react"

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
          <div className="flex flex-col max-w-full h-full">
            <DialogTitle className="sr-only">
              {previewItem.title} - Preview
            </DialogTitle>
            <div className="flex items-center justify-between min-w-0 mb-4 shrink-0">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-green-500/20 hover:text-green-600 shrink-0 cursor-pointer transition-all duration-200"
                      onClick={handleSaveTitle}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-600 shrink-0 cursor-pointer transition-all duration-200"
                      onClick={handleCancelTitle}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-lg sm:text-xl font-semibold flex-1 min-w-0 truncate">{previewItem.title}</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-muted shrink-0"
                      onClick={handleStartRename}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setPreviewItem(null)} className="h-8 w-8 shrink-0 ml-2 cursor-pointer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-center overflow-hidden flex-1 min-h-0">
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
            <div className="space-y-3 min-w-0 flex flex-col items-center sm:items-start shrink-0 mt-4">
              <div className="flex flex-wrap gap-2 items-center justify-center sm:justify-start">
                {previewItem.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-sm flex items-center gap-1 pr-1 h-6">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:bg-red-500/20 hover:text-red-600 rounded-sm p-0.5 transition-all duration-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {!isAddingTag && (
                  <div
                    className="inline-flex items-center gap-1 px-2 py-1 text-sm border border-dashed border-muted-foreground/40 rounded-md bg-transparent cursor-pointer hover:border-muted-foreground/60 hover:bg-muted/20 transition-all duration-200 h-6"
                    onClick={() => setIsAddingTag(true)}
                  >
                    <span className="text-muted-foreground/70 hover:text-muted-foreground transition-colors duration-200">Add tag</span>
                  </div>
                )}
              </div>

              {isAddingTag && (
                <div className="inline-flex items-center gap-1 px-2 py-1 text-sm border border-dashed border-muted-foreground/50 rounded-md bg-transparent h-6">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Space or comma"
                    className="border-0 p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-w-[120px] w-auto placeholder:text-muted-foreground/60"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddTag()
                      if (e.key === "Escape") {
                        setIsAddingTag(false)
                        setNewTag("")
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleAddTag}
                    className="h-4 w-4 p-0 hover:bg-green-500/20 hover:text-green-600 transition-all duration-200"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsAddingTag(false)
                      setNewTag("")
                    }}
                    className="h-4 w-4 p-0 hover:bg-red-500/20 hover:text-red-600 transition-all duration-200"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
