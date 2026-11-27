import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

// SPEC-PORTAL-001 R2.4: service cards are disclosures; collapsed content is out of reach.

test("collapsed cards keep their links out of the tab order and the accessibility tree", async ({
  page,
}) => {
  await page.goto("/")
  const services = page.locator("#servicos")
  const toggle = services.getByRole("button", { name: /^Audiências Virtuais/ })
  await expect(toggle).toHaveAttribute("aria-expanded", "false")
  const panel = page.locator(`#${await toggle.getAttribute("aria-controls")}`)
  await expect(panel).toBeHidden()
  await expect(services.getByRole("link", { name: "App Store (iOS)" })).toHaveCount(0)

  // Walk the section with Tab: no hidden link receives focus.
  await services.getByRole("link", { name: /Acessar Consulta Processual/ }).focus()
  const reached: string[] = []
  for (let step = 0; step < 8; step++) {
    await page.keyboard.press("Tab")
    reached.push(
      await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null
        return element?.getAttribute("href") ?? element?.textContent?.trim().slice(0, 30) ?? ""
      }),
    )
  }
  expect(reached.some((target) => target.includes("apps.apple.com"))).toBe(false)
  expect(reached.some((target) => target.includes("play.google.com"))).toBe(false)

  await toggle.press("Enter")
  await expect(toggle).toHaveAttribute("aria-expanded", "true")
  await expect(panel).toBeVisible()
  await page.keyboard.press("Tab")
  await expect(services.getByRole("link", { name: "App Store (iOS)" })).toBeFocused()
})

test("cards without expandable content are not buttons", async ({ page }) => {
  await page.goto("/")
  const services = page.locator("#servicos")
  for (const title of ["Consulta Processual", "Balcão Virtual"]) {
    await expect(services.getByRole("button", { name: new RegExp(`^${title}`) })).toHaveCount(0)
    await expect(services.getByRole("heading", { name: title, exact: true })).toBeVisible()
  }
  for (const title of ["Audiências Virtuais", "Solicitações e Agendamento"])
    await expect(services.getByRole("button", { name: new RegExp(`^${title}`) })).toHaveAttribute(
      "aria-controls",
      /service-panel-/,
    )
})

test("axe finds no violations in the service cards, collapsed and expanded", async ({ browser }) => {
  // Reduced motion shows the cards in their final state, so contrast is measured on the real colors
  // instead of a fade-in frame.
  const context = await browser.newContext({ reducedMotion: "reduce" })
  const page = await context.newPage()
  await page.goto("/")
  const scan = () =>
    new AxeBuilder({ page })
      .include("#servicos")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze()
  expect((await scan()).violations).toEqual([])
  for (const title of ["Audiências Virtuais", "Solicitações e Agendamento"]) {
    await page.locator("#servicos").getByRole("button", { name: new RegExp(`^${title}`) }).click()
    expect((await scan()).violations).toEqual([])
  }
  await context.close()
})
