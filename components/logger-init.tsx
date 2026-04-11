"use client"

import { useEffect } from "react"
import { initLogger } from "@/lib/logger"

export function LoggerInit() {
  useEffect(() => {
    initLogger()
  }, [])

  return null
}
