import { expect, test } from "@playwright/test"

test("weekly schedule is reachable, explains unpublished week and Zoom guidance", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("link", { name: "Consultar pauta da semana" }).click()
  await expect(
    page.getByRole("heading", { name: "Pauta semanal de audiências", exact: true }),
  ).toBeVisible()
  await expect(page.getByRole("status")).toHaveText("A pauta desta semana ainda não foi publicada.")
  await expect(
    page.getByText("Utilize o link recebido na intimação", { exact: false }),
  ).toBeVisible()
})

test("schedule editor redirects anonymous visitors to login", async ({ page }) => {
  await page.goto("/admin/pauta")
  await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin%2Fpauta$/)
  await expect(page.getByRole("button", { name: "Revisar e liberar semana" })).toHaveCount(0)
})
