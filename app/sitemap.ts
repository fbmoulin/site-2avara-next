import type { MetadataRoute } from "next"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { articles } from "@/lib/db/schema"
import { absoluteUrl, FIXED_PUBLIC_ROUTES } from "@/lib/seo"

// R3.1: the four fixed public routes plus the published articles, regenerated every hour (the
// panel also revalidates the article pages when they change).
export const revalidate = 3600

const FIXED_ROUTE_DETAILS: Record<
  (typeof FIXED_PUBLIC_ROUTES)[number],
  Pick<MetadataRoute.Sitemap[number], "changeFrequency" | "priority">
> = {
  "/": { changeFrequency: "weekly", priority: 1 },
  "/pauta": { changeFrequency: "weekly", priority: 0.9 },
  "/noticias": { changeFrequency: "daily", priority: 0.7 },
  "/artigos": { changeFrequency: "weekly", priority: 0.8 },
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixedPages: MetadataRoute.Sitemap = FIXED_PUBLIC_ROUTES.map((path) => ({
    url: absoluteUrl(path),
    ...FIXED_ROUTE_DETAILS[path],
  }))

  let articlePages: MetadataRoute.Sitemap = []
  try {
    const published = await db
      .select({
        slug: articles.slug,
        publishedAt: articles.publishedAt,
        updatedAt: articles.updatedAt,
      })
      .from(articles)
      .where(eq(articles.isPublished, true))

    articlePages = published.map((article) => ({
      url: absoluteUrl(`/artigos/${article.slug}`),
      lastModified: article.updatedAt ?? article.publishedAt ?? undefined,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))
  } catch {
    // Database unavailable: publish the fixed routes only.
    console.error("[sitemap] read_failed")
  }

  return [...fixedPages, ...articlePages]
}
