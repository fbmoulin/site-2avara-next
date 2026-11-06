import { test, expect } from "@playwright/test"

test("Zoom tutorial video appears only when the virtual hearings card is expanded", async ({
  page,
  request,
}) => {
  await page.goto("/")
  const video = page.getByRole("figure").locator("video")
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

test("updated team and office e-mail are shown", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByText("Gabriel de Oliveira")).toBeVisible()
  await expect(page.getByText("Residente Jurídico")).toBeVisible()
  await expect(page.getByText("2civelgabinetecariacica@gmail.com").first()).toBeVisible()
})
