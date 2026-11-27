import Link from "next/link"
import { newsPageHref, paginationItems } from "@/lib/news-pagination"
import { cn } from "@/lib/utils"

const linkClass =
  "inline-flex h-11 min-w-11 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"

// R3.5: pagination by plain links (works without JavaScript, can be opened in a new tab and is
// read as a list of links). The current page is marked with aria-current.
export function NewsPagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Paginação das notícias" className="mt-10">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {page > 1 && (
          <li>
            <Link href={newsPageHref(page - 1)} rel="prev" className={linkClass}>
              Anterior<span className="sr-only">: página {page - 1}</span>
            </Link>
          </li>
        )}
        {paginationItems(page, totalPages).map((item, index) =>
          item === null ? (
            <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-muted-foreground">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={newsPageHref(item)}
                aria-current={item === page ? "page" : undefined}
                className={cn(
                  linkClass,
                  item === page && "border-slate-900 bg-slate-900 text-white hover:bg-slate-800",
                )}
              >
                <span className="sr-only">Página </span>
                {item}
              </Link>
            </li>
          ),
        )}
        {page < totalPages && (
          <li>
            <Link href={newsPageHref(page + 1)} rel="next" className={linkClass}>
              Próxima<span className="sr-only">: página {page + 1}</span>
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
