import { test, expect } from "@playwright/test"

test.describe("Integration Tests — Full Flow with DB", () => {
  test("POST /api/contact creates record in database", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: {
        name: "Maria Teste E2E",
        phone: "27999887766",
        email: "maria.teste@e2e.com",
        subject: "Teste E2E Playwright",
        message: "Esta é uma mensagem de teste automatizado via Playwright E2E.",
      },
    })
    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body.message).toContain("sucesso")
  })

  test("POST /api/appointments creates booking", async ({ request }) => {
    const response = await request.post("/api/appointments", {
      data: {
        type: "virtual",
        withWhom: "assessoria",
        name: "Dr. Teste E2E",
        oabNumber: "ES12345",
        processNumber: "0001234-55.2026.8.08.0012",
        reason: "Teste automatizado de agendamento via Playwright. Verificar fluxo completo.",
      },
    })
    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body.message).toContain("sucesso")
  })

  test("POST /api/demands creates demand record", async ({ request }) => {
    const response = await request.post("/api/demands", {
      data: {
        processNumber: "0009876-11.2026.8.08.0012",
        demandType: "celeridade",
        description: "Teste automatizado de demanda via Playwright. Pedido de celeridade para verificação do fluxo.",
        priority: "normal",
      },
    })
    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body.message).toContain("sucesso")
  })

  test("POST /api/chat returns streaming response from OpenAI", async ({
    request,
  }) => {
    const response = await request.post("/api/chat", {
      data: {
        message: "Olá, gostaria de agendar um atendimento.",
        history: [],
      },
    })
    expect(response.status()).toBe(200)
    expect(response.headers()["content-type"]).toContain("text/event-stream")
    const text = await response.text()
    expect(text).toContain("data:")
  })

  test("GET /api/news returns array (empty or with data)", async ({
    request,
  }) => {
    const response = await request.get("/api/news")
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(Array.isArray(body)).toBe(true)
  })
})
