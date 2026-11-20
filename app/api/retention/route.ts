import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { rejectUnauthorizedCron } from "@/lib/cron-auth"
import { purgeExpiredRecords, RETENTION_MONTHS } from "@/lib/retention"

/** Daily Vercel cron (vercel.json): deletes personal data older than the retention period. */
export async function GET(request: NextRequest) {
  const rejected = rejectUnauthorizedCron(request, "retention_cron_misconfigured")
  if (rejected) return rejected

  const startedAt = Date.now()
  try {
    const deleted = await purgeExpiredRecords()
    console.info(
      JSON.stringify({
        event: "data_retention",
        retentionMonths: RETENTION_MONTHS,
        deleted,
        durationMs: Date.now() - startedAt,
      }),
    )
    return NextResponse.json({ retentionMonths: RETENTION_MONTHS, deleted })
  } catch (error) {
    // Only the error name: driver messages can carry SQL text and parameters.
    const name = error instanceof Error ? error.name : "UnknownError"
    console.error(
      JSON.stringify({
        event: "data_retention",
        retentionMonths: RETENTION_MONTHS,
        failure: "database",
        error: name,
        durationMs: Date.now() - startedAt,
      }),
    )
    return NextResponse.json({ error: name }, { status: 500 })
  }
}
