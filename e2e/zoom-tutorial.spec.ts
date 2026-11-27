import { test, expect } from "@playwright/test"

test("Zoom tutorial video appears only when the virtual hearings card is expanded", async ({
  page,
  request,
}) => {
  await page.goto("/")
  const video = page.locator("#servicos").getByRole("figure").locator("video")
  await expect(video).toHaveCount(0)

  await page.getByRole("button", { name: /^Audiências Virtuais/ }).click()
  await expect(video).toBeVisible()
  await expect(video).toHaveAttribute("preload", "none")
  await expect(video).toHaveAccessibleName("Vídeo: como participar da audiência híbrida pelo Zoom")
  await expect(video.locator("source")).toHaveAttribute("src", "/videos/tutorial-zoom-audiencia.mp4")

  const response = await request.get("/videos/tutorial-zoom-audiencia.mp4", {
    headers: { Range: "bytes=0-1023" },
  })
  expect([200, 206]).toContain(response.status())
  expect(response.headers()["content-type"]).toContain("video/mp4")

  await page.getByRole("button", { name: /^Audiências Virtuais/ }).click()
  await expect(video).toHaveCount(0)
})

test("Zoom tutorial is highlighted on the home page, right after the judge section", async ({
  page,
}) => {
  await page.goto("/")
  const section = page.getByRole("region", { name: "Vai participar de audiência pelo Zoom?" })
  await expect(section).toBeVisible()

  const video = section.locator("video")
  await expect(video).toBeVisible()
  await expect(video).toHaveAttribute("preload", "none")
  await expect(video).toHaveAttribute("poster", "/videos/tutorial-zoom-audiencia-poster.jpg")
  await expect(video).toHaveAccessibleName("Vai participar de audiência pelo Zoom?")
  await expect(video.locator("source")).toHaveAttribute("src", "/videos/tutorial-zoom-audiencia.mp4")
  await expect(section.getByRole("link", { name: /passo a passo/ })).toHaveAttribute("href", "#servicos")

  const order = await page.evaluate(() =>
    ["magistrado", "tutorial-zoom", "servicos"].map((id) =>
      document.getElementById(id)!.getBoundingClientRect().top,
    ),
  )
  expect(order[0]).toBeLessThan(order[1])
  expect(order[1]).toBeLessThan(order[2])
})

test("updated team and office e-mail are shown", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByText("Gabriel de Oliveira")).toBeVisible()
  await expect(page.getByText("Residente Jurídico")).toBeVisible()
  await expect(page.getByText("2civelgabinetecariacica@gmail.com").first()).toBeVisible()
})
