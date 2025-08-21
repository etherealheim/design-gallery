"use client"

import { motion } from "framer-motion"

export function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4">
        {/* Header Skeleton */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-2"></div>
            <div className="h-4 bg-muted rounded w-32"></div>
          </div>
          <div className="flex gap-2">
            <div className="w-10 h-10 bg-muted rounded animate-pulse"></div>
            <div className="w-10 h-10 bg-muted rounded animate-pulse"></div>
          </div>
        </motion.div>

        {/* Grid Skeleton */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="group hover:shadow-md transition-all duration-300 bg-card border border-border rounded-lg overflow-hidden p-0 animate-pulse"
            >
              {/* Image skeleton */}
              <div className="relative">
                <div className="w-full h-48 bg-muted"></div>
                <div className="absolute top-2 left-2 flex gap-1">
                  <div className="w-8 h-8 bg-muted-foreground/20 rounded"></div>
                  <div className="w-8 h-8 bg-muted-foreground/20 rounded"></div>
                </div>
              </div>
              
              {/* Content skeleton */}
              <div className="px-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded w-16"></div>
                  <div className="h-6 bg-muted rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
