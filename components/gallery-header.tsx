"use client"

import { cn } from "@/lib/utils"

import { Search, Settings, Grid3X3, List, X, Upload, Download, FileImage, FileVideo } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface GalleryHeaderProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  viewMode: "grid" | "list"
  setViewMode: (mode: "grid" | "list") => void
  isFilterOpen: boolean
  setIsFilterOpen: (open: boolean) => void
  selectedFiles: Set<string>
  selectAllFiles: () => void
  deselectAllFiles: () => void
  handleBatchDelete: () => void
  onUploadClick?: () => void
  onDownloadAllClick?: () => void
  onDownloadSelectedClick?: () => void
  selectedTags: string[]
  onRemoveTag: (tag: string) => void
}

export function GalleryHeader({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  isFilterOpen,
  setIsFilterOpen,
  selectedFiles,
  selectAllFiles,
  deselectAllFiles,
  handleBatchDelete,
  onUploadClick,
  onDownloadAllClick,
  onDownloadSelectedClick,
  selectedTags,
  onRemoveTag,
}: GalleryHeaderProps) {
  return (
         <header className="fixed top-4 left-4 right-4 z-50 border border-border bg-background/70 backdrop-blur-sm overflow-hidden rounded-2xl">
      <div className="absolute inset-0 backdrop-invert pointer-events-none" style={{ 
        maskImage: 'linear-gradient(to bottom, transparent 0px, transparent 80px, black 80px)', 
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, transparent 80px, black 80px)' 
      }}></div>
      <div className="w-full px-4 py-4">
        {/* Mobile Layout */}
        <div className="lg:hidden flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
                
                {/* Container for input and tags */}
                <div className="relative">
                  <Input
                    placeholder={selectedTags.length > 0 ? "" : "Search designs..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 w-full text-base md:text-sm"
                  />
                  
                  {/* Selected Tag Chips inside input */}
                  {selectedTags.length > 0 && (
                    <div className="absolute top-1/2 transform -translate-y-1/2 left-10 right-12 flex flex-wrap gap-1.5 items-center">
                      {selectedTags.map((tag) => {
                        const isFileTypeTag = tag.startsWith('type:')
                        const fileType = isFileTypeTag ? tag.replace('type:', '') : null
                        const displayText = isFileTypeTag 
                          ? (fileType === 'image' ? 'Images' : fileType === 'video' ? 'Videos' : fileType)
                          : (tag === "__no_tags__" ? "No tags" : tag)
                        
                        return (
                          <Badge
                            key={tag}
                            variant="default"
                            className="text-xs font-mono font-medium h-5 px-1.5 bg-primary text-primary-foreground transition-colors cursor-pointer flex items-center gap-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => onRemoveTag(tag)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'hsl(var(--primary) / 0.8)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'hsl(var(--primary))'
                            }}
                          >
                            {isFileTypeTag && fileType === 'image' && <FileImage className="h-3 w-3" />}
                            {isFileTypeTag && fileType === 'video' && <FileVideo className="h-3 w-3" />}
                            {displayText}
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>
                
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted cursor-pointer z-10"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {onUploadClick && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent cursor-pointer px-2 sm:px-3 h-9"
                  onClick={onUploadClick}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  <span className="text-xs">Upload</span>
                </Button>
              )}
              
              {onDownloadAllClick && (
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-transparent cursor-pointer h-9 w-9 shrink-0 hidden sm:flex"
                  onClick={onDownloadAllClick}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              
              <div className="hidden sm:block lg:hidden">
                <ThemeToggle />
              </div>
            </div>
          </div>

        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center">
          {/* Search Input */}
          <div className="flex-1 mr-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
              
              {/* Container for input and tags */}
              <div className="relative">
                <Input
                  placeholder={selectedTags.length > 0 ? "" : "Search by tags or title..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-12 w-full"
                />
                
                {/* Selected Tag Chips inside input */}
                {selectedTags.length > 0 && (
                  <div className="absolute top-1/2 transform -translate-y-1/2 left-10 right-12 flex flex-wrap gap-1.5 items-center">
                    {selectedTags.map((tag) => {
                      const isFileTypeTag = tag.startsWith('type:')
                      const fileType = isFileTypeTag ? tag.replace('type:', '') : null
                      const displayText = isFileTypeTag 
                        ? (fileType === 'image' ? 'Images' : fileType === 'video' ? 'Videos' : fileType)
                        : (tag === "__no_tags__" ? "No tags" : tag)
                      
                      return (
                        <Badge
                          key={tag}
                          variant="default"
                          className="text-xs font-mono font-medium h-5 px-1.5 bg-primary text-primary-foreground transition-colors cursor-pointer flex items-center gap-1"
                          style={{ cursor: 'pointer' }}
                          onClick={() => onRemoveTag(tag)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'hsl(var(--primary) / 0.8)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'hsl(var(--primary))'
                          }}
                        >
                          {isFileTypeTag && fileType === 'image' && <FileImage className="h-3 w-3" />}
                          {isFileTypeTag && fileType === 'video' && <FileVideo className="h-3 w-3" />}
                          {displayText}
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </div>
              
              {searchQuery && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted cursor-pointer z-10"
                        onClick={() => setSearchQuery("")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clear search</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          {/* Navigation Controls: 16px between Upload/Grid/Download, 8px between Download/Filters/Theme */}
          <div className="flex items-center">
            {/* Upload Button */}
            {onUploadClick && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="default"
                      className="h-9 bg-transparent cursor-pointer"
                      onClick={onUploadClick}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upload Multiple Files</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Grid/List View Toggle */}
            <div className="flex border rounded-md ml-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="sm"
                      className="rounded-r-none border-r-0 h-9 cursor-pointer"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Grid View</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="sm"
                      className="rounded-l-none h-9 cursor-pointer"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>List View</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Download All Button */}
            {onDownloadAllClick && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 bg-transparent cursor-pointer ml-4"
                      onClick={onDownloadAllClick}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Download All Files</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Toggle Filters Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isFilterOpen ? "default" : "outline"}
                    size="icon"
                    className={cn(
                      "h-9 w-9 cursor-pointer ml-2",
                      isFilterOpen ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-transparent",
                    )}
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle Filters</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Theme Toggle */}
            <div className="ml-2">
              <ThemeToggle />
            </div>
          </div>

          {/* Selected Files Actions */}
          {selectedFiles.size > 0 && (
            <div className="flex items-center gap-3 ml-4 pl-4 border-l">
              <Button variant="outline" size="default" className="h-9 bg-transparent" onClick={selectAllFiles}>
                Select All
              </Button>
              <Button variant="outline" size="default" className="h-9 bg-transparent" onClick={deselectAllFiles}>
                Clear
              </Button>
              {onDownloadSelectedClick && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="default" className="h-9 bg-transparent" onClick={onDownloadSelectedClick}>
                        <Download className="h-4 w-4 mr-2" />
                        Download ({selectedFiles.size})
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download selected files as zip</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Button variant="destructive" size="default" className="h-9" onClick={handleBatchDelete}>
                Delete ({selectedFiles.size})
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
