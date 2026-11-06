import { test, expect, type Page } from "@playwright/test"
import { CONTACT_INFO } from "../lib/constants"

const TOGGLE_OPEN = "Abrir guia de atendimento"
const TOGGLE_CLOSE = "Fechar guia de atendimento"
const WELCOME = "Não registro demandas nem reservo horários"
const ERROR_GENERIC = "Não foi possível carregar a orientação. Utilize a seção Contato."

async function openGuide(page: Page) {
  await page.goto("/")
  await page.getByRole("button", { name: TOGGLE_OPEN, exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "Guia de atendimento" })
  await expect(dialog).toBeVisible()
  return dialog
}

function reply(dialog: ReturnType<Page["getByRole"]>) {
  // The reply text is the first live region; loading/error messages are separate.
  return dialog.locator('[role="status"][aria-live="polite"]')
}

test.describe("Guia de atendimento (chatbot)", () => {
  test("opens with welcome text, focus on the panel and only fixed options", async ({ page }) => {
    const dialog = await openGuide(page)
    const toggle = page.getByRole("button", { name: TOGGLE_CLOSE, exact: true })

    await expect(toggle).toHaveAttribute("aria-expanded", "true")
    await expect(dialog).toBeFocused()
    await expect(reply(dialog)).toContainText(WELCOME)
    await expect(reply(dialog)).toContainText("não envie dados de processos aqui")

    const options = dialog.getByRole("group", { name: "Opções de orientação" }).getByRole("button")
    await expect(options).toHaveText([
      "Conhecer os serviços",
      "Solicitar atendimento",
      "Acessar o Balcão Virtual",
    ])
    // Deterministic guide: no free-text input that could collect case data.
    await expect(dialog.getByRole("textbox")).toHaveCount(0)
  })

  test("each option shows its approved guidance and link", async ({ page }) => {
    const dialog = await openGuide(page)

    await dialog.getByRole("button", { name: "Conhecer os serviços" }).click()
    await expect(reply(dialog)).toContainText("Este guia não acessa processos nem realiza solicitações.")
    await expect(dialog.getByRole("link", { name: "Ver serviços" })).toHaveAttribute("href", "/#servicos")

    await dialog.getByRole("button", { name: "Solicitar atendimento" }).click()
    await expect(reply(dialog)).toContainText(CONTACT_INFO.email)
    await expect(reply(dialog)).toContainText(CONTACT_INFO.phone)
    await expect(reply(dialog)).toContainText("Este guia não realizou nenhum registro ou reserva.")
    await expect(dialog.getByRole("link", { name: "Ver serviços" })).toHaveCount(0)
    await expect(dialog.getByRole("link", { name: "Abrir formulário de contato" })).toHaveAttribute(
      "href",
      "/#contato",
    )

    await dialog.getByRole("button", { name: "Acessar o Balcão Virtual" }).click()
    await expect(reply(dialog)).toContainText("Este guia não inicia nem agenda uma videoconferência.")
    const external = dialog.getByRole("link", { name: "Balcão Virtual do TJES" })
    await expect(external).toHaveAttribute("href", "https://www.tjes.jus.br/balcao-virtual/")
    await expect(external).toHaveAttribute("target", "_blank")
    await expect(external).toHaveAttribute("rel", "noopener noreferrer")
  })

  test("internal link closes the guide and goes to the contact form", async ({ page }) => {
    const dialog = await openGuide(page)
    await dialog.getByRole("button", { name: "Solicitar atendimento" }).click()
    await dialog.getByRole("link", { name: "Abrir formulário de contato" }).click()

    await expect(dialog).toHaveCount(0)
    await expect(page).toHaveURL(/#contato$/)
    await expect(page.locator("#contato")).toBeInViewport()
  })

  test("reset returns to the welcome text and clears links", async ({ page }) => {
    const dialog = await openGuide(page)
    await dialog.getByRole("button", { name: "Acessar o Balcão Virtual" }).click()
    await expect(dialog.getByRole("link", { name: "Balcão Virtual do TJES" })).toBeVisible()

    await dialog.getByRole("button", { name: "Voltar às orientações iniciais" }).click()
    await expect(reply(dialog)).toContainText(WELCOME)
    await expect(dialog.getByRole("link")).toHaveCount(0)
  })

  test("close button and toggle close the guide and return focus", async ({ page }) => {
    const dialog = await openGuide(page)
    await dialog.getByRole("button", { name: "Fechar guia", exact: true }).click()
    await expect(dialog).toHaveCount(0)
    const toggle = page.getByRole("button", { name: TOGGLE_OPEN, exact: true })
    await expect(toggle).toBeFocused()
    await expect(toggle).toHaveAttribute("aria-expanded", "false")

    await toggle.click()
    await expect(dialog).toBeVisible()
    await page.getByRole("button", { name: TOGGLE_CLOSE, exact: true }).click()
    await expect(dialog).toHaveCount(0)
  })

  test("is fully operable by keyboard", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: TOGGLE_OPEN, exact: true }).focus()
    await page.keyboard.press("Enter")
    const dialog = page.getByRole("dialog", { name: "Guia de atendimento" })
    await expect(dialog).toBeFocused()

    const option = dialog.getByRole("button", { name: "Solicitar atendimento" })
    await option.focus()
    await page.keyboard.press("Enter")
    await expect(reply(dialog)).toContainText(CONTACT_INFO.email)
    // Focus must stay on the chosen option, not fall back to <body>.
    await expect(option).toBeFocused()

    await page.keyboard.press("Escape")
    await expect(dialog).toHaveCount(0)
    await expect(page.getByRole("button", { name: TOGGLE_OPEN, exact: true })).toBeFocused()
  })

  test("shows loading state, disables options and sends a single request", async ({ page }) => {
    let requests = 0
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    await page.route("**/api/chat", async (route) => {
      requests += 1
      expect(route.request().postDataJSON()).toEqual({ option: "services" })
      await gate
      await route.continue()
    })

    const dialog = await openGuide(page)
    const option = dialog.getByRole("button", { name: "Conhecer os serviços" })
    await option.click()

    await expect(dialog.getByText("Carregando orientação...")).toBeVisible()
    await expect(dialog.getByRole("group", { name: "Opções de orientação" })).toHaveAttribute(
      "aria-busy",
      "true",
    )
    for (const button of await dialog.getByRole("group").getByRole("button").all()) {
      await expect(button).toHaveAttribute("aria-disabled", "true")
    }
    // Clicks while pending must not send another request. force: Playwright treats
    // aria-disabled as not actionable, but real users can still click the button.
    await option.click({ force: true })
    await dialog.getByRole("button", { name: "Solicitar atendimento" }).click({ force: true })

    release()
    await expect(reply(dialog)).toContainText("Este guia não acessa processos")
    await expect(dialog.getByText("Carregando orientação...")).toHaveCount(0)
    await expect(option).toHaveAttribute("aria-disabled", "false")
    expect(requests).toBe(1)
  })

  for (const [status, message] of [
    [429, "Aguarde alguns minutos antes de tentar novamente."],
    [500, ERROR_GENERIC],
    [503, ERROR_GENERIC],
  ] as const) {
    test(`HTTP ${status} keeps the previous guidance and shows an error`, async ({ page }) => {
      await page.route("**/api/chat", (route) =>
        route.fulfill({ status, contentType: "application/json", body: '{"error":"x"}' }),
      )
      const dialog = await openGuide(page)
      await dialog.getByRole("button", { name: "Solicitar atendimento" }).click()

      const alert = dialog.getByRole("alert")
      await expect(alert).toContainText(message)
      await expect(alert.getByRole("link", { name: "Abrir contato" })).toHaveAttribute("href", "/#contato")
      await expect(reply(dialog)).toContainText(WELCOME)
    })
  }

  test("network failure shows an error and a later choice recovers", async ({ page }) => {
    let fail = true
    await page.route("**/api/chat", (route) => (fail ? route.abort("failed") : route.continue()))
    const dialog = await openGuide(page)

    await dialog.getByRole("button", { name: "Acessar o Balcão Virtual" }).click()
    await expect(dialog.getByRole("alert")).toContainText(ERROR_GENERIC)

    fail = false
    await dialog.getByRole("button", { name: "Acessar o Balcão Virtual" }).click()
    await expect(dialog.getByRole("alert")).toHaveCount(0)
    await expect(dialog.getByRole("link", { name: "Balcão Virtual do TJES" })).toBeVisible()
  })

  test("error alert link closes the guide and goes to contact", async ({ page }) => {
    await page.route("**/api/chat", (route) => route.fulfill({ status: 500, body: "" }))
    const dialog = await openGuide(page)
    await dialog.getByRole("button", { name: "Conhecer os serviços" }).click()
    await dialog.getByRole("alert").getByRole("link", { name: "Abrir contato" }).click()
    await expect(dialog).toHaveCount(0)
    await expect(page).toHaveURL(/#contato$/)
  })
})

test.describe("API /api/chat — limites do guia", () => {
  test("legacy free-text clients get fixed guidance that never echoes the input", async ({ request }) => {
    const secret = "Processo 0001234-56.2026.8.08.0012 CPF 123.456.789-00 <script>alert(1)</script>"
    const response = await request.post("/api/chat", { data: { message: secret } })
    expect(response.status()).toBe(200)
    expect(response.headers()["content-type"]).toContain("text/event-stream")
    const body = await response.text()
    expect(body).toContain(WELCOME)
    expect(body).toContain("data: [DONE]")
    expect(body).not.toContain("0001234")
    expect(body).not.toContain("123.456.789")
    expect(body).not.toContain("<script>")
  })

  test("rejects unknown options and extra fields", async ({ request }) => {
    for (const data of [{ option: "schedule" }, { option: "contact", message: "oi" }, {}]) {
      const response = await request.post("/api/chat", { data })
      expect(response.status(), JSON.stringify(data)).toBe(400)
    }
  })

  test("valid options are not cached", async ({ request }) => {
    for (const option of ["services", "contact", "virtual"]) {
      const response = await request.post("/api/chat", { data: { option } })
      expect(response.status()).toBe(200)
      expect(response.headers()["cache-control"]).toBe("no-store")
      const body = await response.json()
      expect(typeof body.text).toBe("string")
      expect(Array.isArray(body.links)).toBe(true)
    }
  })
})
