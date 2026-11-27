import { cache } from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import { NewsPagination } from "@/components/news-pagination"
import { TJES_NEWS_URL } from "@/lib/constants"
import { getNewsPage, type NewsPage } from "@/lib/news"
import {
  NEWS_MAX_AGE_DAYS,
  NEWS_PAGE_PARAM,
  newsPageHref,
  parseNewsPage,
} from "@/lib/news-pagination"
import { pageMetadata } from "@/lib/seo"

// R3.5: 30 news per page (?pagina=N), only the last 90 days, every category (Q-5). The page reads
// searchParams, so it renders on each request; the query is small (one page and a count).
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

// One query per request for the metadata and the page. A database failure is a result, not an
// exception (R3.4): the page shows a notice.
const loadNewsPage = cache(async (page: number): Promise<NewsPage | null> => {
  try {
    return await getNewsPage(page)
  } catch {
    console.error("[noticias] read_failed")
    return null
  }
})

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = parseNewsPage((await searchParams)[NEWS_PAGE_PARAM])
  const base = pageMetadata({
    title: page > 1 ? `Notícias do TJES, página ${page}` : "Notícias do TJES",
    description: "Notícias recentes publicadas pelo Tribunal de Justiça do Espírito Santo (TJES).",
    path: newsPageHref(page),
  })
  const result = await loadNewsPage(page)
  // A page past the end has nothing to index.
  if (result && page > result.totalPages) return { ...base, robots: { index: false } }
  return base
}

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
})

// The card shows three lines at most; longer feed descriptions are cut on a word boundary.
const SUMMARY_MAX = 240
function summary(text: string) {
  if (text.length <= SUMMARY_MAX) return text
  return `${text.slice(0, SUMMARY_MAX).replace(/\s+\S*$/, "")}…`
}

export default async function NoticiasPage({ searchParams }: Props) {
  const page = parseNewsPage((await searchParams)[NEWS_PAGE_PARAM])
  const result = await loadNewsPage(page)

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Voltar ao início
      </Link>

      <h1 className="mb-2 text-3xl font-bold tracking-tight">Notícias do TJES</h1>
      <p className="mb-8 text-muted-foreground">
        Publicações dos últimos {NEWS_MAX_AGE_DAYS} dias. As anteriores estão no{" "}
        <a
          href={TJES_NEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline underline-offset-2"
        >
          site do TJES<span className="sr-only"> (abre em nova aba)</span>
        </a>
        .
      </p>

      {!result ? (
        <p role="alert" className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4">
          Não foi possível carregar as notícias agora. Consulte as publicações mais recentes no{" "}
          <a href={TJES_NEWS_URL} className="font-medium underline underline-offset-2">
            site do TJES
          </a>
          .
        </p>
      ) : result.totalItems === 0 ? (
        <p className="text-muted-foreground">Nenhuma notícia disponível no momento.</p>
      ) : result.items.length === 0 ? (
        <p role="status" className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4">
          Esta página não existe. A listagem tem {result.totalPages}{" "}
          {result.totalPages === 1 ? "página" : "páginas"}.{" "}
          <Link href={newsPageHref(1)} className="font-medium underline underline-offset-2">
            Ir para a primeira página
          </Link>
          .
        </p>
      ) : (
        <>
          <p className="sr-only" aria-live="polite">
            Página {result.page} de {result.totalPages}.
          </p>
          {/* Lean markup (R3.5): every card is repeated in the HTML and in the React payload. */}
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {result.items.map((item) => (
              <li key={item.id} className="flex flex-col rounded-xl border border-border p-5">
                {item.category && (
                  <p className="mb-2 text-xs font-semibold text-amber-800 uppercase">
                    {item.category}
                  </p>
                )}
                <h2 className="font-semibold">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-2 hover:underline"
                  >
                    {item.title}
                    <span className="sr-only"> (abre em nova aba)</span>
                  </a>
                </h2>
                {item.description && (
                  <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
                    {summary(item.description)}
                  </p>
                )}
                {item.publishedAt && (
                  <time
                    dateTime={item.publishedAt.toISOString()}
                    className="mt-3 text-xs text-muted-foreground"
                  >
                    {dateFormat.format(item.publishedAt)}
                  </time>
                )}
              </li>
            ))}
          </ul>
          <NewsPagination page={result.page} totalPages={result.totalPages} />
        </>
      )}
    </div>
  )
}
