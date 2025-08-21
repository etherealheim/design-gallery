"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"

interface SkeletalCardProps {
  viewMode: "grid" | "list"
}

export function SkeletalCard({ viewMode }: SkeletalCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="w-full"
    >
      <Card
        className={`group hover:shadow-md transition-all duration-300 bg-card border-border overflow-hidden p-0 animate-pulse ${
          viewMode === "list" ? "flex flex-row h-auto" : ""
        }`}
      >
        {/* Image skeleton */}
        <div className="relative">
          <div className={`w-full bg-muted transition-transform duration-300 ${
            viewMode === "list" ? "h-auto" : "h-48"
          }`}></div>
          <div className="absolute top-2 left-2 flex gap-1">
            <div className="w-6 h-6 bg-muted-foreground/20 rounded"></div>
            <div className="w-6 h-6 bg-muted-foreground/20 rounded"></div>
          </div>
          <div className="absolute top-2 right-2">
            <div className="w-6 h-6 bg-muted-foreground/20 rounded"></div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="p-3 pt-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="flex gap-2">
            <div className="h-6 bg-muted rounded w-16"></div>
            <div className="h-6 bg-muted rounded w-20"></div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
