"use client"

import { motion } from "framer-motion"
import { Search, Settings, Grid3X3, List } from "lucide-react"
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
}: GalleryHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center"
          >
            <svg width="32" height="32" viewBox="0 0 32 32" className="text-white">
              <polygon points="16,4 28,26 4,26" fill="currentColor" />
            </svg>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-4 flex-1 max-w-2xl mx-8"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by tags or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center gap-2"
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="default"
                    className="h-10 bg-transparent"
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
                      className="rounded-r-none border-r-0 h-10"
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
                      className="rounded-l-none h-10"
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
                <Button variant="outline" size="default" className="h-10 bg-transparent" onClick={selectAllFiles}>
                  Select All
                </Button>
                <Button variant="outline" size="default" className="h-10 bg-transparent" onClick={deselectAllFiles}>
                  Clear
                </Button>
                <Button variant="destructive" size="default" className="h-10" onClick={handleBatchDelete}>
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
          </motion.div>
        </div>
      </div>
    </motion.header>
  )
}
