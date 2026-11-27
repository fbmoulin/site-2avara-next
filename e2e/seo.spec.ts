import { expect, test, type Page } from "@playwright/test"

// SPEC-PORTAL-001 R3.1: metadata, Open Graph, JSON-LD, sitemap and robots.
const SITE = "https://2avaraciveldecariacica.org"

// Reads a dotted path ("address.postalCode") from parsed JSON-LD.
function field(value: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], value)
}

async function jsonLd(page: Page) {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
  return blocks.map((block) => JSON.parse(block) as Record<string, unknown>)
}

test("home has canonical, Open Graph image and organization and FAQ structured data", async ({
  page,
}) => {
  await page.goto("/")
  await expect(page).toHaveTitle("2ª Vara Cível de Cariacica")
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", SITE)
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    `${SITE}/images/og-portal.jpg`,
  )
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "pt_BR")
  const data = await jsonLd(page)
  const org = data.find((item) => item["@type"] === "GovernmentOrganization")
  expect(field(org, "address.postalCode")).toBe("29151-230")
  expect(field(org, "telephone")).toBe("+55-27-3246-5641")
  expect(field(org, "location.openingHoursSpecification.opens")).toBe("12:00")
  const faq = data.find((item) => item["@type"] === "FAQPage")
  expect((field(faq, "mainEntity") as unknown[]).length).toBeGreaterThan(0)
  expect((await page.content()).toLowerCase()).not.toContain("portal oficial")
})

test("inner pages use the title template and their own canonical", async ({ page }) => {
  for (const [path, title] of [
    ["/noticias", "Notícias do TJES | 2ª Vara Cível de Cariacica"],
    ["/artigos", "Artigos | 2ª Vara Cível de Cariacica"],
    ["/pauta", "Pauta semanal de audiências | 2ª Vara Cível de Cariacica"],
  ]) {
    await page.goto(path)
    await expect(page).toHaveTitle(title)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${SITE}${path}`)
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", `${SITE}${path}`)
  }
})

test("article page has Article structured data", async ({ page }) => {
  await page.goto("/artigos/artigo-de-teste")
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${SITE}/artigos/artigo-de-teste`,
  )
  const article = (await jsonLd(page)).find((item) => item["@type"] === "Article")
  expect(field(article, "headline")).toBe("Artigo de teste")
  expect(field(article, "url")).toBe(`${SITE}/artigos/artigo-de-teste`)
  expect(field(article, "datePublished")).toBeTruthy()
})

test("sitemap lists the four fixed routes and the published article", async ({ request }) => {
  const response = await request.get("/sitemap.xml")
  expect(response.status()).toBe(200)
  const xml = await response.text()
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
  expect(urls).toEqual(
    expect.arrayContaining([
      SITE,
      `${SITE}/pauta`,
      `${SITE}/noticias`,
      `${SITE}/artigos`,
      `${SITE}/artigos/artigo-de-teste`,
    ]),
  )
  expect(urls.some((url) => url.includes("/admin") || url.includes("/login"))).toBe(false)
})

test("robots.txt keeps the panel out", async ({ request }) => {
  const text = await (await request.get("/robots.txt")).text()
  for (const path of ["/admin", "/login", "/api/"]) expect(text).toContain(`Disallow: ${path}`)
  expect(text).toContain(`Sitemap: ${SITE}/sitemap.xml`)
})

test("admin pages are not indexable", async ({ page }) => {
  await page.goto("/login")
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/)
})
