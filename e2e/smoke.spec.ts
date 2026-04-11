import { test, expect } from "@playwright/test"

test.describe("Smoke Tests — Pages Render", () => {
  test("landing page loads with court title", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/2ª Vara Cível/)
    await expect(page.locator("body")).toBeVisible()
  })

  test("login page renders with admin title", async ({ page }) => {
    await page.goto("/login")
    await expect(page.locator("h1")).toBeVisible()
  })

  test("admin redirect to login when unauthenticated", async ({ page }) => {
    await page.goto("/admin")
    await page.waitForURL(/\/login/, { timeout: 10000 })
    expect(page.url()).toContain("/login")
  })
})

test.describe("API Routes — Health Checks", () => {
  test("POST /api/contact validates required fields", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: { name: "A" }, // Invalid — too short, missing fields
    })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toBe("Dados inválidos")
  })

  test("POST /api/appointments validates required fields", async ({
    request,
  }) => {
    const response = await request.post("/api/appointments", {
      data: { name: "Test" }, // Missing type, withWhom, processNumber, reason
    })
    expect(response.status()).toBe(400)
  })

  test("POST /api/demands validates required fields", async ({ request }) => {
    const response = await request.post("/api/demands", {
      data: {}, // Empty
    })
    expect(response.status()).toBe(400)
  })

  test("POST /api/chat validates message field", async ({ request }) => {
    const response = await request.post("/api/chat", {
      data: { message: "" },
    })
    expect(response.status()).toBe(400)
  })

  test("GET /api/news returns JSON (may fail without DB)", async ({
    request,
  }) => {
    const response = await request.get("/api/news")
    // Without DB, this will error — but we check the route exists
    expect([200, 500]).toContain(response.status())
  })

  test("GET /api/news cron rejects without auth", async ({ request }) => {
    const response = await request.get("/api/news?cron=true")
    expect(response.status()).toBe(401)
  })
})

test.describe("Accessibility — Reduced Motion", () => {
  test("landing page renders immediately with reduced motion", async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" })
    const page = await context.newPage()
    await page.goto("/")

    // All section headings should be visible immediately (not hidden by pending animations)
    await expect(page.locator("h1")).toBeVisible()
    await expect(page.getByText("Serviços Disponíveis")).toBeVisible()
    await expect(page.getByText("Perguntas Frequentes")).toBeVisible()
    await expect(page.getByText("Entre em Contato")).toBeVisible()

    await context.close()
  })
})

test.describe("Client Error Logging — /api/client-errors", () => {
  test("valid batch returns 204", async ({ request }) => {
    const response = await request.post("/api/client-errors", {
      data: {
        errors: [
          {
            level: "error",
            event: "test_error",
            timestamp: new Date().toISOString(),
            url: "http://localhost:3099/",
            session_id: "test-session-123",
            data: { message: "test" },
          },
        ],
      },
    })
    expect(response.status()).toBe(204)
  })

  test("empty errors array returns 204", async ({ request }) => {
    const response = await request.post("/api/client-errors", {
      data: { errors: [] },
    })
    expect(response.status()).toBe(204)
  })

  test("malformed payload returns 422", async ({ request }) => {
    const response = await request.post("/api/client-errors", {
      data: { errors: [{ bad: "data" }] },
    })
    expect(response.status()).toBe(422)
  })

  test("batch over 10 entries returns 422", async ({ request }) => {
    const entries = Array.from({ length: 11 }, (_, i) => ({
      level: "warn",
      event: `event_${i}`,
      timestamp: new Date().toISOString(),
      url: "http://localhost/",
      session_id: "overflow-test",
    }))
    const response = await request.post("/api/client-errors", {
      data: { errors: entries },
    })
    expect(response.status()).toBe(422)
  })
})
