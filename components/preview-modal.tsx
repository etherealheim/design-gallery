"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Edit3 } from "lucide-react"
import type { GalleryItem } from "@/types/gallery"

interface PreviewModalProps {
  previewItem: GalleryItem | null
  setPreviewItem: (item: GalleryItem | null) => void
  isAddingTag: boolean
  setIsAddingTag: (adding: boolean) => void
  newTag: string
  setNewTag: (tag: string) => void
  handleAddTag: () => void
  handleRemoveTag: (tag: string) => void
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
}: PreviewModalProps) {
  return (
    <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-6 overflow-auto">
        {previewItem && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">{previewItem.title}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-muted"
                  onClick={() => {
                    // This would trigger rename functionality
                    console.log("Rename clicked for:", previewItem.title)
                  }}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setPreviewItem(null)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
            {previewItem.type === "video" ? (
              <video
                src={previewItem.url}
                className="w-full max-h-[75vh] object-contain rounded-lg"
                controls
                autoPlay
                muted
                loop
              />
            ) : (
              <img
                src={previewItem.url || "/placeholder.svg"}
                alt={previewItem.title}
                className="w-full max-h-[75vh] object-contain rounded-lg"
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
      </DialogContent>
    </Dialog>
  )
}
