import { expect, test } from "@playwright/test"

for (const [path, heading] of [
  ["/privacidade", "Política de Privacidade"],
  ["/termos", "Termos de Uso"],
] as const) {
  test(`${path} renders one h1, sections and the approval notice`, async ({ page }) => {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    await expect(page).toHaveTitle(new RegExp(heading))
    await expect(page.locator("h1")).toHaveCount(1)
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible()
    expect(await page.locator("h2").count()).toBeGreaterThanOrEqual(5)
    await expect(page.getByRole("note")).toContainText("Versão para aprovação")
  })
}

test("footer links open the privacy policy and the terms of use", async ({ page }) => {
  await page.goto("/")
  const footer = page.locator("footer")
  await expect(footer.getByRole("link", { name: "Política de Privacidade" })).toHaveAttribute(
    "href",
    "/privacidade",
  )
  await expect(footer.getByRole("link", { name: "Termos de Uso" })).toHaveAttribute(
    "href",
    "/termos",
  )
  await footer.getByRole("link", { name: "Termos de Uso" }).click()
  await expect(page).toHaveURL(/\/termos$/)
  await expect(page.getByRole("heading", { level: 1, name: "Termos de Uso" })).toBeVisible()
})

test("contact form shows the privacy notice before the send button", async ({ page }) => {
  await page.goto("/")
  const notice = page.locator("#contact-privacy-notice")
  await expect(notice).toContainText("Usamos seus dados só para responder a esta mensagem.")
  await expect(notice.getByRole("link", { name: "Política de Privacidade" })).toHaveAttribute(
    "href",
    "/privacidade",
  )
  await expect(page.getByRole("button", { name: "Enviar Mensagem", exact: true })).toHaveAttribute(
    "aria-describedby",
    "contact-privacy-notice",
  )
})

test("sitemap lists the legal pages", async ({ request }) => {
  const body = await (await request.get("/sitemap.xml")).text()
  expect(body).toContain("https://2avaraciveldecariacica.org/privacidade")
  expect(body).toContain("https://2avaraciveldecariacica.org/termos")
})
