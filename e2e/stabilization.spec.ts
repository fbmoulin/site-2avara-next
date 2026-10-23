import { expect, test, type Page } from "@playwright/test"

async function fillContact(page: Page) {
  await page.getByLabel("Nome completo").fill("Pessoa Teste")
  await page.getByLabel("Telefone").fill("27999999999")
  await page.getByLabel("E-mail", { exact: true }).fill("teste@example.com")
  await page
    .getByLabel("Mensagem", { exact: true })
    .fill("Mensagem fictícia para validar o formulário.")
}

test("HTTP 201 keeps success, clears fields and allows a fresh contact", async ({ page }) => {
  let count = 0
  await page.route("**/api/contact", async (route) => {
    count++
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ message: "Mensagem enviada com sucesso.", id: "fixture" }),
    })
  })
  await page.goto("/")
  await fillContact(page)
  await page.getByRole("button", { name: "Enviar Mensagem", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Mensagem enviada!" })).toBeVisible()
  await expect(page.locator("#contato").getByRole("alert")).toHaveCount(0)
  expect(count).toBe(1)
  await page.getByRole("button", { name: "Enviar outra mensagem" }).click()
  await expect(page.getByLabel("Nome completo")).toHaveValue("")
  await expect(page.getByLabel("Mensagem", { exact: true })).toHaveValue("")
})

for (const status of [400, 422, 429, 503]) {
  test(`HTTP ${status} preserves entered data and explains the error`, async ({ page }) => {
    await page.route("**/api/contact", (route) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify({ error: "fixture" }),
      }),
    )
    await page.goto("/")
    await fillContact(page)
    await page.getByRole("button", { name: "Enviar Mensagem", exact: true }).click()
    await expect(page.locator("#contato").getByRole("alert")).toBeVisible()
    await expect(page.getByLabel("Nome completo")).toHaveValue("Pessoa Teste")
    if (status === 429)
      await expect(page.locator("#contato").getByRole("alert")).toContainText("limite")
    await expect(page.getByRole("button", { name: "Enviar Mensagem", exact: true })).toBeEnabled()
  })
}

test("network failure preserves data and warns before resubmission", async ({ page }) => {
  await page.route("**/api/contact", (route) => route.abort())
  await page.goto("/")
  await fillContact(page)
  await page.getByRole("button", { name: "Enviar Mensagem", exact: true }).click()
  await expect(page.locator("#contato").getByRole("alert")).toContainText("Antes de reenviar")
  await expect(page.getByLabel("Mensagem", { exact: true })).not.toHaveValue("")
})

test("rapid submissions send one request while pending", async ({ page }) => {
  let count = 0
  let release!: () => void
  const wait = new Promise<void>((resolve) => {
    release = resolve
  })
  let intercepted!: () => void
  const firstRequest = new Promise<void>((resolve) => {
    intercepted = resolve
  })
  await page.route("**/api/contact", async (route) => {
    count++
    intercepted()
    await wait
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ message: "Mensagem enviada com sucesso.", id: "fixture" }),
    })
  })
  await page.goto("/")
  await fillContact(page)
  const form = page.locator("#contato form")
  try {
    // Two native submit events in one browser task exercise the ref guard before
    // React has rendered the disabled button. A click alone only tests the button.
    await form.evaluate((element) => {
      const contact = element as HTMLFormElement
      contact.requestSubmit()
      contact.requestSubmit()
    })
    await firstRequest
    await expect(page.getByRole("button", { name: "Enviando..." })).toBeDisabled()
    // Try again while the HTTP response is still held by the interceptor.
    await form.evaluate((element) => (element as HTMLFormElement).requestSubmit())
    expect(count).toBe(1)
  } finally {
    release()
  }
  await expect(page.getByRole("heading", { name: "Mensagem enviada!" })).toBeVisible()
  // Flush browser fetches before checking the final count, including queued duplicates.
  await page.waitForLoadState("networkidle")
  expect(count).toBe(1)
})

test("service shortcut opens informative guide with keyboard support", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: /^Solicitações e Agendamento/ }).click()
  await page.getByRole("link", { name: "Orientações de atendimento" }).click()
  const dialog = page.getByRole("dialog", { name: "Guia de atendimento" })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText("Não registro demandas nem reservo horários")
  await dialog.getByRole("button", { name: "Solicitar atendimento", exact: true }).click()
  await expect(dialog.getByRole("link", { name: "Abrir formulário de contato" })).toHaveAttribute(
    "href",
    "/#contato",
  )
  await dialog.press("Escape")
  await expect(dialog).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "Abrir guia de atendimento", exact: true }),
  ).toBeFocused()
})

test("guide remains inside mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto("/")
  await page.getByRole("button", { name: "Abrir guia de atendimento", exact: true }).click()
  const box = await page.getByRole("dialog", { name: "Guia de atendimento" }).boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(375)
  expect(box!.y + box!.height).toBeLessThanOrEqual(667)
})
