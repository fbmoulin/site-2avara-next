"use client"

import { type CSSProperties, type ReactNode, useRef } from "react"
import { useReveal } from "./use-reveal"

type Direction = "up" | "left" | "right"

interface StaggerContainerProps {
  children: ReactNode
  staggerDelay?: number
  /** Kept for compatibility: each StaggerItem sets its own direction. */
  direction?: Direction
  className?: string
}

// The container decides when its items reveal; app/globals.css staggers them by position (R3.3).
export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className,
}: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const state = useReveal(ref)
  return (
    <div
      ref={ref}
      className={className}
      data-reveal-group={state}
      style={{ "--reveal-stagger": `${staggerDelay}s` } as CSSProperties}
    >
      {children}
    </div>
  )
}

interface StaggerItemProps {
  children: ReactNode
  direction?: Direction
  className?: string
}

export function StaggerItem({ children, direction = "up", className }: StaggerItemProps) {
  return (
    <div className={className} data-reveal="" data-reveal-item={direction}>
      {children}
    </div>
  )
}
