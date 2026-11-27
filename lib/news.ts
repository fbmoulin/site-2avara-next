import { and, count, desc, eq, sql } from "drizzle-orm"
import { db } from "./db"
import { news } from "./db/schema"

import { NEWS_MAX_AGE_DAYS, NEWS_PAGE_SIZE } from "./news-pagination"

// TJES news on the portal (SPEC-PORTAL-001 R3.5). Q-5 decided on 27/11/2026: every category is
// shown, without filtering criminal matters. Page helpers without the database: news-pagination.ts.
export { NEWS_MAX_AGE_DAYS, NEWS_PAGE_SIZE }

export type NewsListItem = Pick<
  typeof news.$inferSelect,
  "id" | "title" | "link" | "description" | "category" | "publishedAt"
>

/**
 * Active news no older than 90 days. The cut uses the database clock, like the retention routine;
 * an item without a publication date counts from when it was collected. Older items stay in the
 * table (the panel still lists them) but leave the public listing.
 */
export function recentNewsCondition() {
  return and(
    eq(news.isActive, true),
    // A fixed constant, not user input: written into the SQL as the interval literal.
    sql`coalesce(${news.publishedAt}, ${news.fetchedAt}) >= now() - ${sql.raw(`interval '${NEWS_MAX_AGE_DAYS} days'`)}`,
  )
}

// Newest first by the same date the 90-day cut uses (undated items by collection time).
const newestFirst = sql`coalesce(${news.publishedAt}, ${news.fetchedAt}) desc`

const listColumns = {
  id: news.id,
  title: news.title,
  link: news.link,
  description: news.description,
  category: news.category,
  publishedAt: news.publishedAt,
}

/** Latest recent items, for the home preview. */
export async function latestNews(limit: number): Promise<NewsListItem[]> {
  return db
    .select(listColumns)
    .from(news)
    .where(recentNewsCondition())
    .orderBy(newestFirst, desc(news.id))
    .limit(limit)
}

export interface NewsPage {
  items: NewsListItem[]
  page: number
  totalItems: number
  totalPages: number
}

/** One page of the /noticias listing. A page past the end comes back with no items. */
export async function getNewsPage(page: number): Promise<NewsPage> {
  const [{ total }] = await db.select({ total: count() }).from(news).where(recentNewsCondition())
  const totalPages = Math.max(1, Math.ceil(total / NEWS_PAGE_SIZE))
  const items =
    page > totalPages
      ? []
      : await db
          .select(listColumns)
          .from(news)
          .where(recentNewsCondition())
          .orderBy(newestFirst, desc(news.id))
          .limit(NEWS_PAGE_SIZE)
          .offset((page - 1) * NEWS_PAGE_SIZE)
  return { items, page, totalItems: total, totalPages }
}
