"use client"

import { type CSSProperties, type ReactNode, useRef } from "react"
import { useReveal } from "./use-reveal"

type Variant = "fade-up" | "fade-left" | "fade-right" | "scale-blur"

interface ScrollRevealProps {
  children: ReactNode
  variant?: Variant
  delay?: number
  duration?: number
  /** Kept for compatibility: the reveal always happens once. */
  once?: boolean
  className?: string
}

// CSS reveal (app/globals.css, [data-reveal]); see useReveal for the states (R3.3).
export function ScrollReveal({
  children,
  variant = "fade-up",
  delay = 0,
  duration = 0.6,
  className,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const state = useReveal(ref)
  const style = {
    "--reveal-delay": `${delay}s`,
    "--reveal-duration": `${duration}s`,
  } as CSSProperties

  return (
    <div
      ref={ref}
      className={className}
      data-reveal={state}
      data-reveal-variant={variant}
      style={style}
    >
      {children}
    </div>
  )
}
