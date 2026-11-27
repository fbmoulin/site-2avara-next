import { expect, test, type Page } from "@playwright/test"

// SPEC-PORTAL-001 R3.8. The analytics script only exists on Vercel; here window.va (its queue
// entry point) is replaced by a recorder to check which events the page sends.
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

test("playing the Zoom tutorial video sends one event", async ({ page }) => {
  const events = await recordEvents(page)
  await page.goto("/")
  await page.locator("#servicos").getByRole("button", { name: /^Audiências Virtuais/ }).click()
  const video = page.locator("#servicos video")
  await expect(video).toBeVisible()
  for (let i = 0; i < 2; i++)
    await video.evaluate((element: HTMLVideoElement) => {
      element.muted = true
      return element.play().catch(() => undefined)
    })
  await expect.poll(events).toEqual([{ name: "zoom_tutorial_play", options: undefined }])
})

test("a confirmed contact sends one event with the subject only", async ({ page }) => {
  const events = await recordEvents(page)
  await page.route("**/api/contact", (route) =>
    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ message: "ok", id: "00000000-0000-4000-8000-000000000000" }),
    }),
  )
  await page.goto("/")
  const contact = page.locator("#contato")
  await contact.getByLabel("Nome completo").fill("Pessoa Teste")
  await contact.getByLabel("Telefone").fill("27999999999")
  await contact.getByLabel("E-mail", { exact: true }).fill("teste@example.com")
  await contact.getByLabel("Assunto").selectOption("informacao")
  await contact.getByLabel("Mensagem", { exact: true }).fill("Mensagem fictícia para validar.")
  await contact.getByRole("button", { name: /Enviar Mensagem/ }).click()
  await expect(contact.getByRole("heading", { name: "Mensagem enviada!" })).toBeVisible()
  const sent = await events()
  expect(sent).toHaveLength(1)
  expect(JSON.stringify(sent)).not.toMatch(/Pessoa Teste|teste@example\.com|27999999999|fictícia/)
  expect(sent[0]).toMatchObject({ name: "contact_form_sent" })
})

test("a rejected contact sends no event", async ({ page }) => {
  const events = await recordEvents(page)
  await page.route("**/api/contact", (route) => route.fulfill({ status: 503, body: "{}" }))
  await page.goto("/")
  const contact = page.locator("#contato")
  await contact.getByLabel("Nome completo").fill("Pessoa Teste")
  await contact.getByLabel("Telefone").fill("27999999999")
  await contact.getByLabel("E-mail", { exact: true }).fill("teste@example.com")
  await contact.getByLabel("Mensagem", { exact: true }).fill("Mensagem fictícia para validar.")
  await contact.getByRole("button", { name: /Enviar Mensagem/ }).click()
  await expect(contact.getByRole("alert")).toBeVisible()
  expect(await events()).toEqual([])
})

test("the admin pages load no analytics", async ({ page }) => {
  const response = await page.goto("/login")
  expect(await response?.text()).not.toContain("_vercel/insights")
})
