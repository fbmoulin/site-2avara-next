import { db } from "./db"
import { news } from "./db/schema"
import { eq } from "drizzle-orm"

interface NewsItem {
  externalId: string
  title: string
  link: string
  description: string | null
  category: string | null
  publishedAt: Date | null
}

function decodeEntities(str: string): string {
  return str
    .replace(/&#8211;/g, "–")
    .replace(/&#8220;/g, "\u201C")
    .replace(/&#8221;/g, "\u201D")
    .replace(/&#8216;/g, "\u2018")
    .replace(/&#8217;/g, "\u2019")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/<[^>]*>/g, "")
}

function extractFromRss(xml: string): NewsItem[] {
  const items: NewsItem[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1]
    const title = content.match(/<title>([\s\S]*?)<\/title>/)?.[1] || ""
    const link = content.match(/<link>([\s\S]*?)<\/link>/)?.[1] || ""
    const description =
      content.match(/<description>([\s\S]*?)<\/description>/)?.[1] || ""
    const pubDate = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]
    const category =
      content.match(/<category[^>]*>([\s\S]*?)<\/category>/)?.[1] || null
    const guid =
      content.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1] ||
      link.match(/\?p=(\d+)/)?.[1] ||
      link

    items.push({
      externalId: decodeEntities(guid).trim(),
      title: decodeEntities(title).trim(),
      link: decodeEntities(link).trim(),
      description: description ? decodeEntities(description).trim() : null,
      category: category ? decodeEntities(category).trim() : null,
      publishedAt: pubDate ? new Date(pubDate) : null,
    })
  }

  return items.slice(0, 10)
}

export async function scrapeNews(): Promise<{
  inserted: number
  updated: number
  errors: string[]
}> {
  const errors: string[] = []
  let items: NewsItem[] = []

  // Strategy 1: Direct RSS
  try {
    const rssUrl =
      "https://www.tjes.jus.br/category/s1-front-page/ultimasnoticias/feed/"
    const response = await fetch(rssUrl, {
      signal: AbortSignal.timeout(15000),
    })
    if (response.ok) {
      const xml = await response.text()
      items = extractFromRss(xml)
    }
  } catch (e) {
    errors.push(`RSS direct failed: ${e instanceof Error ? e.message : String(e)}`)
  }

  // Strategy 2: Proxy via Jina
  if (items.length === 0) {
    try {
      const proxyUrl =
        "https://r.jina.ai/https://www.tjes.jus.br/category/s1-front-page/ultimasnoticias/feed/"
      const response = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(15000),
        headers: { Accept: "application/xml,text/xml" },
      })
      if (response.ok) {
        const xml = await response.text()
        items = extractFromRss(xml)
      }
    } catch (e) {
      errors.push(`RSS proxy failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  if (items.length === 0) {
    errors.push("All strategies failed, no items fetched")
    return { inserted: 0, updated: 0, errors }
  }

  // Batch-fetch all existing news to avoid N+1 queries (max: 1 connection pool)
  const existingRows = await db
    .select({ externalId: news.externalId, title: news.title })
    .from(news)
  const existingMap = new Map(existingRows.map((r) => [r.externalId, r.title]))

  let inserted = 0
  let updated = 0

  for (const item of items) {
    const existingTitle = existingMap.get(item.externalId)

    if (existingTitle === undefined) {
      await db.insert(news).values({
        externalId: item.externalId,
        title: item.title,
        link: item.link,
        description: item.description,
        category: item.category,
        publishedAt: item.publishedAt,
      })
      inserted++
    } else if (existingTitle !== item.title) {
      await db
        .update(news)
        .set({ title: item.title, description: item.description })
        .where(eq(news.externalId, item.externalId))
      updated++
    }
  }

  return { inserted, updated, errors }
}
