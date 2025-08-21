"use client"

import { useState } from "react"
import { X, ChevronDown, ChevronUp, FileImage, FileVideo, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export interface FilterState {
  fileTypes: ("image" | "video")[]
  selectedTags: string[]
  sortBy: "title" | "date" | "tags"
  sortOrder: "asc" | "desc"
}

interface FilterSidebarProps {
  isOpen: boolean
  onClose: () => void
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  availableTags: string[]
  totalItems: number
  filteredItems: number
}

export function FilterSidebar({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  availableTags,
  totalItems,
  filteredItems,
}: FilterSidebarProps) {
  const [isFileTypesOpen, setIsFileTypesOpen] = useState(true)
  const [isTagsOpen, setIsTagsOpen] = useState(true)

  const getTagColor = (tag: string) => {
    const colors = [
      "bg-blue-100 text-blue-800 hover:bg-blue-200",
      "bg-green-100 text-green-800 hover:bg-green-200",
      "bg-purple-100 text-purple-800 hover:bg-purple-200",
      "bg-pink-100 text-pink-800 hover:bg-pink-200",
      "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
      "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
      "bg-teal-100 text-teal-800 hover:bg-teal-200",
      "bg-orange-100 text-orange-800 hover:bg-orange-200",
    ]
    const hash = tag.split("").reduce((a, b) => a + b.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const toggleFileType = (type: "image" | "video") => {
    const newFileTypes = filters.fileTypes.includes(type)
      ? filters.fileTypes.filter((t) => t !== type)
      : [...filters.fileTypes, type]

    onFiltersChange({ ...filters, fileTypes: newFileTypes })
  }

  const toggleTag = (tag: string) => {
    const newTags = filters.selectedTags.includes(tag)
      ? filters.selectedTags.filter((t) => t !== tag)
      : [...filters.selectedTags, tag]

    onFiltersChange({ ...filters, selectedTags: newTags })
  }

  const toggleNoTags = () => {
    const hasNoTagsFilter = filters.selectedTags.includes("__no_tags__")
    const newTags = hasNoTagsFilter
      ? filters.selectedTags.filter((t) => t !== "__no_tags__")
      : [...filters.selectedTags, "__no_tags__"]

    onFiltersChange({ ...filters, selectedTags: newTags })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      fileTypes: [],
      selectedTags: [],
      sortBy: "title",
      sortOrder: "asc",
    })
  }

  const hasActiveFilters = filters.fileTypes.length > 0 || filters.selectedTags.length > 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto animate-fade-in">
      {/* Backdrop for mobile */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm lg:hidden" onClick={onClose} />

      {/* Sidebar */}
      <Card className="absolute left-0 top-0 h-full w-80 lg:relative lg:w-full lg:h-auto glass-effect shadow-strong lg:shadow-soft animate-slide-up lg:animate-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            Filters
            <Badge variant="secondary" className="ml-2 text-xs">
              {filteredItems} items
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden hover-lift">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          <Collapsible open={isFileTypesOpen} onOpenChange={setIsFileTypesOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover-lift">
                <span className="font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  File Type
                </span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  {isFileTypesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="flex gap-2">
                <Button
                  variant={filters.fileTypes.includes("image") ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFileType("image")}
                  className="flex-1 justify-center"
                >
                  <FileImage className="h-4 w-4 mr-2" />
                  Images
                </Button>
                <Button
                  variant={filters.fileTypes.includes("video") ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFileType("video")}
                  className="flex-1 justify-center"
                >
                  <FileVideo className="h-4 w-4 mr-2" />
                  Videos
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={isTagsOpen} onOpenChange={setIsTagsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover-lift">
                <span className="font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Tags ({availableTags.length})
                </span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  {isTagsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
              <div className="flex items-center justify-between p-2 border rounded-md">
                <span className="text-sm font-medium">No tags</span>
                <Switch checked={filters.selectedTags.includes("__no_tags__")} onCheckedChange={toggleNoTags} />
              </div>

              {availableTags.length > 0 && (
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={filters.selectedTags.includes(tag) ? "default" : "secondary"}
                      className={cn(
                        "text-xs font-medium cursor-pointer transition-all duration-300 hover:scale-105 shadow-soft hover:shadow-medium",
                        filters.selectedTags.includes(tag)
                          ? "gradient-primary text-primary-foreground"
                          : getTagColor(tag),
                      )}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="space-y-2 bg-muted/20 rounded-lg p-3 backdrop-blur-sm">
              <span className="text-sm font-medium">Active Filters:</span>
              <div className="flex flex-wrap gap-2">
                {filters.fileTypes.map((type) => (
                  <Badge key={type} variant="default" className="text-xs gradient-primary shadow-soft">
                    {type === "image" ? <FileImage className="h-3 w-3 mr-1" /> : <FileVideo className="h-3 w-3 mr-1" />}
                    {type}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      onClick={() => toggleFileType(type)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                {filters.selectedTags.map((tag) => (
                  <Badge key={tag} variant="default" className="text-xs gradient-primary shadow-soft">
                    {tag === "__no_tags__" ? "No tags" : tag}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      onClick={() => (tag === "__no_tags__" ? toggleNoTags() : toggleTag(tag))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
