import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { db } from "@/lib/db"
import { articles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getPublishedArticle } from "@/lib/articles"
import { JsonLd } from "@/components/json-ld"
import { articleJsonLd, OG_IMAGE, pageMetadata } from "@/lib/seo"

// Safety net besides revalidatePath from the panel: a change shows within a minute (R2.10).
export const revalidate = 60

export async function generateStaticParams() {
  const items = await db
    .select({ slug: articles.slug })
    .from(articles)
    .where(eq(articles.isPublished, true))

  return items.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // Unpublished articles have no public metadata (title, excerpt, image) either.
  const article = await getPublishedArticle(slug)

  if (!article) {
    return { title: "Artigo não encontrado" }
  }

  const base = pageMetadata({
    title: article.title,
    description: article.excerpt ?? undefined,
    path: `/artigos/${article.slug}`,
  })
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "article" as const,
      ...(article.publishedAt ? { publishedTime: article.publishedAt.toISOString() } : {}),
      images: article.imageUrl ? [{ url: article.imageUrl, alt: article.title }] : [OG_IMAGE],
    },
  }
}

export default async function ArtigoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = await getPublishedArticle(slug)

  if (!article) {
    notFound()
  }

  const paragraphs = article.content.split("\n\n")

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <JsonLd data={articleJsonLd(article)} />
      <Link
        href="/artigos"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar aos artigos
      </Link>

      {article.imageUrl && (
        <div className="relative mb-8 h-64 overflow-hidden rounded-xl md:h-96">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      )}

      <header className="mb-8">
        <span className="mb-3 inline-block rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
          {article.category}
        </span>

        <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          {article.title}
        </h1>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{article.author}</span>
          <span aria-hidden="true">&middot;</span>
          {article.publishedAt && (
            <time>
              {new Date(article.publishedAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </time>
          )}
        </div>
      </header>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="mb-4 leading-relaxed text-foreground/90">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  )
}
