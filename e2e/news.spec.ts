import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

// SPEC-PORTAL-001 R3.5. Fixture (scripts/verify-local.ts): 35 news from the last 35 days in four
// categories, including "Criminal" (Q-5: no category filter), and one 100 days old.

test("first page: 30 news, newest first, pagination by links", async ({ page }) => {
  const response = await page.goto("/noticias")
  expect(response?.status()).toBe(200)
  const items = page.locator("main ul > li h2")
  await expect(items).toHaveCount(30)
  await expect(items.first().getByRole("link")).toHaveAccessibleName(
    "Notícia fictícia 0 (abre em nova aba)",
  )
  await expect(items.first().getByRole("link")).toHaveAttribute(
    "href",
    "https://www.tjes.jus.br/noticia-ficticia-0/",
  )
  await expect(page.locator("main").getByText("Criminal").first()).toBeVisible()
  const nav = page.getByRole("navigation", { name: "Paginação das notícias" })
  await expect(nav.getByRole("link", { name: "Página 1" })).toHaveAttribute("aria-current", "page")
  await expect(nav.getByRole("link", { name: /^Anterior/ })).toHaveCount(0)
  const next = nav.getByRole("link", { name: /^Próxima/ })
  await expect(next).toHaveAttribute("href", "/noticias?pagina=2")
  await next.click()
  await expect(page).toHaveURL("/noticias?pagina=2")
  await expect(items).toHaveCount(5)
  await expect(nav.getByRole("link", { name: "Página 2" })).toHaveAttribute("aria-current", "page")
  await expect(nav.getByRole("link", { name: /^Anterior/ })).toHaveAttribute("href", "/noticias")
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://2avaraciveldecariacica.org/noticias?pagina=2",
  )
})

test("news older than 90 days are not listed, here or on the home", async ({ page }) => {
  for (const path of ["/noticias", "/noticias?pagina=2", "/"]) {
    await page.goto(path)
    await expect(page.getByText("Notícia fictícia antiga")).toHaveCount(0)
  }
})

test("a page past the end explains and links to the first page", async ({ page }) => {
  await page.goto("/noticias?pagina=99")
  await expect(page.getByRole("status").filter({ hasText: "Esta página não existe" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Ir para a primeira página" })).toHaveAttribute(
    "href",
    "/noticias",
  )
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/)
})

test("invalid ?pagina falls back to the first page", async ({ page }) => {
  await page.goto("/noticias?pagina=abc")
  await expect(page.locator("main ul > li h2")).toHaveCount(30)
})

// verify:local serves the dev build, whose HTML is larger than production: a safe upper bound.
test("HTML of /noticias stays under 150 KB", async ({ request }) => {
  for (const path of ["/noticias", "/noticias?pagina=2"]) {
    const body = await (await request.get(path, { headers: { "accept-encoding": "identity" } })).body()
    expect(body.length).toBeLessThanOrEqual(150 * 1024)
  }
})

test("/noticias has no axe violations", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" })
  const page = await context.newPage()
  await page.goto("/noticias")
  const results = await new AxeBuilder({ page })
    .include("main")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(results.violations).toEqual([])
  await context.close()
})
