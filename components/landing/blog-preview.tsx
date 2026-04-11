import Link from "next/link"
import { BookOpen, ArrowRight } from "lucide-react"
import { db } from "@/lib/db"
import { articles } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"

export async function BlogPreview() {
  let recentArticles: {
    id: string
    title: string
    slug: string
    excerpt: string | null
    author: string
    category: string
    publishedAt: Date | null
  }[] = []

  try {
    recentArticles = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        author: articles.author,
        category: articles.category,
        publishedAt: articles.publishedAt,
      })
      .from(articles)
      .where(eq(articles.isPublished, true))
      .orderBy(desc(articles.publishedAt))
      .limit(3)
  } catch {
    // DB not available — show empty state
  }

  return (
    <section id="blog" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold tracking-wider text-amber-500 uppercase">
            Blog
          </p>
          <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
            Artigos e Publicações
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Conteúdos sobre Direito, inovação no Judiciário e informações
            relevantes para advogados e cidadãos.
          </p>
        </div>

        {recentArticles.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {recentArticles.map((article) => (
              <Link
                key={article.id}
                href={`/artigos/${article.slug}`}
                className="group rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-amber-300 hover:shadow-lg"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600">
                    {article.category}
                  </span>
                  {article.publishedAt && (
                    <span className="text-xs text-slate-400">
                      {new Date(article.publishedAt).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-2">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="mb-4 text-sm text-slate-600 line-clamp-3">
                    {article.excerpt}
                  </p>
                )}
                <p className="text-xs text-slate-400">Por {article.author}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <BookOpen className="mx-auto mb-4 size-12 text-slate-300" />
            <h3 className="mb-2 text-lg font-semibold text-slate-700">
              Em breve
            </h3>
            <p className="text-sm text-slate-500">
              Novos artigos e publicações serão disponibilizados em breve.
              Acompanhe esta seção para atualizações.
            </p>
          </div>
        )}

        {recentArticles.length > 0 && (
          <div className="mt-10 text-center">
            <Link
              href="/artigos"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Ver todos os artigos
              <ArrowRight className="size-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
