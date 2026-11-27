import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { CONTACT_INFO } from "../lib/constants"

// SPEC-PORTAL-001 R2.8: contact form usable by keyboard and screen reader.

test("fields have autocomplete and visible format hints linked to them", async ({ page }) => {
  await page.goto("/")
  const contact = page.locator("#contato")
  for (const [label, autocomplete, hint] of [
    ["Nome completo", "name", "Pelo menos 3 letras."],
    ["Telefone", "tel", "Com DDD. Exemplo: (27) 99999-0000."],
    ["E-mail", "email", "Exemplo: nome@exemplo.com."],
  ] as const) {
    const field = contact.getByLabel(label, { exact: true })
    await expect(field).toHaveAttribute("autocomplete", autocomplete)
    await expect(field).toHaveAccessibleDescription(hint)
    await expect(contact.getByText(hint, { exact: true })).toBeVisible()
  }
  await expect(contact.getByLabel("Mensagem", { exact: true })).toHaveAccessibleDescription(
    "Entre 10 e 5000 caracteres.",
  )
})

test("empty submission marks the fields, describes each error and focuses the first", async ({
  page,
}) => {
  let requests = 0
  await page.route("**/api/contact", (route) => {
    requests++
    return route.abort()
  })
  await page.goto("/")
  const contact = page.locator("#contato")
  await contact.getByRole("button", { name: "Enviar Mensagem", exact: true }).focus()
  await page.keyboard.press("Enter")
  const name = contact.getByLabel("Nome completo")
  await expect(name).toBeFocused()
  await expect(name).toHaveAttribute("aria-invalid", "true")
  await expect(name).toHaveAccessibleDescription(
    "Pelo menos 3 letras. Informe o nome completo, com pelo menos 3 letras.",
  )
  const phone = contact.getByLabel("Telefone")
  await expect(phone).toHaveAttribute("aria-invalid", "true")
  await expect(phone).toHaveAccessibleDescription(/Informe o telefone com DDD/)
  await expect(contact.getByLabel("E-mail", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  )
  await expect(contact.getByLabel("Mensagem", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  )
  await expect(contact.getByRole("alert")).toHaveText("Confira os campos destacados.")
  expect(requests).toBe(0)

  // Fixing a field clears its error.
  await name.fill("Pessoa Teste")
  await expect(name).not.toHaveAttribute("aria-invalid")
  await expect(name).toHaveAccessibleDescription("Pelo menos 3 letras.")
})

test("server 400 details point at the rejected field", async ({ page }) => {
  await page.route("**/api/contact", (route) =>
    route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ error: "Dados inválidos", details: [{ path: ["email"] }] }),
    }),
  )
  await page.goto("/")
  const contact = page.locator("#contato")
  await contact.getByLabel("Nome completo").fill("Pessoa Teste")
  await contact.getByLabel("Telefone").fill("27999999999")
  await contact.getByLabel("E-mail", { exact: true }).fill("teste@example.com")
  await contact.getByLabel("Mensagem", { exact: true }).fill("Mensagem fictícia para validar.")
  await contact.getByRole("button", { name: "Enviar Mensagem", exact: true }).click()
  const email = contact.getByLabel("E-mail", { exact: true })
  await expect(email).toHaveAttribute("aria-invalid", "true")
  await expect(email).toBeFocused()
})

test("keyboard-only submission reaches the success message, which gets focus", async ({ page }) => {
  await page.route("**/api/contact", (route) =>
    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ message: "Mensagem enviada com sucesso.", id: "fixture" }),
    }),
  )
  await page.goto("/")
  const contact = page.locator("#contato")
  await contact.getByLabel("Nome completo").focus()
  await page.keyboard.type("Pessoa Teste")
  await page.keyboard.press("Tab")
  await expect(contact.getByLabel("Telefone")).toBeFocused()
  await page.keyboard.type("(27) 99999-0000")
  await page.keyboard.press("Tab")
  await expect(contact.getByLabel("E-mail", { exact: true })).toBeFocused()
  await page.keyboard.type("teste@example.com")
  await page.keyboard.press("Tab")
  // Subject select, then the message.
  await page.keyboard.press("Tab")
  await expect(contact.getByLabel("Mensagem", { exact: true })).toBeFocused()
  await page.keyboard.type("Mensagem fictícia enviada só com o teclado.")
  await page.keyboard.press("Tab")
  await expect(contact.getByRole("link", { name: "suporte@lexintelligentia.com.br" })).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(contact.getByRole("button", { name: "Enviar Mensagem", exact: true })).toBeFocused()
  await page.keyboard.press("Enter")
  const heading = contact.getByRole("heading", { name: "Mensagem enviada!" })
  await expect(heading).toBeFocused()
  await expect(contact.getByRole("status")).toContainText("Sua mensagem de contato foi recebida")
})

test("the honeypot is never reached with Tab nor exposed to assistive technology", async ({
  page,
}) => {
  await page.goto("/")
  const honeypot = page.locator("#website")
  await expect(honeypot).toHaveAttribute("tabindex", "-1")
  await expect(page.getByRole("textbox", { name: "Deixe este campo em branco" })).toHaveCount(0)
})

test("office phone and e-mail are tel: and mailto: links", async ({ page }) => {
  await page.goto("/")
  const contact = page.locator("#contato")
  await expect(contact.getByRole("link", { name: CONTACT_INFO.phone })).toHaveAttribute(
    "href",
    "tel:+552732465641",
  )
  await expect(contact.getByRole("link", { name: CONTACT_INFO.email })).toHaveAttribute(
    "href",
    `mailto:${CONTACT_INFO.email}`,
  )
})

test("axe finds no violations in the form, idle and with errors", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" })
  const page = await context.newPage()
  await page.goto("/")
  const scan = () =>
    new AxeBuilder({ page })
      .include("#contato form")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze()
  expect((await scan()).violations).toEqual([])
  await page
    .locator("#contato")
    .getByRole("button", { name: "Enviar Mensagem", exact: true })
    .click()
  await expect(page.locator("#contato").getByRole("alert")).toBeVisible()
  expect((await scan()).violations).toEqual([])
  await context.close()
})
