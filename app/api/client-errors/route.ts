import { NextResponse } from "next/server"
import * as z from "zod/v4"

const LogEntrySchema = z.object({
  level: z.enum(["error", "warn"]),
  event: z.string().min(1).max(200),
  timestamp: z.string(),
  url: z.string().max(2000),
  session_id: z.string().max(100),
  data: z.record(z.string(), z.unknown()).optional(),
})

const BatchSchema = z.object({
  errors: z.array(LogEntrySchema).max(10),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = BatchSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 422 })
    }

    for (const entry of result.data.errors) {
      const logData = {
        logger: "frontend",
        level: entry.level,
        event: entry.event,
        url: entry.url,
        session_id: entry.session_id,
        timestamp: entry.timestamp,
        ...(entry.data ?? {}),
      }

      if (entry.level === "error") {
        console.error(JSON.stringify(logData))
      } else {
        console.warn(JSON.stringify(logData))
      }
    }

    return new Response(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
}
