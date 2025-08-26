"use client"

import { useEffect, useRef, useState } from "react"

interface UseIntersectionObserverProps {
  onIntersect: () => void
  threshold?: number
  rootMargin?: string
  enabled?: boolean
}

export function useIntersectionObserver({
  onIntersect,
  threshold = 0.1,
  rootMargin = "100px",
  enabled = true,
}: UseIntersectionObserverProps) {
  const targetRef = useRef<HTMLDivElement>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const lastIntersectTime = useRef(0)

  useEffect(() => {
    const target = targetRef.current
    if (!target || !enabled) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setIsIntersecting(entry.isIntersecting)
        
        if (entry.isIntersecting) {
          // Debounce rapid intersection calls
          const now = Date.now()
          if (now - lastIntersectTime.current > 500) {
            lastIntersectTime.current = now
            onIntersect()
          }
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(target)

    return () => {
      observer.unobserve(target)
    }
  }, [onIntersect, threshold, rootMargin, enabled])

  return { targetRef, isIntersecting }
}

