import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { news } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { scrapeNews } from "@/lib/news-scraper"
import { rejectUnauthorizedCron } from "@/lib/cron-auth"

const limitSchema = z.coerce.number().int().min(1).max(50).catch(10)

async function runCron(request: NextRequest) {
  const rejected = rejectUnauthorizedCron(request, "news_cron_misconfigured")
  if (rejected) return rejected

  const startedAt = Date.now()
  const result = await scrapeNews()
  const revalidated = result.inserted + result.updated > 0
  if (revalidated) {
    revalidatePath("/")
    revalidatePath("/noticias")
  }

  const entry = {
    event: "news_scrape",
    fetched: result.fetched,
    inserted: result.inserted,
    updated: result.updated,
    skipped: result.skipped,
    errors: result.errors,
    failure: result.failure ?? null,
    revalidated,
    durationMs: Date.now() - startedAt,
  }
  if (result.errors.length > 0) console.error(JSON.stringify(entry))
  else console.info(JSON.stringify(entry))

  const status = result.failure === "feed" ? 502 : result.failure === "database" ? 500 : 200
  return NextResponse.json(result, { status })
}

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("cron") === "true") return runCron(request)

  const limit = limitSchema.parse(request.nextUrl.searchParams.get("limit") ?? undefined)

  const items = await db
    .select()
    .from(news)
    .where(eq(news.isActive, true))
    .orderBy(desc(news.publishedAt))
    .limit(limit)

  return NextResponse.json(items)
}
