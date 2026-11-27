import { expect, test, type Locator } from "@playwright/test"

/**
 * WCAG contrast of the element's text against the first opaque background among its ancestors.
 * Colors go through a 1×1 canvas so oklch() and alpha are resolved by the browser itself.
 */
async function contrastRatio(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    let background = "rgb(255, 255, 255)"
    for (let node: Element | null = element; node; node = node.parentElement) {
      const color = getComputedStyle(node).backgroundColor
      if (color !== "transparent" && !/rgba\(.*,\s*0\)$/.test(color)) {
        background = color
        break
      }
    }
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const context = canvas.getContext("2d", { willReadFrequently: true })!
    const paint = (...colors: string[]) => {
      context.clearRect(0, 0, 1, 1)
      for (const color of colors) {
        context.fillStyle = color
        context.fillRect(0, 0, 1, 1)
      }
      return Array.from(context.getImageData(0, 0, 1, 1).data.slice(0, 3))
    }
    const luminance = (rgb: number[]) => {
      const [r, g, b] = rgb.map((value) => {
        const channel = value / 255
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const text = luminance(paint(background, getComputedStyle(element).color))
    const base = luminance(paint(background))
    return (Math.max(text, base) + 0.05) / (Math.min(text, base) + 0.05)
  })
}

test("footer has no privacy or terms placeholders and its credit meets 4.5:1", async ({ page }) => {
  await page.goto("/")
  const footer = page.locator("footer")
  await expect(footer).toContainText("Contato")
  for (const removed of ["Institucional", "Política de Privacidade", "Termos de Uso"])
    await expect(footer).not.toContainText(removed)

  const credit = footer.locator("p", { hasText: "Desenvolvido e publicado por Felipe Moulin" })
  await expect(footer).not.toContainText("Lex Intelligentia")
  const link = credit.getByRole("link", { name: "@felipemoulinjus" })
  await expect(link).toHaveAttribute("href", "https://www.instagram.com/felipemoulinjus/")
  expect(await contrastRatio(credit)).toBeGreaterThanOrEqual(4.5)
  expect(await contrastRatio(link)).toBeGreaterThanOrEqual(4.5)
})

test("contact form shows the data notice above the submit button and links it", async ({
  page,
}) => {
  await page.goto("/")
  const notice = page.locator("#contact-privacy-notice")
  const text =
    "Seus dados servem só para responder a esta mensagem. Dúvidas sobre proteção de dados: suporte@lexintelligentia.com.br."
  await expect(notice).toHaveText(text)
  await expect(
    notice.getByRole("link", { name: "suporte@lexintelligentia.com.br" }),
  ).toHaveAttribute("href", "mailto:suporte@lexintelligentia.com.br")
  await expect(page.locator("#contato").getByRole("checkbox")).toHaveCount(0)

  const submit = page.getByRole("button", { name: "Enviar Mensagem", exact: true })
  await expect(submit).toHaveAttribute("aria-describedby", "contact-privacy-notice")
  await expect(submit).toHaveAccessibleDescription(text)

  await notice.scrollIntoViewIfNeeded()
  const [noticeBox, submitBox] = [await notice.boundingBox(), await submit.boundingBox()]
  expect(noticeBox!.y + noticeBox!.height).toBeLessThanOrEqual(submitBox!.y)
  expect(await contrastRatio(notice)).toBeGreaterThanOrEqual(4.5)
  expect(await contrastRatio(notice.getByRole("link"))).toBeGreaterThanOrEqual(4.5)
})

// SPEC-PORTAL-001 R2.9.
test("every footer text meets 4.5:1 and a hidden h2 heads the footer h3s", async ({ page }) => {
  await page.goto("/")
  const footer = page.locator("footer")
  const texts = footer.locator("p, h3, a, span:not(.sr-only)")
  const count = await texts.count()
  expect(count).toBeGreaterThan(5)
  for (let index = 0; index < count; index++) {
    const element = texts.nth(index)
    if (!(await element.isVisible())) continue
    const ratio = await contrastRatio(element)
    expect(ratio, `${await element.textContent()}`).toBeGreaterThanOrEqual(4.5)
  }
  const heading = footer.getByRole("heading", { level: 2, name: "Informações do portal" })
  await expect(heading).toHaveClass(/sr-only/)
  const levels = await footer
    .getByRole("heading")
    .evaluateAll((headings) => headings.map((element) => element.tagName))
  expect(levels[0]).toBe("H2")
  expect(levels.slice(1).every((tag) => tag === "H3")).toBe(true)
  await expect(footer.getByRole("link", { name: "(27) 3246-5641" })).toHaveAttribute(
    "href",
    "tel:+552732465641",
  )
})

test("the map embed is centred on the Fórum de Cariacica", async ({ page }) => {
  await page.goto("/")
  const map = page.locator("#contato iframe")
  const src = new URL((await map.getAttribute("src"))!)
  expect(src.origin).toBe("https://www.google.com")
  expect(src.searchParams.get("q")).toBe("-20.3332,-40.3767")
  expect(src.searchParams.get("output")).toBe("embed")
  await expect(map).toHaveAttribute("title", /Fórum de Cariacica/)
})
