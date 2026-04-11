import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { db } from "@/lib/db"
import { articles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

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
  const [article] = await db
    .select({ title: articles.title })
    .from(articles)
    .where(eq(articles.slug, slug))
    .limit(1)

  if (!article) {
    return { title: "Artigo não encontrado" }
  }

  return { title: article.title }
}

export default async function ArtigoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [article] = await db
    .select()
    .from(articles)
    .where(eq(articles.slug, slug))
    .limit(1)

  if (!article || !article.isPublished) {
    notFound()
  }

  const paragraphs = article.content.split("\n\n")

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <Link
        href="/artigos"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar aos artigos
      </Link>

      {article.imageUrl && (
        <div className="mb-8 overflow-hidden rounded-xl">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="h-64 w-full object-cover md:h-96"
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
