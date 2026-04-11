"use client"

import { type ReactNode } from "react"
import { motion, useReducedMotion, type TargetAndTransition } from "framer-motion"

type Variant = "fade-up" | "fade-left" | "fade-right" | "scale-blur"

const variants: Record<Variant, { initial: TargetAndTransition; animate: TargetAndTransition }> = {
  "fade-up": {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
  "fade-left": {
    initial: { opacity: 0, x: -40 },
    animate: { opacity: 1, x: 0 },
  },
  "fade-right": {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
  },
  "scale-blur": {
    initial: { opacity: 0, scale: 1.05, filter: "blur(10px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  },
}

interface ScrollRevealProps {
  children: ReactNode
  variant?: Variant
  delay?: number
  duration?: number
  once?: boolean
  className?: string
}

export function ScrollReveal({
  children,
  variant = "fade-up",
  delay = 0,
  duration = 0.6,
  once = true,
  className,
}: ScrollRevealProps) {
  const prefersReduced = useReducedMotion()
  const v = variants[variant]

  return (
    <motion.div
      initial={prefersReduced ? v.animate : v.initial}
      whileInView={v.animate}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
