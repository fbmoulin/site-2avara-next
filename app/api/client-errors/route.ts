import { NextResponse, type NextRequest } from "next/server"
import { BatchSchema, CLIENT_ERRORS_MAX_BYTES, pathnameOnly } from "@/lib/client-errors"
import { checkRateLimit, clientErrorRateLimit } from "@/lib/rate-limit"
import { readJsonBody, RequestBodyError } from "@/lib/request-body"

export async function POST(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  const ip = forwardedFor?.split(",")[0].trim() ?? "anonymous"
  const limit = await checkRateLimit(clientErrorRateLimit, ip)
  if (!limit.success) {
    return NextResponse.json(
      { error: limit.unavailable ? "Service unavailable" : "Too many requests" },
      { status: limit.unavailable ? 503 : 429 },
    )
  }

  let body: unknown
  try {
    body = await readJsonBody(request, CLIENT_ERRORS_MAX_BYTES)
  } catch (error) {
    const invalid = error instanceof RequestBodyError ? error : new RequestBodyError(400)
    return NextResponse.json({ error: invalid.message }, { status: invalid.status })
  }

  const result = BatchSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 })
  }

  for (const entry of result.data.errors) {
    const data = entry.data ?? {}
    const logData = {
      logger: "frontend",
      level: entry.level,
      event: entry.event,
      path: pathnameOnly(entry.url),
      session_id: entry.session_id,
      timestamp: entry.timestamp,
      ...data,
      ...(data.source !== undefined ? { source: pathnameOnly(data.source) } : {}),
    }
    if (entry.level === "error") console.error(JSON.stringify(logData))
    else console.warn(JSON.stringify(logData))
  }

  return new Response(null, { status: 204 })
}
