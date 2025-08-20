"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TagInput } from "./tag-input"

interface TagEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (title: string, tags: string[]) => void
  initialTitle: string
  initialTags: string[]
}

export function TagEditorModal({ isOpen, onClose, onSave, initialTitle, initialTags }: TagEditorModalProps) {
  const [title, setTitle] = useState(initialTitle)
  const [tags, setTags] = useState<string[]>(initialTags)

  const handleSave = () => {
    onSave(title.trim() || initialTitle, tags)
    onClose()
  }

  const handleClose = () => {
    setTitle(initialTitle)
    setTags(initialTags)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Tags & Title</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title..." />
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            <TagInput tags={tags} onTagsChange={setTags} placeholder="Add tags to organize your design..." />
            <p className="text-xs text-muted-foreground">
              Press Enter or comma to add tags. Click suggestions to add them quickly.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
