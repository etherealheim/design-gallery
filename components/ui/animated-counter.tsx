"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState, useRef } from "react"

interface AnimatedCounterProps {
  value: number
  className?: string
}

interface AnimatedDigitProps {
  digit: string
  position: number
  overallDirection: 'up' | 'down'
  delay?: number
}

function AnimatedDigit({ digit, position, overallDirection, delay = 0 }: AnimatedDigitProps) {
  const [currentDigit, setCurrentDigit] = useState(digit)

  useEffect(() => {
    if (digit !== currentDigit) {
      // Update digit when it changes - direction is handled directly via overallDirection
      setCurrentDigit(digit)
    }
  }, [digit, currentDigit])

  // Use overallDirection directly in variants to avoid state synchronization issues
  const variants = {
    initial: {
      y: overallDirection === 'up' ? 16 : -16,
      opacity: 0,
    },
    animate: {
      y: 0,
      opacity: 1,
    },
    exit: {
      y: overallDirection === 'up' ? -16 : 16,
      opacity: 0,
    }
  }

  return (
    <div className="relative inline-block w-[1ch] h-[1.2em] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.span
          key={currentDigit}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{
            type: "spring",
            stiffness: 600,
            damping: 30,
            mass: 0.4,
            duration: 0.2,
            delay: delay,
            opacity: {
              duration: 0.15,
              ease: "easeInOut"
            }
          }}
          className="absolute inset-0 flex items-center justify-center tabular-nums"
        >
          {currentDigit}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

export function AnimatedCounter({ value, className = "" }: AnimatedCounterProps) {
  const prevValueRef = useRef(value)
  const [overallDirection, setOverallDirection] = useState<'up' | 'down'>('up')
  
  useEffect(() => {
    if (value !== prevValueRef.current) {
      // Use ref for more reliable direction detection during rapid updates
      const direction = value > prevValueRef.current ? 'up' : 'down'
      setOverallDirection(direction)
      prevValueRef.current = value
    }
  }, [value])
  
  // Convert number to string - no padding needed, let it be natural
  const digits = value.toString().split('')
  const prevDigits = prevValueRef.current.toString().split('')
  
  // Calculate which digits have changed to determine delay
  const changedDigits = digits.map((digit, index) => {
    const prevDigit = prevDigits[index] || ''
    return digit !== prevDigit
  })
  
  // Count total changed digits for cascading effect
  const totalChangedDigits = changedDigits.filter(Boolean).length
  
  // Only apply cascading delay if 2+ digits are changing
  const shouldCascade = totalChangedDigits >= 2

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      {digits.map((digit, index) => {
        // Calculate delay: cascade from right to left (units, tens, hundreds, etc.)
        // Only apply delay if this digit changed and we should cascade
        let delay = 0
        if (shouldCascade && changedDigits[index]) {
          const rightToLeftIndex = digits.length - 1 - index
          delay = rightToLeftIndex * 0.05 // 50ms delay between each digit
        }
        
        return (
          <AnimatedDigit
            key={`pos-${index}-${digits.length}`} // Unique key per position and total length
            digit={digit}
            position={index}
            overallDirection={overallDirection}
            delay={delay}
          />
        )
      })}
    </div>
  )
}
