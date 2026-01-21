"use client"

import * as React from "react"
import { motion, useSpring, useTransform } from "motion/react"

interface AnimatedNumberProps {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  duration?: number // ms
}

export function AnimatedNumber({ 
  value, 
  prefix = "", 
  suffix = "", 
  decimals = 0,
  duration = 500 
}: AnimatedNumberProps) {
  const spring = useSpring(value, { duration: duration })
  const display = useTransform(spring, (current) => {
    // Format number with thousand separators and fixed decimals
    const formatted = current.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    return `${prefix}${formatted}${suffix}`
  })

  React.useEffect(() => {
    spring.set(value)
  }, [value, spring])

  return <motion.span>{display}</motion.span>
}
