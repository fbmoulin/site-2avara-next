import * as z from "zod/v4"

// Browser error reports (lib/logger.ts). SPEC-PORTAL-001 R2.7: bounded body, rate limit, only the
// known detail keys and only the pathname of URLs in the log (no query string, fragment or host).
export const CLIENT_ERRORS_MAX_BYTES = 8192

const detail = z.union([z.string().max(500), z.number(), z.boolean()])

// Keys sent by lib/logger.ts and its callers. Any other key is dropped before logging.
const DataSchema = z.object({
  message: detail.optional(),
  reason: detail.optional(),
  source: z.string().max(2000).optional(),
  lineno: z.number().optional(),
  colno: z.number().optional(),
  status: z.number().optional(),
})

const LogEntrySchema = z.object({
  level: z.enum(["error", "warn"]),
  event: z.string().min(1).max(200),
  timestamp: z.string().max(50),
  url: z.string().max(2000),
  session_id: z.string().max(100),
  data: DataSchema.optional(),
})

export const BatchSchema = z.object({
  errors: z.array(LogEntrySchema).max(10),
})

export function pathnameOnly(value: string | undefined): string | undefined {
  if (value === undefined) return undefined
  try {
    return new URL(value, "https://portal.invalid").pathname
  } catch {
    return ""
  }
}
