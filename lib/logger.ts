/**
 * Structured browser logger with sendBeacon transport.
 * Captures errors + warnings, batches up to 10, flushes via sendBeacon.
 * In development: console-only, no beacon transport.
 */

interface LogEntry {
  level: "error" | "warn"
  event: string
  timestamp: string
  url: string
  session_id: string
  data?: Record<string, unknown>
}

const SESSION_ID =
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

const MAX_BUFFER = 10
let buffer: LogEntry[] = []
let flushInterval: ReturnType<typeof setInterval> | null = null
let initialized = false

function createEntry(level: "error" | "warn", event: string, data?: Record<string, unknown>): LogEntry {
  return {
    level,
    event,
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : "",
    session_id: SESSION_ID,
    ...(data ? { data } : {}),
  }
}

function addToBuffer(entry: LogEntry) {
  buffer.push(entry)
  if (buffer.length > MAX_BUFFER) {
    buffer = buffer.slice(-MAX_BUFFER)
  }
}

function flush() {
  if (buffer.length === 0) return
  if (typeof navigator === "undefined" || !navigator.sendBeacon) return
  if (process.env.NODE_ENV === "development") return

  const payload = JSON.stringify({ errors: buffer })
  navigator.sendBeacon("/api/client-errors", new Blob([payload], { type: "application/json" }))
  buffer = []
}

export const log = {
  error(event: string, data?: Record<string, unknown>) {
    const entry = createEntry("error", event, data)
    console.error(`[logger] ${event}`, data ?? "")
    addToBuffer(entry)
  },

  warn(event: string, data?: Record<string, unknown>) {
    const entry = createEntry("warn", event, data)
    console.warn(`[logger] ${event}`, data ?? "")
    addToBuffer(entry)
  },
}

export function initLogger() {
  if (initialized || typeof window === "undefined") return
  initialized = true

  // Global error handler
  window.onerror = (message, source, lineno, colno) => {
    log.error("window_onerror", {
      message: String(message),
      source: source ?? "unknown",
      lineno: lineno ?? 0,
      colno: colno ?? 0,
    })
  }

  // Unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    log.error("unhandled_rejection", {
      reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
    })
  })

  // Flush on page hide (tab close, navigation)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush()
  })

  // Periodic flush every 5 seconds
  flushInterval = setInterval(flush, 5000)
}

// Test helpers
export function _resetLogger() {
  buffer = []
  initialized = false
  if (flushInterval) {
    clearInterval(flushInterval)
    flushInterval = null
  }
}

export function _getBuffer(): readonly LogEntry[] {
  return buffer
}
