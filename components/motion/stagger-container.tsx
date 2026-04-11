"use client"

import { type ReactNode, useRef } from "react"
import { motion, useInView } from "framer-motion"

type Direction = "up" | "left" | "right"

const getItemVariants = (direction: Direction) => {
  const offset: Record<Direction, Record<string, number>> = {
    up: { y: 20 },
    left: { x: -20 },
    right: { x: 20 },
  }

  return {
    hidden: { opacity: 0, ...offset[direction] },
    visible: { opacity: 1, x: 0, y: 0 },
  }
}

interface StaggerContainerProps {
  children: ReactNode
  staggerDelay?: number
  direction?: Direction
  className?: string
}

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className,
}: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: staggerDelay },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface StaggerItemProps {
  children: ReactNode
  direction?: Direction
  className?: string
}

export function StaggerItem({
  children,
  direction = "up",
  className,
}: StaggerItemProps) {
  return (
    <motion.div
      variants={getItemVariants(direction)}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
