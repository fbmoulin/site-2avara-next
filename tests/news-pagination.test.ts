import { describe, expect, test } from "bun:test"
import { newsPageHref, paginationItems, parseNewsPage } from "../lib/news-pagination"

// SPEC-PORTAL-001 R3.5.
describe("news pagination helpers", () => {
  test("?pagina accepts only positive integers in digits", () => {
    expect(parseNewsPage(undefined)).toBe(1)
    expect(parseNewsPage("3")).toBe(3)
    expect(parseNewsPage(["2", "5"])).toBe(2)
    for (const invalid of ["0", "-1", "1.5", "abc", "1e3", " 2", "", "9999999"])
      expect(parseNewsPage(invalid)).toBe(1)
  })

  test("page 1 is the bare address; the others use ?pagina=N", () => {
    expect(newsPageHref(1)).toBe("/noticias")
    expect(newsPageHref(4)).toBe("/noticias?pagina=4")
  })

  test("page list keeps first, last and two neighbours, with gaps", () => {
    expect(paginationItems(1, 1)).toEqual([1])
    expect(paginationItems(1, 3)).toEqual([1, 2, 3])
    expect(paginationItems(6, 12)).toEqual([1, null, 4, 5, 6, 7, 8, null, 12])
    expect(paginationItems(12, 12)).toEqual([1, null, 10, 11, 12])
    expect(paginationItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })
})

test("listing against a disposable PGlite database", async () => {
  const child = Bun.spawn([process.execPath, "tests/fixtures/news-pagination.ts"], {
    stdout: "pipe",
    stderr: "pipe",
  })
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ])
  expect({ stdout, stderr, code }).toMatchObject({ code: 0 })
  for (const line of [
    "30 per page, newest first, only the last 90 days",
    "older than 90 days, inactive and stale undated items left out",
    "every category is listed (Q-5)",
    "a page past the end has no items",
    "home preview uses the same rule",
  ])
    expect(stdout).toContain(`verified: ${line}`)
}, 30000)
