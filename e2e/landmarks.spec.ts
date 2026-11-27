import { expect, test } from "@playwright/test"

// SPEC-PORTAL-001 R2.5: one <main id="main-content"> per page and a working skip link.
for (const path of ["/", "/pauta", "/noticias", "/artigos", "/artigos/artigo-de-teste"]) {
  test(`${path} has a single main landmark and the skip link focuses it`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator("main")).toHaveCount(1)
    await expect(page.getByRole("main")).toHaveCount(1)
    await expect(page.locator("#main-content")).toHaveCount(1)
    const main = page.locator("main#main-content")
    await expect(main).toHaveAttribute("tabindex", "-1")

    const skip = page.getByRole("link", { name: "Ir para conteúdo" })
    await skip.focus()
    await page.keyboard.press("Enter")
    await expect(main).toBeFocused()
    // The next Tab continues inside the main content, not back in the header.
    await page.keyboard.press("Tab")
    expect(
      await page.evaluate(() => document.querySelector("main")!.contains(document.activeElement)),
    ).toBe(true)
  })
}

test("admin group pages also have exactly one main", async ({ page }) => {
  for (const path of ["/login", "/acesso-negado", "/servico-indisponivel"]) {
    await page.goto(path)
    await expect(page.locator("main#main-content")).toHaveCount(1)
    await expect(page.locator("main")).toHaveCount(1)
  }
})
