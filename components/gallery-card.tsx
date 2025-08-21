"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Edit3, X, Play, ImageIcon, Check } from "lucide-react"
import type { GalleryItem } from "@/types/gallery"
import { useState } from "react"

interface GalleryCardProps {
  image: GalleryItem
  viewMode: "grid" | "list"
  isNewlyUploaded: boolean
  pendingTags: string[]
  onPreview: (item: GalleryItem) => void
  onEdit: (item: GalleryItem) => void
  onDelete: (id: string) => void
  onConfirmTag: (id: string, tag: string) => void
  onRejectTag: (id: string, tag: string) => void
  onRename: (item: GalleryItem) => void
}

export function GalleryCard({
  image,
  viewMode,
  isNewlyUploaded,
  pendingTags,
  onPreview,
  onEdit,
  onDelete,
  onConfirmTag,
  onRejectTag,
  onRename,
}: GalleryCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(image.title)

  const handleSaveRename = () => {
    if (editTitle.trim() && editTitle !== image.title) {
      onRename({ ...image, title: editTitle.trim() })
    }
    setIsEditing(false)
  }

  const handleCancelRename = () => {
    setEditTitle(image.title)
    setIsEditing(false)
  }

  return (
    <Card
      className={`group hover:shadow-md transition-all duration-300 bg-card border-border cursor-pointer overflow-hidden p-0 my-0 ${
        viewMode === "list" ? "flex flex-row h-auto" : ""
      }`}
      onClick={() => !isEditing && onPreview(image)}
    >
      <div className="relative">
        {image.type === "video" ? (
          <video
            src={image.url}
            className={`w-full object-cover transition-transform duration-300 ${
              viewMode === "list" ? "h-auto" : "h-48"
            }`}
            muted
            loop
            playsInline
            preload="metadata"
            onMouseEnter={(e) => {
              const video = e.currentTarget
              video.currentTime = 0
              const playPromise = video.play()
              if (playPromise !== undefined) {
                playPromise.catch(() => {
                  // Silently handle autoplay restrictions
                })
              }
            }}
            onMouseLeave={(e) => {
              const video = e.currentTarget
              video.pause()
            }}
          />
        ) : (
          <img
            src={image.url || "/placeholder.svg"}
            alt={image.title}
            className={`w-full object-cover transition-transform duration-300 ${
              viewMode === "list" ? "h-auto" : "h-48"
            }`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute top-2 left-2 flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 transition-all duration-300 h-6 w-6 p-0 bg-black/80 text-white hover:bg-black/90 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              setIsEditing(true)
            }}
          >
            <Edit3 className="h-3 w-3" />
          </Button>
          {!image.id.match(/^\d+$/) && (
            <Button
              size="sm"
              variant="ghost"
              className="opacity-0 group-hover:opacity-100 transition-all duration-300 h-6 w-6 p-0 bg-black/80 text-white hover:bg-black/90 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(image.id)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="absolute top-2 right-2">
          <Button variant="secondary" size="sm" className="h-6 w-6 p-0 cursor-pointer">
            {image.type === "video" ? <Play className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      <div className="p-3 pt-1">
        <div className="flex items-start gap-2 mb-2">
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-6 text-sm flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveRename()
                  } else if (e.key === "Escape") {
                    handleCancelRename()
                  }
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSaveRename()
                }}
                className="h-6 w-6 p-0 hover:bg-muted"
              >
                <Check className="h-3 w-3 text-green-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCancelRename()
                }}
                className="h-6 w-6 p-0 hover:bg-muted"
              >
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          ) : (
            <h3 className="font-medium text-sm truncate flex-1">{image.title}</h3>
          )}
          {isNewlyUploaded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ml-2"
              style={{ backgroundColor: "#ECF1FF", color: "#1A57DA" }}
            >
              <span>new</span>
              <motion.svg width="12" height="12" viewBox="0 0 24 24" className="text-current">
                <motion.circle
                  cx="12"
                  cy="12"
                  r="8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="50.27"
                  strokeDashoffset="0"
                  animate={{
                    strokeDashoffset: [0, 50.27],
                  }}
                  transition={{
                    duration: 5,
                    ease: "linear",
                  }}
                />
              </motion.svg>
            </motion.div>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {image.tags.map((tag, tagIndex) => (
            <Badge key={tagIndex} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}

          {pendingTags.map((tag, tagIndex) => (
            <div
              key={`pending-${tagIndex}`}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-dashed border-muted-foreground/50 rounded-md bg-transparent"
            >
              <span className="text-muted-foreground">{tag}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onConfirmTag(image.id, tag)
                }}
                className="h-4 w-4 p-0 hover:bg-muted"
              >
                <Check className="h-3 w-3 text-foreground" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onRejectTag(image.id, tag)
                }}
                className="h-4 w-4 p-0 hover:bg-muted"
              >
                <X className="h-3 w-3 text-foreground" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
