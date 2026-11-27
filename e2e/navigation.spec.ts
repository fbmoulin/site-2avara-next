import { expect, test, type Page } from "@playwright/test"

// SPEC-PORTAL-001 R2.2: the menu works from every public route and the mobile menu is a
// proper disclosure (Esc, click outside, navigation, scroll lock, focus trap and return).

async function headerBottom(page: Page) {
  const box = await page.locator("header").first().boundingBox()
  return box!.y + box!.height
}

test.describe("desktop menu", () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  for (const [from, label, url, target] of [
    ["/noticias", "Contato", /\/#contato$/, "#contato"],
    ["/artigos", "Serviços", /\/#servicos$/, "#servicos"],
    ["/pauta", "Dúvidas", /\/#duvidas$/, "#duvidas"],
  ] as const) {
    test(`from ${from}, "${label}" reaches its home section below the header`, async ({ page }) => {
      await page.goto(from)
      const menu = page.getByRole("navigation", { name: "Menu principal" })
      await menu.getByRole("link", { name: label, exact: true }).click()
      await expect(page).toHaveURL(url)
      const section = page.locator(target)
      await expect(section).toBeInViewport()
      // scroll-margin-top keeps the section title out from under the sticky header.
      await expect
        .poll(async () => (await section.boundingBox())!.y)
        .toBeGreaterThanOrEqual((await headerBottom(page)) - 2)
    })
  }

  test("route links reach Pauta, Notícias and Artigos and mark the current page", async ({
    page,
  }) => {
    await page.goto("/")
    const menu = page.getByRole("navigation", { name: "Menu principal" })
    for (const [label, path, heading] of [
      ["Pauta", "/pauta", "Pauta semanal de audiências"],
      ["Notícias", "/noticias", "Notícias do TJES"],
      ["Artigos", "/artigos", "Artigos"],
    ] as const) {
      await menu.getByRole("link", { name: label, exact: true }).click()
      await expect(page).toHaveURL(path)
      await expect(page.getByRole("heading", { level: 1, name: heading, exact: true })).toBeVisible()
      await expect(menu.getByRole("link", { name: label, exact: true })).toHaveAttribute(
        "aria-current",
        "page",
      )
    }
  })
})

test.describe("mobile menu at 390 px", () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test("Esc closes it, focus is trapped while open and returns to the button", async ({ page }) => {
    await page.goto("/noticias")
    const toggle = page.getByRole("button", { name: "Abrir menu" })
    await toggle.click()
    const close = page.getByRole("button", { name: "Fechar menu" })
    await expect(close).toHaveAttribute("aria-expanded", "true")
    const menu = page.locator("#mobile-navigation")
    await expect(menu).toBeVisible()
    // Opaque background: no alpha channel in the computed color (bg-slate-900, not /75).
    const background = await menu.evaluate((element) => getComputedStyle(element).backgroundColor)
    expect(background).not.toMatch(/\/|rgba|transparent/)
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden")

    const links = menu.getByRole("link")
    const count = await links.count()
    await close.focus()
    for (let step = 0; step < count + 1; step++) await page.keyboard.press("Tab")
    // After every link, Tab wraps to the toggle instead of leaving the menu.
    await expect(close).toBeFocused()
    await page.keyboard.press("Shift+Tab")
    await expect(links.last()).toBeFocused()

    await page.keyboard.press("Escape")
    await expect(menu).toHaveCount(0)
    await expect(toggle).toBeFocused()
    await expect(toggle).toHaveAttribute("aria-expanded", "false")
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("")
  })

  test("growing to the desktop breakpoint closes it and releases scroll and focus", async ({
    page,
  }) => {
    await page.goto("/pauta")
    await page.getByRole("button", { name: "Abrir menu" }).click()
    await expect(page.locator("#mobile-navigation")).toBeVisible()
    await page.setViewportSize({ width: 1280, height: 844 })
    await expect(page.locator("#mobile-navigation")).toHaveCount(0)
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("")
    await page.keyboard.press("Tab")
    await expect(page.locator(":focus")).toBeVisible()
  })

  test("a click outside closes it", async ({ page }) => {
    await page.goto("/pauta")
    await page.getByRole("button", { name: "Abrir menu" }).click()
    await expect(page.locator("#mobile-navigation")).toBeVisible()
    await page.mouse.click(200, 800)
    await expect(page.locator("#mobile-navigation")).toHaveCount(0)
  })

  test("navigating closes it, to a route and to a home section", async ({ page }) => {
    await page.goto("/artigos")
    await page.getByRole("button", { name: "Abrir menu" }).click()
    await page.locator("#mobile-navigation").getByRole("link", { name: "Notícias" }).click()
    await expect(page).toHaveURL("/noticias")
    await expect(page.locator("#mobile-navigation")).toHaveCount(0)

    await page.getByRole("button", { name: "Abrir menu" }).click()
    await page.locator("#mobile-navigation").getByRole("link", { name: "Contato" }).click()
    await expect(page).toHaveURL(/\/#contato$/)
    await expect(page.locator("#mobile-navigation")).toHaveCount(0)
    await expect(page.locator("#contato")).toBeInViewport()
  })
})
