"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { Download, Archive, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DownloadDropdownProps {
  onDownloadZip?: () => void
  onExportTable?: () => void
  className?: string
}

export function DownloadDropdown({
  onDownloadZip,
  onExportTable,
  className = "h-9 w-9 bg-transparent cursor-pointer ml-4"
}: DownloadDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleItemClick = (callback?: () => void) => {
    if (callback) {
      callback()
    }
    setIsOpen(false)
  }

  const handleButtonClick = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8, // 8px gap below button
        left: rect.right - 224, // 224px = w-56 (14rem * 16px)
      })
    }
    setIsOpen(!isOpen)
  }

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const dropdownContent = isOpen ? (
    <div
      className="fixed w-56 z-[9999]"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
      }}
    >
      <DropdownMenu
        isOpen={true}
        onClose={() => setIsOpen(false)}
        className="relative w-full !rounded-xl"
      >
        {onDownloadZip && (
          <DropdownMenuItem onSelect={() => handleItemClick(onDownloadZip)} className="rounded-lg">
            <div className="flex items-start gap-2 w-full">
              <Archive className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span>Download ZIP File</span>
                <span className="text-xs text-muted-foreground">
                  Download all files as ZIP archive
                </span>
              </div>
            </div>
          </DropdownMenuItem>
        )}
        
        {onExportTable && (
          <DropdownMenuItem onSelect={() => handleItemClick(onExportTable)} className="rounded-lg">
            <div className="flex items-start gap-2 w-full">
              <Database className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span>Export Table Data</span>
                <span className="text-xs text-muted-foreground">
                  Backup database records as JSON
                </span>
              </div>
            </div>
          </DropdownMenuItem>
        )}
      </DropdownMenu>
    </div>
  ) : null

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              ref={buttonRef}
              variant="outline"
              size="icon"
              className={className}
              onClick={handleButtonClick}
            >
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Download Options</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {typeof document !== 'undefined' && dropdownContent && 
        createPortal(dropdownContent, document.body)
      }
    </>
  )
}
