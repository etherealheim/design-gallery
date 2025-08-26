"use client"

import { useState, useEffect, useRef, useCallback } from "react"

export interface UseIdleDetectionOptions {
  /** Idle timeout in milliseconds (default: 30 seconds) */
  idleTimeout?: number
  /** Events to listen for user activity (default: mousemove, mousedown, keypress, scroll, touchstart) */
  events?: string[]
  /** Whether to start detecting immediately (default: true) */
  startOnMount?: boolean
  /** Callback when user becomes idle */
  onIdle?: () => void
  /** Callback when user becomes active */
  onActive?: () => void
}

export interface UseIdleDetectionReturn {
  /** Whether user is currently idle */
  isIdle: boolean
  /** Time remaining until idle (in milliseconds) */
  timeUntilIdle: number
  /** Last activity timestamp */
  lastActivity: number
  /** Manually reset the idle timer */
  resetTimer: () => void
  /** Start idle detection */
  start: () => void
  /** Stop idle detection */
  stop: () => void
}

/**
 * Custom hook for detecting user idle state
 */
export function useIdleDetection(options: UseIdleDetectionOptions = {}): UseIdleDetectionReturn {
  const {
    idleTimeout = 30000, // 30 seconds default
    events = ["mousemove", "mousedown", "keypress", "scroll", "touchstart", "click"],
    startOnMount = true,
    onIdle,
    onActive,
  } = options

  const [isIdle, setIsIdle] = useState(false)
  const [timeUntilIdle, setTimeUntilIdle] = useState(idleTimeout)
  const [lastActivity, setLastActivity] = useState(Date.now())
  
  const timeoutRef = useRef<NodeJS.Timeout>()
  const intervalRef = useRef<NodeJS.Timeout>()
  const isActiveRef = useRef(true)
  const startTimeRef = useRef(Date.now())

  const resetTimer = useCallback(() => {
    const now = Date.now()
    setLastActivity(now)
    startTimeRef.current = now
    setTimeUntilIdle(idleTimeout)

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set user as active if they were idle
    if (isIdle) {
      setIsIdle(false)
      isActiveRef.current = true
      onActive?.()
      console.log("🔄 User became active")
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setIsIdle(true)
      isActiveRef.current = false
      setTimeUntilIdle(0)
      onIdle?.()
      console.log("😴 User became idle")
    }, idleTimeout)
  }, [idleTimeout, isIdle, onIdle, onActive])

  const handleActivity = useCallback(() => {
    resetTimer()
  }, [resetTimer])

  const start = useCallback(() => {
    console.log("🎯 Starting idle detection")
    
    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Start countdown interval
    intervalRef.current = setInterval(() => {
      const now = Date.now()
      const elapsed = now - startTimeRef.current
      const remaining = Math.max(0, idleTimeout - elapsed)
      setTimeUntilIdle(remaining)
    }, 1000)

    // Initialize timer
    resetTimer()
  }, [events, handleActivity, idleTimeout, resetTimer])

  const stop = useCallback(() => {
    console.log("🛑 Stopping idle detection")
    
    // Remove event listeners
    events.forEach(event => {
      document.removeEventListener(event, handleActivity)
    })

    // Clear timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Reset state
    setIsIdle(false)
    setTimeUntilIdle(idleTimeout)
    isActiveRef.current = true
  }, [events, handleActivity, idleTimeout])

  // Start on mount if enabled
  useEffect(() => {
    if (startOnMount) {
      start()
    }

    return () => {
      stop()
    }
  }, [startOnMount, start, stop])

  // Update timeout when idleTimeout changes
  useEffect(() => {
    if (isActiveRef.current) {
      resetTimer()
    }
  }, [idleTimeout, resetTimer])

  return {
    isIdle,
    timeUntilIdle,
    lastActivity,
    resetTimer,
    start,
    stop,
  }
}
