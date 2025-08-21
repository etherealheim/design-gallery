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
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-6">
        {previewItem && (
          <div className="space-y-4 flex flex-col max-w-full">
            <DialogTitle className="sr-only">
              {previewItem.title} - Preview
            </DialogTitle>
            <div className="flex items-center justify-between min-w-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-xl font-semibold h-8 min-w-0"
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
                      className="h-8 w-8 p-0 hover:bg-muted shrink-0"
                      onClick={handleSaveTitle}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-muted shrink-0"
                      onClick={handleCancelTitle}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold flex-1 min-w-0 truncate">{previewItem.title}</h2>
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
              <Button variant="ghost" size="icon" onClick={() => setPreviewItem(null)} className="h-8 w-8 shrink-0 ml-2">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-center overflow-hidden">
              {previewItem.type === "video" ? (
                <video
                  src={previewItem.url}
                  className="max-w-full max-h-[75vh] w-auto h-auto object-contain rounded-lg"
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
                  className="max-w-full max-h-[75vh] w-auto h-auto object-contain rounded-lg"
                  onLoad={() => console.log('Image loaded:', previewItem.url)}
                  onError={(e) => {
                    console.error('Image loading error for:', previewItem.url);
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              )}
            </div>
            <div className="mt-4 space-y-3 min-w-0">
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
      </DialogContent>
    </Dialog>
  )
}
