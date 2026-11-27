import { cache } from "react"
import { and, eq } from "drizzle-orm"
import { db } from "./db"
import { articles } from "./db/schema"

// Public article lookup shared by the page and generateMetadata (one query per request): only
// published articles exist for visitors (SPEC-PORTAL-001 R2.10).
export const getPublishedArticle = cache(async (slug: string) => {
  const [article] = await db
    .select()
    .from(articles)
    .where(and(eq(articles.slug, slug), eq(articles.isPublished, true)))
    .limit(1)
  return article
})

// Paths to revalidate after an article changes: the lists and the page of every slug it had,
// so an edited or unpublished article leaves its old address too.
export function articleRevalidationPaths(...slugs: (string | null | undefined)[]) {
  const pages = [...new Set(slugs.filter((slug): slug is string => Boolean(slug)))].map(
    (slug) => `/artigos/${slug}`,
  )
  return ["/admin/artigos", "/artigos", "/", ...pages]
}
