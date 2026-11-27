import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { hearingSuspensionNotice } from "../lib/hearing-schedule"

// SPEC-PORTAL-001 R3.7: first screen with four task shortcuts; R3.8: one event per shortcut.

const SHORTCUTS = [
  ["tenho_audiencia", "Tenho audiência", "Como entrar pelo Zoom", "/#audiencias-virtuais"],
  [
    "consultar_processo",
    "Consultar processo",
    "Portal de Serviços do PDPJ",
    "https://portaldeservicos.pdpj.jus.br/consulta",
  ],
  ["pauta_da_semana", "Pauta da semana", "Horários das audiências", "/pauta"],
  ["falar_com_a_vara", "Falar com a vara", "Balcão Virtual, telefone e e-mail", "/#contato"],
] as const

function shortcutLink(page: Page, title: string) {
  return page
    .getByRole("navigation", { name: "Atalhos" })
    .getByRole("link", { name: new RegExp(`^${title}`) })
}

// The analytics script only exists on Vercel; window.va (its queue entry point) is replaced by a
// recorder, as in e2e/analytics.spec.ts.
async function recordEvents(page: Page) {
  await page.addInitScript(() => {
    const events: unknown[] = []
    Object.assign(window, {
      __events: events,
      va: (kind: string, payload: unknown) => {
        if (kind === "event") events.push(payload)
      },
    })
  })
  return () => page.evaluate(() => (window as unknown as { __events: unknown[] }).__events)
}

async function headerBottom(page: Page) {
  const box = await page.locator("header").first().boundingBox()
  return box!.y + box!.height
}

test("server HTML has the title, the four shortcuts and the notice, with nothing hidden", async ({
  request,
}) => {
  const html = await (await request.get("/")).text()
  const start = html.indexOf('id="inicio"')
  expect(start).toBeGreaterThan(-1)
  const hero = html.slice(start, html.indexOf("</section>", start))
  const text = hero.replace(/<[^>]+>/g, "")
  expect(text).toContain("Como podemos ajudar?")
  expect(text).toContain("Escolha o que você precisa resolver hoje.")
  for (const [id, title, description, href] of SHORTCUTS) {
    expect(text).toContain(title)
    expect(text).toContain(description)
    expect(hero).toContain(`href="${href}"`)
    expect(hero).toContain(`data-shortcut="${id}"`)
  }
  // The suspension notice is under the shortcuts while it lasts, and gone after its date.
  const suspension = hearingSuspensionNotice()
  if (suspension) expect(text).toContain(suspension)
  else expect(text).not.toContain("Sem audiências designadas")
  expect(hero).not.toMatch(/opacity:\s*0/)
  expect(hero).not.toMatch(/animate-|data-reveal/)
})

test.describe("phone, 390×844", () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test("the four shortcuts are visible without scrolling, in a 2×2 grid", async ({ page }) => {
    await page.goto("/")
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    const boxes = []
    for (const [, title] of SHORTCUTS) {
      const link = shortcutLink(page, title)
      await expect(link).toBeVisible()
      await expect(link).toHaveCSS("opacity", "1")
      await expect(link).toBeInViewport({ ratio: 1 })
      const box = (await link.boundingBox())!
      expect(box.y + box.height).toBeLessThanOrEqual(844)
      expect(box.height).toBeGreaterThanOrEqual(44)
      expect(box.width).toBeGreaterThanOrEqual(44)
      boxes.push(box)
    }
    // Two per row.
    expect(Math.round(boxes[0].y)).toBe(Math.round(boxes[1].y))
    expect(Math.round(boxes[2].y)).toBe(Math.round(boxes[3].y))
    expect(boxes[2].y).toBeGreaterThan(boxes[0].y)
    // Line above the title on the phone, and the notice below the shortcuts, also on screen.
    const hero = page.locator("#inicio")
    const eyebrow = hero.locator("p").first()
    await expect(eyebrow).toBeVisible()
    // innerText follows CSS: the uppercase transform and the part hidden on the phone.
    await expect(eyebrow).toHaveText("COMARCA DE CARIACICA — ES", { useInnerText: true })
    const suspension = hearingSuspensionNotice()
    if (suspension) {
      const notice = hero.getByText(suspension)
      await expect(notice).toBeInViewport({ ratio: 1 })
      expect((await notice.boundingBox())!.y).toBeGreaterThan(boxes[3].y + boxes[3].height)
    }
    // Decorative icons are hidden from assistive technology.
    await expect(hero.locator("svg:not([aria-hidden='true'])")).toHaveCount(0)
    await expect(page.locator("#inicio h1")).toHaveText("Como podemos ajudar?")
    // The first screen ends with the hero: the Fórum photo below is not in it (LCP, R3.3).
    expect((await page.locator("#magistrado").boundingBox())!.y).toBeGreaterThanOrEqual(844 - 1)
  })

  test("the first screen and the header have no axe violations (WCAG 2.1 A/AA)", async ({
    page,
  }) => {
    await page.goto("/")
    const results = await new AxeBuilder({ page })
      .include("#inicio")
      .include("header")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze()
    expect(results.violations).toEqual([])
  })

  test("the shortcuts are reached with Tab, in order, with a visible focus", async ({ page }) => {
    await page.goto("/")
    const first = shortcutLink(page, "Tenho audiência")
    await first.focus()
    await expect(first).toHaveCSS("outline-style", "solid")
    for (const [, title] of SHORTCUTS.slice(1)) {
      await page.keyboard.press("Tab")
      await expect(shortcutLink(page, title)).toBeFocused()
    }
  })

  test("the bigger site name fits next to the menu button on one line", async ({ page }) => {
    await page.goto("/")
    const name = page.locator("header").getByText("2ª Vara Cível de Cariacica", { exact: true })
    await expect(name).toHaveCSS("font-size", "20px")
    const box = (await name.boundingBox())!
    expect(box.height).toBeLessThan(20 * 1.6)
    const toggle = page.getByRole("button", { name: "Abrir menu" })
    await expect(toggle).toBeInViewport({ ratio: 1 })
    const button = (await toggle.boundingBox())!
    expect(box.x + box.width).toBeLessThanOrEqual(button.x)
    expect(button.width).toBeGreaterThanOrEqual(44)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
    // The mobile menu still opens and closes.
    await toggle.click()
    await expect(page.locator("#mobile-navigation")).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page.locator("#mobile-navigation")).toHaveCount(0)
  })
})

for (const width of [1024, 1280]) {
  test(`at ${width} px the shortcuts are in one row and the menu stays on one line`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.goto("/")
    const tops = []
    for (const [, title] of SHORTCUTS) {
      const link = shortcutLink(page, title)
      await expect(link).toBeInViewport({ ratio: 1 })
      tops.push(Math.round((await link.boundingBox())!.y))
    }
    expect(new Set(tops).size).toBe(1)
    expect((await page.locator("#magistrado").boundingBox())!.y).toBeGreaterThanOrEqual(800 - 1)
    await expect(
      page.locator("#inicio").getByText("2ª Vara Cível — Comarca de Cariacica — ES"),
    ).toBeVisible()
    const name = page.locator("header").getByText("2ª Vara Cível de Cariacica", { exact: true })
    await expect(name).toHaveCSS("font-size", width >= 1280 ? "24px" : "20px")
    const menu = page.getByRole("navigation", { name: "Menu principal" })
    const items = await menu.getByRole("link").all()
    expect(items).toHaveLength(8)
    const rows = new Set<number>()
    for (const item of items) rows.add(Math.round((await item.boundingBox())!.y))
    expect(rows.size).toBe(1)
    const nameBox = (await name.boundingBox())!
    const firstItem = (await items[0].boundingBox())!
    expect(nameBox.x + nameBox.width).toBeLessThanOrEqual(firstItem.x)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    )
  })
}

test.describe("navigation and events", () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('"Tenho audiência" opens the virtual hearings card with the Zoom video', async ({
    page,
  }) => {
    const events = await recordEvents(page)
    await page.goto("/")
    await shortcutLink(page, "Tenho audiência").click()
    await expect(page).toHaveURL(/\/#audiencias-virtuais$/)
    const card = page.locator("#audiencias-virtuais")
    const toggle = card.getByRole("button", { name: /^Audiências Virtuais/ })
    await expect(toggle).toHaveAttribute("aria-expanded", "true")
    await expect(card.locator("video")).toBeVisible()
    await expect
      .poll(async () => (await card.boundingBox())!.y)
      .toBeGreaterThanOrEqual((await headerBottom(page)) - 2)
    await expect(toggle).toBeInViewport()
    expect(await events()).toEqual([
      { name: "home_shortcut", data: { shortcut: "tenho_audiencia" }, options: undefined },
    ])

    // Closed by hand, the same shortcut opens it again (the hash does not change).
    await toggle.click()
    await expect(toggle).toHaveAttribute("aria-expanded", "false")
    await page.evaluate(() => window.scrollTo(0, 0))
    await shortcutLink(page, "Tenho audiência").click()
    await expect(toggle).toHaveAttribute("aria-expanded", "true")
    expect(await events()).toHaveLength(2)
  })

  test("arriving at /#audiencias-virtuais opens the card", async ({ page }) => {
    await page.goto("/#audiencias-virtuais")
    await expect(
      page.locator("#audiencias-virtuais").getByRole("button", { name: /^Audiências Virtuais/ }),
    ).toHaveAttribute("aria-expanded", "true")
  })

  test('"Consultar processo" opens the public case lookup in a new tab', async ({
    page,
    context,
  }) => {
    // Never reach the real site from the tests.
    await context.route("https://portaldeservicos.pdpj.jus.br/**", (route) =>
      route.fulfill({ status: 200, contentType: "text/html", body: "<title>consulta</title>" }),
    )
    const events = await recordEvents(page)
    await page.goto("/")
    const link = shortcutLink(page, "Consultar processo")
    await expect(link).toHaveAttribute("href", "https://portaldeservicos.pdpj.jus.br/consulta")
    await expect(link).toHaveAttribute("target", "_blank")
    await expect(link).toHaveAttribute("rel", "noopener noreferrer")
    await expect(link).toHaveAccessibleName(/\(abre em nova aba\)$/)
    const [popup] = await Promise.all([page.waitForEvent("popup"), link.click()])
    await expect(popup).toHaveURL("https://portaldeservicos.pdpj.jus.br/consulta")
    expect(await events()).toEqual([
      { name: "home_shortcut", data: { shortcut: "consultar_processo" }, options: undefined },
    ])
  })

  test('"Pauta da semana" goes to /pauta', async ({ page }) => {
    const events = await recordEvents(page)
    await page.goto("/")
    await shortcutLink(page, "Pauta da semana").click()
    await expect(page).toHaveURL(/\/pauta$/)
    await expect(
      page.getByRole("heading", { level: 1, name: "Pauta semanal de audiências" }),
    ).toBeVisible()
    const suspension = hearingSuspensionNotice()
    if (suspension) await expect(page.getByText(suspension)).toBeVisible()
    expect(await events()).toEqual([
      { name: "home_shortcut", data: { shortcut: "pauta_da_semana" }, options: undefined },
    ])
  })

  test('"Falar com a vara" goes to the contact section', async ({ page }) => {
    const events = await recordEvents(page)
    await page.goto("/")
    await shortcutLink(page, "Falar com a vara").click()
    await expect(page).toHaveURL(/\/#contato$/)
    const contact = page.locator("#contato")
    await expect(contact).toBeInViewport()
    await expect
      .poll(async () => (await contact.boundingBox())!.y)
      .toBeGreaterThanOrEqual((await headerBottom(page)) - 2)
    expect(await events()).toEqual([
      { name: "home_shortcut", data: { shortcut: "falar_com_a_vara" }, options: undefined },
    ])
  })
})
