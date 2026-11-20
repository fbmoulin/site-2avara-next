import { db } from "./db"
import { news } from "./db/schema"
import { eq } from "drizzle-orm"

export const NEWS_FEED_URL = "https://www.tjes.jus.br/category/s1-front-page/ultimasnoticias/feed/"
export const NEWS_USER_AGENT = "Portal2aVaraCivelCariacica/1.0 (+https://2avaraciveldecariacica.org)"
const NEWS_ACCEPT = "application/rss+xml, application/xml;q=0.9, */*;q=0.8"
const MAX_ITEMS = 10

export interface NewsItem {
  externalId: string
  title: string
  link: string
  description: string | null
  category: string | null
  publishedAt: Date | null
}

export interface ScrapeResult {
  fetched: number
  inserted: number
  updated: number
  skipped: number
  errors: string[]
  failure?: "feed" | "database"
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
}

function decodeEntities(str: string): string {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (entity, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? entity)
}

/** Only https links on tjes.jus.br or one of its subdomains are stored and shown. */
export function isAllowedNewsLink(link: string): boolean {
  let url: URL
  try {
    url = new URL(link)
  } catch {
    return false
  }
  const host = url.hostname.toLowerCase()
  return (
    url.protocol === "https:" &&
    !url.username &&
    !url.password &&
    (host === "tjes.jus.br" || host.endsWith(".tjes.jus.br"))
  )
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null
  const date = new Date(value.trim())
  return Number.isNaN(date.getTime()) ? null : date
}

/** Parses RSS items. Items whose link is outside tjes.jus.br are counted as skipped. */
export function extractFromRss(xml: string): { items: NewsItem[]; skipped: number } {
  const items: NewsItem[] = []
  let skipped = 0
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xml)) !== null && items.length < MAX_ITEMS) {
    const content = match[1]
    const title = decodeEntities(content.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "").trim()
    const link = decodeEntities(content.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "").trim()
    if (!title || !isAllowedNewsLink(link)) {
      skipped++
      continue
    }
    const description = content.match(/<description>([\s\S]*?)<\/description>/)?.[1]
    const category = content.match(/<category[^>]*>([\s\S]*?)<\/category>/)?.[1]
    const guid = content.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1]
    const externalId =
      (guid ? decodeEntities(guid).trim() : "") || link.match(/[?&]p=(\d+)/)?.[1] || link

    items.push({
      externalId,
      title,
      link,
      description: description ? decodeEntities(description).trim() || null : null,
      category: category ? decodeEntities(category).trim() || null : null,
      publishedAt: parseDate(content.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]),
    })
  }

  return { items, skipped }
}

async function fetchFeed(): Promise<{ xml: string } | { error: string }> {
  try {
    const response = await fetch(NEWS_FEED_URL, {
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": NEWS_USER_AGENT, Accept: NEWS_ACCEPT },
    })
    if (!response.ok) {
      // Status and content type are enough to tell a block page (403/429/5xx) from a feed problem.
      return {
        error: `feed_http_${response.status} content_type=${response.headers.get("content-type") ?? "none"}`,
      }
    }
    return { xml: await response.text() }
  } catch (error) {
    const name = error instanceof Error ? error.name : "UnknownError"
    return { error: `feed_request_failed ${name}` }
  }
}

export async function scrapeNews(): Promise<ScrapeResult> {
  const result: ScrapeResult = { fetched: 0, inserted: 0, updated: 0, skipped: 0, errors: [] }

  const feed = await fetchFeed()
  if ("error" in feed) {
    result.errors.push(feed.error)
    result.failure = "feed"
    return result
  }

  const { items, skipped } = extractFromRss(feed.xml)
  result.fetched = items.length
  result.skipped = skipped
  if (items.length === 0) {
    result.errors.push(`feed_without_valid_items bytes=${feed.xml.length}`)
    result.failure = "feed"
    return result
  }

  try {
    // Batch-fetch existing news to avoid N+1 queries (max: 1 connection pool)
    const existingRows = await db
      .select({ externalId: news.externalId, title: news.title })
      .from(news)
    const existingMap = new Map(existingRows.map((r) => [r.externalId, r.title]))

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
        existingMap.set(item.externalId, item.title)
        result.inserted++
      } else if (existingTitle !== item.title) {
        await db
          .update(news)
          .set({ title: item.title, description: item.description })
          .where(eq(news.externalId, item.externalId))
        result.updated++
      }
    }
  } catch (error) {
    // SQL error text is not logged: it may carry query parameters.
    const name = error instanceof Error ? error.name : "UnknownError"
    result.errors.push(`database_failed ${name}`)
    result.failure = "database"
  }

  return result
}
