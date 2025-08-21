"use client"

import { motion } from "framer-motion"
import { Upload, Image, Video, Plus } from "lucide-react"

export function DragDropOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="relative"
      >
        {/* Main drop zone */}
        <motion.div
          animate={{ 
            scale: [1, 1.02, 1],
            borderColor: ["hsl(var(--border))", "hsl(var(--primary))", "hsl(var(--border))"]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="p-12 border-2 border-dashed border-border bg-card/50 backdrop-blur-sm rounded-xl shadow-2xl max-w-md mx-4"
        >
          <div className="text-center space-y-6">
            {/* Icon with floating animation */}
            <motion.div
              animate={{ y: [-2, 2, -2] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="relative mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <Upload className="w-8 h-8 text-primary" />
              
              {/* Floating file type icons */}
              <motion.div
                animate={{ 
                  rotate: 360,
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                <Image className="absolute -top-1 -right-1 w-4 h-4 text-primary/60" />
                <Video className="absolute -bottom-1 -left-1 w-4 h-4 text-primary/60" />
                <Plus className="absolute -top-1 -left-1 w-3 h-3 text-primary/40" />
              </motion.div>
            </motion.div>

            {/* Text content */}
            <div className="space-y-3">
              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-semibold text-foreground"
              >
                Drop your files
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed"
              >
                Release to upload images and videos to your gallery
              </motion.p>
            </div>

            {/* Supported formats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-3 text-xs text-muted-foreground"
            >
              <div className="flex items-center gap-1">
                <Image className="w-3 h-3" />
                <span>Images</span>
              </div>
              <div className="w-1 h-1 bg-muted-foreground/40 rounded-full" />
              <div className="flex items-center gap-1">
                <Video className="w-3 h-3" />
                <span>Videos</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Subtle glow effect */}
        <motion.div
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-primary/10 rounded-xl blur-xl -z-10"
        />
      </motion.div>
    </motion.div>
  )
}
