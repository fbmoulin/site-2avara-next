import type { MetadataRoute } from "next"
import { db } from "@/lib/db"
import { articles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const BASE_URL = "https://2avaraciveldecariacica.org"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/artigos`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/noticias`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
  ]

  let articlePages: MetadataRoute.Sitemap = []
  try {
    const slugs = await db
      .select({ slug: articles.slug, publishedAt: articles.publishedAt })
      .from(articles)
      .where(eq(articles.isPublished, true))

    articlePages = slugs.map((a) => ({
      url: `${BASE_URL}/artigos/${a.slug}`,
      lastModified: a.publishedAt ?? new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))
  } catch {
    // DB unavailable — return static pages only
  }

  return [...staticPages, ...articlePages]
}
