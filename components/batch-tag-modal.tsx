"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { TagInput } from "./tag-input"
import { FileImage, FileVideo } from "lucide-react"

interface BatchTagModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (tags: string[]) => void
  selectedFiles: Array<{ id: string; title: string; type: "image" | "video" }>
}

export function BatchTagModal({ isOpen, onClose, onSave, selectedFiles }: BatchTagModalProps) {
  const [tags, setTags] = useState<string[]>([])

  const handleSave = () => {
    onSave(tags)
    setTags([])
    onClose()
  }

  const handleClose = () => {
    setTags([])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Tags to {selectedFiles.length} Files</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Selected Files</Label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {selectedFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                  {file.type === "video" ? <FileVideo className="h-4 w-4" /> : <FileImage className="h-4 w-4" />}
                  <span className="truncate">{file.title}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tags to Add</Label>
            <TagInput tags={tags} onTagsChange={setTags} placeholder="Add tags to all selected files..." />
            <p className="text-xs text-muted-foreground">
              These tags will be added to all selected files. Existing tags will be preserved.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            Add Tags to {selectedFiles.length} Files
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
