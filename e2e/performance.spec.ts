import { expect, test } from "@playwright/test"

// SPEC-PORTAL-001 R3.3: CSS reveal (no animation library), lazy Fórum image, native subject select.

test("server HTML never hides content waiting for a reveal", async ({ request }) => {
  const html = await (await request.get("/")).text()
  expect(html).toContain('data-reveal="shown"')
  expect(html).not.toContain('data-reveal="pending"')
  expect(html).not.toContain('data-reveal-group="pending"')
  expect(html).not.toMatch(/style="[^"]*opacity:\s*0/)
})

test("blocks below the fold reveal when scrolled into view", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")
  const contact = page.locator("#contato [data-reveal-variant]").first()
  await expect(contact).toHaveAttribute("data-reveal", "pending")
  await contact.scrollIntoViewIfNeeded()
  await expect(contact).toHaveAttribute("data-reveal", "revealed")
  await expect(contact).toHaveCSS("opacity", "1")
})

test("the Fórum photo is lazy, without priority, with sizes for its real width", async ({
  page,
}) => {
  await page.goto("/")
  const photo = page.locator('img[alt^="Fachada do Fórum de Cariacica"]')
  await expect(photo).toHaveAttribute("loading", "lazy")
  await expect(photo).not.toHaveAttribute("fetchpriority", "high")
  await expect(photo).toHaveAttribute("sizes", "(max-width: 480px) calc(100vw - 2rem), 448px")
  const preloads = await page.locator('link[rel="preload"][as="image"]').count()
  expect(preloads).toBe(0)
})

test("the subject is a native select with every option", async ({ page }) => {
  await page.goto("/")
  const subject = page.getByLabel("Assunto")
  await expect(subject).toHaveJSProperty("tagName", "SELECT")
  await expect(subject.locator("option")).toHaveText([
    "Selecione o assunto",
    "Informação",
    "Agendamento",
    "Sugestão",
    "Reclamação",
    "Outro",
  ])
})

test("the chosen subject is sent; no choice is sent as 'outro'", async ({ page }) => {
  const sent: unknown[] = []
  await page.route("**/api/contact", (route) => {
    sent.push(route.request().postDataJSON())
    return route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ message: "ok", id: "00000000-0000-4000-8000-000000000000" }),
    })
  })
  await page.goto("/")
  const contact = page.locator("#contato")
  async function send() {
    await contact.getByLabel("Nome completo").fill("Pessoa Teste")
    await contact.getByLabel("Telefone").fill("27999999999")
    await contact.getByLabel("E-mail", { exact: true }).fill("teste@example.com")
    await contact.getByLabel("Mensagem", { exact: true }).fill("Mensagem fictícia para validar.")
    await contact.getByRole("button", { name: /Enviar Mensagem/ }).click()
    await expect(contact.getByRole("heading", { name: "Mensagem enviada!" })).toBeVisible()
  }
  await contact.getByLabel("Assunto").selectOption("sugestao")
  await send()
  await contact.getByRole("button", { name: "Enviar outra mensagem" }).click()
  await send()
  expect(sent).toMatchObject([{ subject: "sugestao" }, { subject: "outro" }])
})
