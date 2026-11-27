import { expect, test } from "@playwright/test"

// SPEC-PORTAL-001 R2.1: the administrative group loads no external script and has a nonce CSP.
const ADMIN_PAGES = ["/login", "/acesso-negado", "/servico-indisponivel"]

function scriptSrc(csp: string) {
  return csp.split(";").find((part) => part.trim().startsWith("script-src")) ?? ""
}

for (const path of ADMIN_PAGES) {
  test(`${path} HTML has no VLibras, guide or accessibility bar and a nonce CSP`, async ({
    request,
  }) => {
    const response = await request.get(path)
    expect(response.status()).toBe(200)
    const html = await response.text()
    expect(html).not.toContain("vlibras.gov.br")
    expect(html).not.toContain("vw-access-button")
    expect(html).not.toContain("Abrir guia de atendimento")
    expect(html).not.toContain("Alternar alto contraste")
    const csp = response.headers()["content-security-policy"]
    // A single policy: the public VLibras CSP must not be merged into it.
    expect(csp).not.toContain("vlibras")
    const scripts = scriptSrc(csp)
    expect(scripts).toMatch(/'nonce-[^']+'/)
    expect(scripts).not.toContain("'unsafe-inline'")
    // React needs eval only in development; the production policy is covered by unit tests.
    if (process.env.NODE_ENV === "production") expect(scripts).not.toContain("'unsafe-eval'")
    const nonce = scripts.match(/'nonce-([^']+)'/)![1]
    // Next applies the request nonce to its own scripts.
    expect(html).toContain(`nonce="${nonce}"`)
    expect(html).toContain('id="main-content"')
  })
}

test("/admin without a session goes to /login and the login page works under the strict CSP", async ({
  page,
}) => {
  const violations: string[] = []
  page.on("console", (message) => {
    if (message.text().includes("Content Security Policy")) violations.push(message.text())
  })
  const response = await page.goto("/admin")
  await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin$/)
  expect(response?.headers()["content-security-policy"]).toContain("'nonce-")
  await expect(page.getByRole("heading", { name: "Painel Administrativo" })).toBeVisible()
  // Hydrated: client-side validation and state work, so the nonce reached the scripts.
  await page.getByLabel("Email").fill("pessoa@example.com")
  await expect(page.getByLabel("Email")).toHaveValue("pessoa@example.com")
  await expect(page.locator("script[src*='vlibras']")).toHaveCount(0)
  await expect(page.locator("[vw]")).toHaveCount(0)
  expect(violations).toEqual([])
})

test("public pages keep the VLibras CSP and widget", async ({ request }) => {
  for (const path of ["/", "/pauta", "/noticias", "/artigos"]) {
    const response = await request.get(path)
    expect(response.status()).toBe(200)
    const csp = response.headers()["content-security-policy"]
    expect(csp).toContain("https://vlibras.gov.br")
    expect(csp).toContain("https://cdn.jsdelivr.net/gh/spbgovbr-vlibras/")
    expect(await response.text()).toContain("vw-access-button")
  }
})

test("leaving the admin group for the public site is a full page load with the public CSP", async ({
  page,
}) => {
  for (const path of ["/acesso-negado", "/servico-indisponivel"]) {
    await page.goto(path)
    const [response] = await Promise.all([
      page.waitForResponse((r) => new URL(r.url()).pathname === "/" && r.request().resourceType() === "document"),
      page.getByRole("link", { name: "Voltar ao início" }).click(),
    ])
    expect(response.headers()["content-security-policy"]).toContain("https://vlibras.gov.br")
  }
})
