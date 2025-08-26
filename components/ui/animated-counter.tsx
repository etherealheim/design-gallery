"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

interface AnimatedCounterProps {
  value: number
  className?: string
}

interface AnimatedDigitProps {
  digit: string
  position: number
  overallDirection: 'up' | 'down'
}

function AnimatedDigit({ digit, position, overallDirection }: AnimatedDigitProps) {
  const [currentDigit, setCurrentDigit] = useState(digit)
  const [direction, setDirection] = useState<'up' | 'down'>('up')

  useEffect(() => {
    if (digit !== currentDigit) {
      // For rollovers (like 9→0), use the overall direction instead of individual digit comparison
      const oldNum = parseInt(currentDigit) || 0
      const newNum = parseInt(digit) || 0
      
      // Check if this is a rollover case (9→0 when counting up, or 0→9 when counting down)
      const isRollover = (oldNum === 9 && newNum === 0 && overallDirection === 'up') ||
                        (oldNum === 0 && newNum === 9 && overallDirection === 'down')
      
      if (isRollover) {
        setDirection(overallDirection)
      } else {
        setDirection(newNum > oldNum ? 'up' : 'down')
      }
      
      // Update digit immediately - no delay needed
      setCurrentDigit(digit)
    }
  }, [digit, currentDigit, overallDirection])

  const variants = {
    initial: {
      y: direction === 'up' ? 16 : -16,
      opacity: 0,
    },
    animate: {
      y: 0,
      opacity: 1,
    },
    exit: {
      y: direction === 'up' ? -16 : 16,
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
            duration: 0.2
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
  const [prevValue, setPrevValue] = useState(value)
  
  useEffect(() => {
    setPrevValue(value)
  }, [value])

  // Determine overall direction based on value change
  const overallDirection: 'up' | 'down' = value >= prevValue ? 'up' : 'down'
  
  // Convert number to string - no padding needed, let it be natural
  const digits = value.toString().split('')

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      {digits.map((digit, index) => (
        <AnimatedDigit
          key={`pos-${index}-${digits.length}`} // Unique key per position and total length
          digit={digit}
          position={index}
          overallDirection={overallDirection}
        />
      ))}
    </div>
  )
}
