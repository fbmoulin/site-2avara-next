import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { news } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { scrapeNews } from "@/lib/news-scraper"

export async function GET(request: NextRequest) {
  const isCron = request.nextUrl.searchParams.get("cron") === "true"

  if (isCron) {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await scrapeNews()
    return NextResponse.json(result)
  }

  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 10, 50)

  const items = await db
    .select()
    .from(news)
    .where(eq(news.isActive, true))
    .orderBy(desc(news.publishedAt))
    .limit(limit)

  return NextResponse.json(items)
}
