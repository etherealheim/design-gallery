"use client"

import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface RealtimeStatusProps {
  /** Whether real-time connection is active */
  isConnected: boolean
  /** Number of pending changes when user is idle */
  pendingChanges: number
  /** Whether user is currently idle */
  isIdle: boolean
  /** Callback to manually refresh */
  onRefresh?: () => void
  /** Additional CSS classes */
  className?: string
}

export function RealtimeStatus({
  isConnected,
  pendingChanges,
  isIdle,
  onRefresh,
  className,
}: RealtimeStatusProps) {
  // Get tooltip text based on status
  const getTooltipText = () => {
    if (!isConnected) {
      return "Real-time disconnected"
    }
    
    if (pendingChanges > 0) {
      return `${pendingChanges} update${pendingChanges !== 1 ? 's' : ''} available - Click to refresh`
    }
    
    if (isIdle) {
      return "Real-time connected - User idle"
    }
    
    return "Real-time connected - Live updates active"
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "h-2 w-2 rounded-full transition-all duration-300",
              isConnected ? "bg-green-500" : "bg-red-500",
              isConnected && "animate-pulse",
              pendingChanges > 0 && "cursor-pointer hover:scale-125 bg-orange-500",
              className
            )}
            onClick={pendingChanges > 0 ? onRefresh : undefined}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
