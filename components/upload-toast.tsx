"use client"

import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

interface UploadToastProps {
  fileName: string
  stage: "uploading" | "generating" | "complete"
  progress?: number
  generatedTags?: string[]
}

export function UploadToast({ fileName, stage, progress = 0, generatedTags = [] }: UploadToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 right-4 bg-background border border-border rounded-lg p-4 shadow-lg z-50 min-w-[300px]"
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: stage === "uploading" || stage === "generating" ? 360 : 0 }}
          transition={{ duration: 1, repeat: stage === "complete" ? 0 : Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <Loader2 className="h-4 w-4 text-primary" />
        </motion.div>

        <div className="flex-1">
          <div className="font-medium text-sm">
            {stage === "uploading" && "☁️ Uploading to storage..."}
            {stage === "generating" && "🤖 Generating tags..."}
            {stage === "complete" && "✅ Upload complete!"}
          </div>
          <div className="text-xs text-muted-foreground">
            {fileName}
            {stage === "complete" && generatedTags && generatedTags.length > 0 && (
              <span className="ml-2">
                Tags: {generatedTags.slice(0, 3).join(", ")}
                {generatedTags.length > 3 && "..."}
              </span>
            )}
          </div>

          {stage !== "complete" && (
            <motion.div
              className="w-full bg-muted rounded-full h-1 mt-2"
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
    </motion.div>
  )
}
