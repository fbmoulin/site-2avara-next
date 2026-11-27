"use client"

import { MotionConfig } from "framer-motion"
import type { ReactNode } from "react"

// Follows the visitor's "reduce motion" setting for every framer-motion animation (R2.3).
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
