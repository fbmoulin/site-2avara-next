import { expect, test, type Page } from "@playwright/test"

// SPEC-PORTAL-001 R2.6. The disposable environment has no Supabase: the browser's sign-in call is
// answered by a synthetic session so that the form's redirect runs. The server still sees no valid
// session (it cannot reach Supabase), so /admin answers with its unavailable page; only the target
// of the redirect matters here.
async function signInWithFixture(page: Page, path: string) {
  const visited: string[] = []
  page.on("request", (request) => {
    // router.push fetches the RSC payload of the target (?_rsc=), so watch those requests too.
    if (request.resourceType() === "document" || request.url().includes("_rsc="))
      visited.push(request.url())
  })
  await page.route("**/auth/v1/token**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "fixture-access-token",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: "fixture-refresh-token",
        user: {
          id: "11111111-1111-4111-8111-111111111111",
          aud: "authenticated",
          role: "authenticated",
          email: "pessoa@example.com",
          app_metadata: {},
          user_metadata: {},
          created_at: new Date().toISOString(),
        },
      }),
    }),
  )
  await page.goto(path)
  await page.getByLabel("Email").fill("pessoa@example.com")
  await page.getByLabel("Senha").fill("senha-ficticia")
  await page.getByRole("button", { name: "Entrar" }).click()
  return visited
}

for (const hostile of ["/\\evil.com", "//evil.com", "https://evil.com/admin", "/login"]) {
  test(`redirect=${hostile} ends in /admin`, async ({ page }) => {
    const visited = await signInWithFixture(page, `/login?redirect=${encodeURIComponent(hostile)}`)
    await expect.poll(() => visited.some((url) => new URL(url).pathname === "/admin")).toBe(true)
    await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:\d+\/admin$/)
    expect(visited.every((url) => new URL(url).hostname === "127.0.0.1")).toBe(true)
  })
}

test("the literal /\\evil.com from the spec, unencoded, ends in /admin", async ({ page }) => {
  const visited = await signInWithFixture(page, "/login?redirect=/\\evil.com")
  await expect.poll(() => visited.some((url) => new URL(url).pathname === "/admin")).toBe(true)
  expect(visited.every((url) => new URL(url).hostname === "127.0.0.1")).toBe(true)
})

test("an admin path is kept", async ({ page }) => {
  const visited = await signInWithFixture(page, "/login?redirect=%2Fadmin%2Fpauta")
  await expect
    .poll(() => visited.some((url) => new URL(url).pathname === "/admin/pauta"))
    .toBe(true)
})
