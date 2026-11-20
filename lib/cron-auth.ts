import { createHash, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

/** Constant-time comparison; hashing first makes inputs of different lengths comparable. */
function secretMatches(received: string, expected: string): boolean {
  const a = createHash("sha256").update(received).digest()
  const b = createHash("sha256").update(expected).digest()
  return timingSafeEqual(a, b) && received.length === expected.length
}

/**
 * Guards Vercel cron routes with `Authorization: Bearer <CRON_SECRET>`.
 * Returns the refusal to send (503 without CRON_SECRET, 401 for any other header),
 * or `null` when the request may proceed. Fails closed.
 */
export function rejectUnauthorizedCron(
  request: Request,
  misconfiguredEvent: string,
): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET?.trim()
  if (!cronSecret) {
    console.error(JSON.stringify({ event: misconfiguredEvent, reason: "missing_cron_secret" }))
    return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 })
  }
  const authHeader = request.headers.get("authorization") ?? ""
  if (!secretMatches(authHeader, `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}
