import { test, expect } from "@playwright/test"

test.describe("Smoke Tests — Pages Render", () => {
  test("landing page loads with court title", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/2ª Vara Cível/)
    await expect(page.locator("body")).toBeVisible()
  })

  test("meta description describes an informative portal, not the official one", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "Portal informativo da 2ª Vara Cível de Cariacica (ES): serviços, pauta de audiências, notícias e contato.",
    )
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

  for (const path of ["/api/appointments", "/api/demands"]) {
    test(`${path} is retired with 410`, async ({ request }) => {
      for (const response of [
        await request.get(path),
        await request.post(path, { data: { name: "Teste" } }),
        await request.delete(path),
      ]) {
        expect(response.status()).toBe(410)
        expect((await response.json()).error).toContain("desativado")
      }
    })
  }

  test("POST /api/chat validates message field", async ({ request }) => {
    const response = await request.post("/api/chat", {
      data: { message: "" },
    })
    expect(response.status()).toBe(400)
  })

  test("GET /api/news returns JSON from fixture database", async ({ request }) => {
    const response = await request.get("/api/news")
    // Without DB, this will error — but we check the route exists
    expect(response.status()).toBe(200)
  })

  test("GET /api/news cron rejects without auth", async ({ request }) => {
    const response = await request.get("/api/news?cron=true")
    expect(response.status()).toBe(401)
  })

  test("GET /api/retention rejects without auth", async ({ request }) => {
    const response = await request.get("/api/retention")
    expect(response.status()).toBe(401)
  })

  test("GET /api/retention with the disposable secret keeps recent rows", async ({ request }) => {
    test.skip(!process.env.CRON_SECRET, "runs under verify:local, which sets a disposable CRON_SECRET")
    const response = await request.get("/api/retention", {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    })
    expect(response.status()).toBe(200)
    expect(await response.json()).toEqual({
      retentionMonths: 12,
      deleted: { contactMessages: 0, appointments: 0, demands: 0 },
    })
  })
})

test.describe("Accessibility — visible content and reduced motion (R2.3)", () => {
  test("server HTML of the hero has no opacity:0", async ({ request }) => {
    const html = await (await request.get("/")).text()
    const start = html.indexOf('id="inicio"')
    expect(start).toBeGreaterThan(-1)
    const hero = html.slice(start, html.indexOf("</section>", start))
    expect(hero).toContain("Excelência e Celeridade na Prestação Jurisdicional")
    expect(hero).not.toMatch(/opacity:\s*0/)
  })

  test("hero is fully opaque right away", async ({ page }) => {
    await page.goto("/")
    const hero = page.locator("#inicio")
    for (const element of [
      hero.locator("h1"),
      hero.getByText("Comprometidos com a humanização"),
      hero.getByRole("link", { name: "Nossos Serviços" }),
    ]) {
      await expect(element).toBeVisible()
      await expect(element).toHaveCSS("opacity", "1")
    }
  })

  test("with reduced motion, sections below the fold show without animating", async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" })
    const page = await context.newPage()
    await page.goto("/")

    await expect(page.locator("h1")).toBeVisible()
    await expect(page.getByText("Serviços Disponíveis")).toBeVisible()
    await expect(page.getByText("Perguntas Frequentes")).toBeVisible()
    // By role: the FAQ answers (now in the HTML, R3.2) also contain "entre em contato".
    await expect(page.getByRole("heading", { name: "Entre em Contato" })).toBeVisible()
    // Without scrolling: no element of the home page is left transparent waiting for an animation.
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            Array.from(document.querySelectorAll("main *")).filter(
              (element) =>
                getComputedStyle(element).opacity === "0" &&
                element.getBoundingClientRect().height > 0,
            ).length,
        ),
      )
      .toBe(0)
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

test.describe("Security headers", () => {
  test("home responds with the R1.6 headers", async ({ request }) => {
    const response = await request.get("/")
    const headers = response.headers()
    expect(headers["permissions-policy"]).toBe("camera=(), microphone=(), geolocation=()")
    const csp = headers["content-security-policy"]
    for (const directive of [
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ])
      expect(csp).toContain(directive)
    expect(csp).not.toContain("api.openai.com")
    expect(csp).toContain("https://vlibras.gov.br")
  })
})
