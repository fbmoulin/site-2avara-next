"use client"

import { useLayoutEffect, useState, type RefObject } from "react"

/**
 * Scroll reveal without an animation library (SPEC-PORTAL-001 R3.3). The server HTML is always the
 * final, visible state ("shown"), so content reads without JavaScript (R2.3). After hydration, and
 * before the first paint, only blocks still below the viewport become "pending" (hidden by CSS);
 * they turn "revealed" when they scroll in, and the CSS transition animates them. Nothing is hidden
 * with prefers-reduced-motion or without IntersectionObserver.
 */
export type RevealState = "shown" | "pending" | "revealed"

export function useReveal(ref: RefObject<HTMLElement | null>): RevealState {
  const [state, setState] = useState<RevealState>("shown")

  useLayoutEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (element.getBoundingClientRect().top < window.innerHeight) return
    // Below the fold at hydration time: hide before paint, reveal when it enters the viewport.
    setState("pending")
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setState("revealed")
          observer.disconnect()
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return state
}
