"use client"

import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

interface UploadToastProps {
  fileName: string
  phase: "uploading" | "generating" | "complete"
  progress?: number
  generatedTags?: string[]
}

export function UploadToast({ fileName, phase, progress = 0, generatedTags = [] }: UploadToastProps) {
  return (
    <div className="flex items-center gap-3">
      <motion.div
        animate={{ rotate: phase === "uploading" || phase === "generating" ? 360 : 0 }}
        transition={{ duration: 1, repeat: phase === "complete" ? 0 : Number.POSITIVE_INFINITY, ease: "linear" }}
      >
        <Loader2 className="h-4 w-4" />
      </motion.div>

      <div className="flex-1">
        <div className="font-medium text-sm">
          {phase === "uploading" && "Uploading..."}
          {phase === "generating" && "Generating tags..."}
          {phase === "complete" && "Upload complete!"}
        </div>
        <div className="text-xs text-muted-foreground">
          {fileName}
          {phase === "complete" && generatedTags.length > 0 && (
            <span className="ml-2">
              Tags: {generatedTags.slice(0, 3).join(", ")}
              {generatedTags.length > 3 && "..."}
            </span>
          )}
        </div>

        {phase !== "complete" && (
          <motion.div
            className="w-full bg-muted rounded-full h-1 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="bg-primary h-1 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        )}
      </div>
    </div>
  )
}
