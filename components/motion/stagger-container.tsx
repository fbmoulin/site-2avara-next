"use client"

import { type ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"

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
  className?: string
}

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className,
}: StaggerContainerProps) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      initial={prefersReduced ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: prefersReduced ? 0 : staggerDelay },
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
