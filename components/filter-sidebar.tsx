"use client"

import { useState } from "react"
import { Filter, X, ChevronDown, ChevronUp, FileImage, FileVideo, SortAsc, SortDesc } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const [isSortOpen, setIsSortOpen] = useState(true)

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
            <div className="w-5 h-5 gradient-primary rounded flex items-center justify-center">
              <Filter className="h-3 w-3 text-primary-foreground" />
            </div>
            Filters
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden hover-lift">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Results Summary */}
          <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 backdrop-blur-sm">
            Showing <span className="font-medium text-foreground">{filteredItems}</span> of{" "}
            <span className="font-medium text-foreground">{totalItems}</span> items
            {hasActiveFilters && (
              <Button
                variant="link"
                size="sm"
                onClick={clearAllFilters}
                className="h-auto p-0 ml-2 text-accent hover:text-accent/80 transition-colors duration-300"
              >
                Clear all
              </Button>
            )}
          </div>

          {/* File Types Filter */}
          <Collapsible open={isFileTypesOpen} onOpenChange={setIsFileTypesOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover-lift">
                <span className="font-medium">File Type</span>
                {isFileTypesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-3">
              <Button
                variant={filters.fileTypes.includes("image") ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFileType("image")}
                className={cn(
                  "w-full justify-start transition-all duration-300 hover-lift shadow-soft",
                  filters.fileTypes.includes("image")
                    ? "gradient-primary shadow-medium"
                    : "bg-card/50 backdrop-blur-sm",
                )}
              >
                <FileImage className="h-4 w-4 mr-2" />
                Images
              </Button>
              <Button
                variant={filters.fileTypes.includes("video") ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFileType("video")}
                className={cn(
                  "w-full justify-start transition-all duration-300 hover-lift shadow-soft",
                  filters.fileTypes.includes("video")
                    ? "gradient-primary shadow-medium"
                    : "bg-card/50 backdrop-blur-sm",
                )}
              >
                <FileVideo className="h-4 w-4 mr-2" />
                Videos
              </Button>
            </CollapsibleContent>
          </Collapsible>

          {/* Sort Options */}
          <Collapsible open={isSortOpen} onOpenChange={setIsSortOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover-lift">
                <span className="font-medium">Sort</span>
                {isSortOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Sort by</label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value: "title" | "date" | "tags") => onFiltersChange({ ...filters, sortBy: value })}
                >
                  <SelectTrigger className="bg-card/50 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-effect shadow-strong">
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="date">Date Added</SelectItem>
                    <SelectItem value="tags">Number of Tags</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filters.sortOrder === "asc" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onFiltersChange({ ...filters, sortOrder: "asc" })}
                  className={cn(
                    "flex-1 transition-all duration-300 hover-lift shadow-soft",
                    filters.sortOrder === "asc" ? "gradient-primary shadow-medium" : "bg-card/50 backdrop-blur-sm",
                  )}
                >
                  <SortAsc className="h-4 w-4 mr-1" />
                  Asc
                </Button>
                <Button
                  variant={filters.sortOrder === "desc" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onFiltersChange({ ...filters, sortOrder: "desc" })}
                  className={cn(
                    "flex-1 transition-all duration-300 hover-lift shadow-soft",
                    filters.sortOrder === "desc" ? "gradient-primary shadow-medium" : "bg-card/50 backdrop-blur-sm",
                  )}
                >
                  <SortDesc className="h-4 w-4 mr-1" />
                  Desc
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <Collapsible open={isTagsOpen} onOpenChange={setIsTagsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto hover-lift">
                  <span className="font-medium">Tags ({availableTags.length})</span>
                  {isTagsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
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
              </CollapsibleContent>
            </Collapsible>
          )}

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
                    {tag}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      onClick={() => toggleTag(tag)}
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
