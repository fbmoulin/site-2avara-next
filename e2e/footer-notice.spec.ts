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

  const credit = footer.locator("p", { hasText: "Desenvolvido por" })
  const link = credit.getByRole("link", { name: "Lex Intelligentia" })
  await expect(link).toHaveAttribute("href", "https://lexintelligentia.com")
  expect(await contrastRatio(credit)).toBeGreaterThanOrEqual(4.5)
  expect(await contrastRatio(link)).toBeGreaterThanOrEqual(4.5)
})

test("contact form shows the data notice above the submit button and links it", async ({ page }) => {
  await page.goto("/")
  const notice = page.locator("#contact-privacy-notice")
  const text =
    "Seus dados servem só para responder a esta mensagem. Dúvidas sobre proteção de dados: lgpd@tjes.jus.br."
  await expect(notice).toHaveText(text)
  await expect(notice.getByRole("link", { name: "lgpd@tjes.jus.br" })).toHaveAttribute(
    "href",
    "mailto:lgpd@tjes.jus.br",
  )
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
