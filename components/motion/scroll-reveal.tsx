"use client"

import { type ReactNode, useRef } from "react"
import { motion, useInView, type TargetAndTransition } from "framer-motion"

type Variant = "fade-up" | "fade-left" | "fade-right" | "scale-blur"

const variants: Record<Variant, { hidden: TargetAndTransition; visible: TargetAndTransition }> = {
  "fade-up": {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-left": {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  "fade-right": {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  "scale-blur": {
    hidden: { opacity: 0, scale: 1.05, filter: "blur(10px)" },
    visible: { opacity: 1, scale: 1, filter: "blur(0px)" },
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
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once, amount: 0.2 })
  const v = variants[variant]

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={isInView ? "visible" : "hidden"}
      variants={{ hidden: v.hidden, visible: v.visible }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
