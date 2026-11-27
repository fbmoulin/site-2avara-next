// Listing rules and page helpers of /noticias (SPEC-PORTAL-001 R3.5), free of database imports.
export const NEWS_PAGE_SIZE = 30
export const NEWS_MAX_AGE_DAYS = 90
export const NEWS_PAGE_PARAM = "pagina"

/** "?pagina=N": a positive integer written in plain digits; anything else is the first page. */
export function parseNewsPage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw || !/^\d{1,6}$/.test(raw)) return 1
  const page = Number(raw)
  return page >= 1 ? page : 1
}

export function newsPageHref(page: number) {
  return page <= 1 ? "/noticias" : `/noticias?${NEWS_PAGE_PARAM}=${page}`
}

/**
 * Page numbers to link: first, last, and two around the current one; null marks a gap ("…").
 * Example: page 6 of 12 -> 1 … 4 5 6 7 8 … 12.
 */
export function paginationItems(page: number, totalPages: number): (number | null)[] {
  const pages = new Set([1, totalPages])
  for (let n = page - 2; n <= page + 2; n++) if (n >= 1 && n <= totalPages) pages.add(n)
  const sorted = [...pages].sort((a, b) => a - b)
  const result: (number | null)[] = []
  for (const n of sorted) {
    const previous = result.at(-1)
    if (typeof previous === "number" && n - previous > 1) result.push(null)
    result.push(n)
  }
  return result
}
