"use client"

import { cn } from "@/lib/utils"


import { Search, Settings, Grid3X3, List, X, Upload, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
}: GalleryHeaderProps) {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        {/* Mobile Layout */}
        <div className="lg:hidden flex items-center gap-3">
          <div className="flex-1">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search designs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 w-full text-sm"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted cursor-pointer"
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

        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between gap-6">
          <div className="flex-1 max-w-2xl">
            <div className="relative flex-1" style={{ minWidth: "300px" }}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by tags or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-12 w-full"
              />
              {searchQuery && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted cursor-pointer"
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

          <div className="flex items-center gap-3">
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

            {onDownloadAllClick && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 bg-transparent cursor-pointer"
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

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isFilterOpen ? "default" : "outline"}
                    size="default"
                    className={cn(
                      "h-9 cursor-pointer",
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

            <div className="flex border rounded-md">
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

            {selectedFiles.size > 0 && (
              <>
                <Button variant="outline" size="default" className="h-9 bg-transparent" onClick={selectAllFiles}>
                  Select All
                </Button>
                <Button variant="outline" size="default" className="h-9 bg-transparent" onClick={deselectAllFiles}>
                  Clear
                </Button>
                <Button variant="destructive" size="default" className="h-9" onClick={handleBatchDelete}>
                  Delete ({selectedFiles.size})
                </Button>
              </>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ThemeToggle />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle theme</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </header>
  )
}
