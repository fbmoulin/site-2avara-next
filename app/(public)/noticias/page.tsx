import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { db } from "@/lib/db"
import { news } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { pageMetadata } from "@/lib/seo"
import { TJES_NEWS_URL } from "@/lib/constants"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

export const revalidate = 3600

export const metadata = pageMetadata({
  title: "Notícias do TJES",
  description: "Notícias recentes publicadas pelo Tribunal de Justiça do Espírito Santo (TJES).",
  path: "/noticias",
})

type NewsItem = typeof news.$inferSelect

export default async function NoticiasPage() {
  // R3.4: a database failure shows a notice instead of the error page.
  let items: NewsItem[] = []
  let unavailable = false
  try {
    items = await db
      .select()
      .from(news)
      .where(eq(news.isActive, true))
      .orderBy(desc(news.publishedAt))
  } catch {
    unavailable = true
    console.error("[noticias] read_failed")
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar ao início
      </Link>

      <h1 className="mb-8 text-3xl font-bold tracking-tight">Notícias do TJES</h1>

      {unavailable ? (
        <p role="alert" className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4">
          Não foi possível carregar as notícias agora. Consulte as publicações mais recentes no{" "}
          <a href={TJES_NEWS_URL} className="font-medium underline underline-offset-2">
            site do TJES
          </a>
          .
        </p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma notícia disponível no momento.</p>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-col">
              <CardHeader>
                {item.category && (
                  <span className="w-fit rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
                    {item.category}
                  </span>
                )}
                <CardTitle className="font-semibold">{item.title}</CardTitle>
              </CardHeader>

              <CardContent className="flex-1">
                {item.description && (
                  <CardDescription className="line-clamp-3">{item.description}</CardDescription>
                )}
              </CardContent>

              <CardFooter className="flex items-center justify-between">
                {item.publishedAt && (
                  <time className="text-xs text-muted-foreground">
                    {new Date(item.publishedAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                )}
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-amber-500 transition-colors hover:text-amber-400"
                >
                  Ler mais
                  <ExternalLink className="size-3" />
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
