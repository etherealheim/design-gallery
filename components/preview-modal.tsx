"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { X, Edit3, Check, Copy } from "lucide-react"
import type { GalleryItem } from "@/types"
import { useState, useRef } from "react"
import { parseTagsInput } from "@/lib/validation"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { TagInputModal } from "@/components/tag-input-modal"

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
  allTags: string[]
  onAddTagDirect?: (id: string, tag: string) => void
  onAddMultipleTags?: (id: string, tags: string[]) => void
}

// Utility function to check clipboard permissions and provide guidance
function getClipboardErrorGuidance(error: Error): { title: string; description: string } {
  const isHttps = window.location.protocol === 'https:'
  const isSecureContext = window.isSecureContext
  const userAgent = navigator.userAgent.toLowerCase()

  // Check for HTTPS requirement
  if (!isHttps) {
    return {
      title: "HTTPS Required",
      description: "Clipboard access requires a secure HTTPS connection. Please access the site via HTTPS."
    }
  }

  // Check for secure context
  if (!isSecureContext) {
    return {
      title: "Secure Context Required",
      description: "Clipboard access requires a secure context. Please ensure you're not in an insecure iframe."
    }
  }

  // Check for specific browser issues
  if (userAgent.includes('firefox')) {
    return {
      title: "Firefox Clipboard Permissions",
      description: "In Firefox, clipboard access may require explicit permission. Check your browser settings or try clicking again."
    }
  }

  if (userAgent.includes('safari')) {
    return {
      title: "Safari Clipboard Permissions",
      description: "Safari has strict clipboard policies. Try using the download option instead or check your privacy settings."
    }
  }

  // Generic guidance for other browsers
  return {
    title: "Clipboard Access Denied",
    description: "Browser security policy blocks clipboard access. Try copying manually, use the download option, or check your browser settings."
  }
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
  allTags,
  onAddTagDirect,
  onAddMultipleTags,
}: PreviewModalProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const { toast } = useToast()
  const [isCopyTooltipHoverOpen, setIsCopyTooltipHoverOpen] = useState(false)
  const [isCopyTooltipForcedOpen, setIsCopyTooltipForcedOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  const handleCopyMedia = async () => {
    if (!previewItem) return
    
    try {
      const response = await fetch(previewItem.url, { mode: "cors", cache: "no-store" })
      const originalBlob = await response.blob()
      
      if (previewItem.type === "image" || previewItem.type === "gif") {
        const preferredType = originalBlob.type && originalBlob.type.startsWith("image/") ? originalBlob.type : "image/png"

        const writeToClipboard = async (blob: Blob) => {
          const ClipboardItemCtor = (window as any).ClipboardItem
          await navigator.clipboard.write([
            new ClipboardItemCtor({ [blob.type || preferredType]: blob })
          ])
        }

        try {
          await writeToClipboard(originalBlob)
        } catch (clipboardError) {
          if (clipboardError instanceof Error &&
              (clipboardError.name === 'NotAllowedError' ||
               clipboardError.message.includes('not allowed by the user agent') ||
               clipboardError.message.includes('permission'))) {
            throw clipboardError // Re-throw to be handled by main error handler
          }

          // Fallback: re-encode to PNG via canvas
          try {
            const bitmap = await createImageBitmap(originalBlob)
            const canvas = document.createElement("canvas")
            canvas.width = bitmap.width
            canvas.height = bitmap.height
            const ctx = canvas.getContext("2d")
            ctx?.drawImage(bitmap, 0, 0)
            const pngBlob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b || new Blob()), "image/png"))
            await writeToClipboard(pngBlob)
          } catch (fallbackError) {
            if (fallbackError instanceof Error &&
                (fallbackError.name === 'NotAllowedError' ||
                 fallbackError.message.includes('not allowed by the user agent') ||
                 fallbackError.message.includes('permission'))) {
              throw fallbackError // Re-throw to be handled by main error handler
            }
            throw fallbackError // Re-throw other errors
          }
        }
      } else if (previewItem.type === "video") {
        // Download video directly instead of copying to clipboard
        try {
          const response = await fetch(previewItem.url)
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)

          const link = document.createElement('a')
          link.href = url
          link.download = `${previewItem.title}.mp4`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          URL.revokeObjectURL(url)

          toast({ title: "Download started!", description: "Video downloaded successfully." })
        } catch (error) {
          console.error("Video download failed:", error)
          toast({
            title: "Download failed",
            description: "Could not download the video. Try again or copy the URL manually.",
            variant: "destructive"
          })
        }
      }

      setIsCopyTooltipForcedOpen(true)
      window.setTimeout(() => setIsCopyTooltipForcedOpen(false), 3000)
    } catch (error) {
      console.error("Failed to copy media:", error)

      // Handle various clipboard permission errors
      if (error instanceof Error &&
          (error.name === 'NotAllowedError' ||
           error.message.includes('not allowed by the user agent') ||
           error.message.includes('permission'))) {
        const guidance = getClipboardErrorGuidance(error)
        toast({
          title: guidance.title,
          description: guidance.description,
          variant: "destructive"
        })
        return
      }

      const mediaType = previewItem.type === "video" ? "video" : previewItem.type === "gif" ? "GIF" : "image"
      toast({
        title: "Copy failed",
        description: `Could not copy the ${mediaType}. Try again or download instead.`,
        variant: "destructive"
      })
    }
  }

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

  // Optional: future use of parseTagsInput if adding inline multi-tag input here

  const handleCancelTitle = () => {
    setEditTitle(previewItem?.title || "")
    setIsEditingTitle(false)
  }

  return (
    <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
      <DialogContent 
        className="w-[100vw] h-[100vh] max-w-[100vw] max-h-[100vh] sm:w-[95vw] sm:h-[95vh] sm:!max-w-[95vw] sm:!max-h-[95vh] lg:w-[90vw] lg:h-[90vh] lg:!max-w-[90vw] lg:!max-h-[90vh] p-4 sm:p-6 border-0 rounded-none sm:border sm:rounded-lg" 
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {previewItem && (
          <div className="flex flex-col h-full max-h-full min-h-0">
            <DialogTitle className="sr-only">
              {previewItem.title} - Preview
            </DialogTitle>
            
            {/* Header - Fixed at top */}
            <div className="flex items-center justify-between min-w-0 pb-2 shrink-0">
              {/* Left: Title + inline rename */}
              <div className="flex items-center gap-2 min-w-0 max-w-[70%]">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 w-full min-w-0">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-lg sm:text-xl font-semibold h-8 min-w-0 w-full"
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
                    <h2 className="text-lg sm:text-xl font-semibold truncate min-w-0">{previewItem.title}</h2>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 cursor-pointer"
                          onClick={handleStartRename}
                          aria-label="Rename"
                        >
                          <Edit3 />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent sideOffset={6}>Rename</TooltipContent>
                    </Tooltip>
                  </>
                )}
              </div>
              {/* Right: Actions */}
              <div className="flex items-center gap-1 pl-2">
                <Tooltip open={isCopyTooltipHoverOpen || isCopyTooltipForcedOpen} onOpenChange={setIsCopyTooltipHoverOpen}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 cursor-pointer"
                      onClick={handleCopyMedia}
                      aria-label={previewItem.type === "video" ? "Download video" : "Copy image"}
                    >
                      <Copy />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={6}>
                    {isCopyTooltipForcedOpen ?
                      (previewItem.type === "video" ? "Downloaded!" : "Copied!") :
                      (previewItem.type === "video" ? "Download video" : "Copy to clipboard")
                    }
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      ref={closeButtonRef}
                      onClick={() => setPreviewItem(null)} 
                      variant="ghost"
                      size="sm"
                      className="size-8 ml-1 cursor-pointer"
                      aria-label="Close"
                    >
                      <X />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={6}>Close</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Tags - Now positioned directly below the title */}
            <div className="shrink-0 min-w-0 flex flex-col items-center sm:items-start pt-1 pb-2 sm:pb-3">
              <div className="relative w-full max-w-full">
                <AnimatePresence mode="wait">
                  {isAddingTag ? (
                    <TagInputModal
                      imageId={previewItem.id}
                      imageTitle={previewItem.title}
                      existingTags={previewItem.tags}
                      allTags={allTags}
                      onAddTag={onAddTagDirect}
                      onAddMultipleTags={onAddMultipleTags}
                      isOpen={isAddingTag}
                      onClose={() => {
                        setIsAddingTag(false)
                        setNewTag("")
                      }}
                    />
                  ) : (
                    /* Normal tag display */
                    <motion.div
                      key="tags"
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      transition={{ 
                        duration: 0.15,
                        ease: "easeOut"
                      }}
                      className="flex flex-wrap gap-1.5 items-center justify-center sm:justify-start"
                    >
                      {previewItem.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-sm font-mono font-medium flex items-center gap-1 pr-1 h-6">
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
                        className="inline-flex items-center gap-1 px-2 py-1 text-sm font-mono font-medium border border-dashed border-muted-foreground/40 rounded-md bg-transparent cursor-pointer transition-all duration-200 h-6 hover:!border-muted-foreground/60 hover:!bg-muted/20"
                        onClick={() => setIsAddingTag(true)}
                      >
                        <span className="text-muted-foreground/70 hover:text-muted-foreground font-mono font-medium transition-colors duration-200">Add tag</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Media - Fills remaining space */}
            <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center overflow-hidden">
              {previewItem.type === "video" ? (
                <video
                  src={previewItem.url}
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                  controls
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    console.warn('Video loading error for:', previewItem.url);
                  }}
                />
              ) : (
                <img
                  src={previewItem.url || "/placeholder.svg"}
                  alt={previewItem.title}
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                  loading="lazy"
                  onError={(e) => {
                    console.warn(`${previewItem.type === 'gif' ? 'GIF' : 'Image'} loading error for:`, previewItem.url);
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              )}
            </div>

            
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
