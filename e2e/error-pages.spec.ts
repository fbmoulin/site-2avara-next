import { expect, test } from "@playwright/test"

// SPEC-PORTAL-001 R3.4 (and roteiro §8): unknown addresses answer 404 in Portuguese.

test("an unknown address answers 404 in Portuguese with one <main>", async ({ page }) => {
  const response = await page.goto("/pagina-que-nao-existe")
  expect(response?.status()).toBe(404)
  await expect(page.getByRole("heading", { level: 1, name: "Página não encontrada" })).toBeVisible()
  await expect(page.locator("main")).toHaveCount(1)
  await expect(page).toHaveTitle(/Página não encontrada/)
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/)
  await expect(page.getByRole("link", { name: "Pauta semanal de audiências" })).toHaveAttribute(
    "href",
    "/pauta",
  )
})

test("an unknown article answers 404 inside the public layout", async ({ page }) => {
  const response = await page.goto("/artigos/artigo-inexistente")
  expect(response?.status()).toBe(404)
  await expect(page.getByRole("heading", { level: 1, name: "Página não encontrada" })).toBeVisible()
  await expect(page.locator("main")).toHaveCount(1)
  // Public chrome kept: menu and footer.
  await expect(page.getByRole("contentinfo")).toBeVisible()
  await expect(page.getByRole("link", { name: "Ir para conteúdo" })).toBeAttached()
})

test("an unknown panel address still requires the session", async ({ page }) => {
  await page.goto("/admin/pagina-que-nao-existe")
  await page.waitForURL(/\/login/)
})
