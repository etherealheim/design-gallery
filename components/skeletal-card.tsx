"use client"

import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"

interface SkeletalCardProps {
  viewMode?: "grid" | "list"
}

export function SkeletalCard({ viewMode = "grid" }: SkeletalCardProps) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
      <Card
        className={`overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-200 ${
          viewMode === "list" ? "flex flex-row h-auto" : ""
        }`}
      >
        <div className={`bg-muted animate-pulse relative ${viewMode === "list" ? "w-32 h-24 flex-shrink-0" : "h-48"}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10" />
          <div className="absolute top-2 right-2 w-6 h-6 bg-muted-foreground/20 rounded animate-pulse" />
        </div>
        <div className="p-3 pt-1 flex-1">
          <div className="h-4 bg-muted rounded animate-pulse mb-2" />
          <div className="flex flex-wrap gap-1">
            <div className="h-5 w-12 bg-muted rounded animate-pulse" />
            <div className="h-5 w-16 bg-muted rounded animate-pulse" />
            <div className="h-5 w-10 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
