"use client"

import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"

export function SkeletalCard() {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
      <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-200">
        <div className="aspect-square bg-muted animate-pulse relative">
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10" />
          <div className="absolute top-2 right-2 w-6 h-6 bg-muted-foreground/20 rounded animate-pulse" />
        </div>
        <div className="p-3 pt-2">
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
