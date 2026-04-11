import Link from "next/link"
import { BookOpen, ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-container"
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
    <section id="blog" className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <ScrollReveal variant="fade-up">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold tracking-wider text-amber-500 uppercase">
              Blog
            </p>
            <h2 className="flex items-center justify-center gap-3 text-3xl font-bold text-foreground md:text-4xl">
              <BookOpen className="size-8 text-amber-500" />
              Artigos e Publicações
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Conteúdos sobre Direito, inovação no Judiciário e informações
              relevantes para advogados e cidadãos.
            </p>
          </div>
        </ScrollReveal>

        {recentArticles.length > 0 ? (
          <StaggerContainer direction="left" className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {recentArticles.map((article) => (
              <StaggerItem key={article.id} direction="left">
              <Link
                key={article.id}
                href={`/artigos/${article.slug}`}
                className="group rounded-xl border border-border bg-background p-6 transition-all hover:border-amber-300 hover:shadow-lg"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600">
                    {article.category}
                  </span>
                  {article.publishedAt && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(article.publishedAt).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground group-hover:text-amber-600 transition-colors line-clamp-2">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="mb-4 text-sm text-muted-foreground line-clamp-3">
                    {article.excerpt}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Por {article.author}</p>
              </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted p-12 text-center">
            <BookOpen className="mx-auto mb-4 size-12 text-slate-300" />
            <h3 className="mb-2 text-lg font-semibold text-muted-foreground">
              Em breve
            </h3>
            <p className="text-sm text-muted-foreground">
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
