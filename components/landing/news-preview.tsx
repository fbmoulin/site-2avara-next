import { db } from "@/lib/db"
import { news } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { ExternalLink, Newspaper } from "lucide-react"
import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-container"
import { FALLBACK_NEWS } from "@/lib/constants"
import Link from "next/link"

export async function NewsPreview() {
  let articles: {
    id: string
    title: string
    link: string
    description: string | null
    category: string | null
    publishedAt: Date | null
  }[] = []

  try {
    articles = await db
      .select()
      .from(news)
      .where(eq(news.isActive, true))
      .orderBy(desc(news.publishedAt))
      .limit(6)
  } catch {
    // DB unavailable - will use fallback
  }

  const hasArticles = articles.length > 0

  return (
    <section className="bg-muted py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <ScrollReveal variant="fade-up">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold tracking-wider text-amber-500 uppercase">
              Informativo
            </p>
            <h2 className="flex items-center justify-center gap-3 text-3xl font-bold text-foreground md:text-4xl">
              <Newspaper className="size-8 text-amber-500" />
              Notícias e Avisos
            </h2>
            <p className="mt-4 text-muted-foreground">
              Fique por dentro das últimas novidades do TJES e desta vara.
            </p>
          </div>
        </ScrollReveal>

        {hasArticles ? (
          <StaggerContainer direction="up" className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <StaggerItem key={article.id}>
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-xl border border-border bg-background p-6 transition-shadow hover:shadow-md"
              >
                {article.category && (
                  <span className="mb-3 inline-block w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    {article.category}
                  </span>
                )}
                <h3 className="mb-3 text-base font-semibold text-foreground line-clamp-2 group-hover:text-amber-600 transition-colors">
                  {article.title}
                </h3>
                {article.publishedAt && (
                  <p className="mt-auto text-xs text-muted-foreground">
                    {new Date(article.publishedAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-1 text-sm font-medium text-amber-600">
                  Ler mais
                  <ExternalLink className="size-3.5" />
                </div>
              </a>
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          /* Fallback state */
          <StaggerContainer direction="up" className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {FALLBACK_NEWS.map((item) => (
              <StaggerItem key={item.id}>
              <div className="flex flex-col rounded-xl border border-border bg-background p-6">
                <span className="mb-3 inline-block w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  {item.category}
                </span>
                <h3 className="mb-2 text-base font-semibold text-foreground line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.summary}
                </p>
                <p className="mt-auto pt-3 text-xs text-muted-foreground">
                  {item.date}
                </p>
              </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/noticias"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            <Newspaper className="size-4" />
            Ver todas as notícias
          </Link>
        </div>
      </div>
    </section>
  )
}
