import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { FAQS } from "../lib/constants"

// SPEC-PORTAL-001 R3.2: FAQ with native <details>/<summary>; every answer in the server HTML.

test("every FAQ answer is in the server HTML, inside a <details>", async ({ request }) => {
  const html = await (await request.get("/")).text()
  const section = html.slice(html.indexOf('id="duvidas"'))
  expect(section).toContain("<details")
  for (const faq of FAQS) expect(section).toContain(faq.answer.replace(/"/g, "&quot;"))
})

test("questions open and close with the keyboard", async ({ page }) => {
  await page.goto("/")
  const faq = page.locator("#duvidas")
  const items = faq.locator("details")
  await expect(items).toHaveCount(FAQS.length)
  const first = items.first()
  const summary = first.locator("summary")
  await expect(first.getByText(FAQS[0].answer)).toBeHidden()
  await summary.focus()
  await page.keyboard.press("Enter")
  await expect(first).toHaveAttribute("open", "")
  await expect(first.getByText(FAQS[0].answer)).toBeVisible()
  await page.keyboard.press("Space")
  await expect(first).not.toHaveAttribute("open", "")
})

test("FAQ has no axe violations, closed and open", async ({ browser }) => {
  // Reduced motion: axe measures the final colors, not a fade-in frame.
  const context = await browser.newContext({ reducedMotion: "reduce" })
  const page = await context.newPage()
  await page.goto("/")
  const scan = () =>
    new AxeBuilder({ page })
      .include("#duvidas")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze()
  expect((await scan()).violations).toEqual([])
  await page.locator("#duvidas summary").first().click()
  expect((await scan()).violations).toEqual([])
  await context.close()
})
