import { describe, expect, test } from "bun:test"
import { contentSecurityPolicy } from "../lib/security-headers"

const savedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abcdefghijklmnop.supabase.co"
const { default: nextConfig } = await import("../next.config")
if (savedUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
else process.env.NEXT_PUBLIC_SUPABASE_URL = savedUrl

function directives(csp: string) {
  return new Map(
    csp.split(";").map((part) => {
      const [name, ...values] = part.trim().split(/\s+/)
      return [name, values] as const
    }),
  )
}

describe("security headers from next.config.ts", async () => {
  const rules = (await nextConfig.headers?.()) ?? []
  const global = rules.find((rule) => rule.source === "/(.*)")
  const headers = new Map(global?.headers.map((header) => [header.key, header.value]))
  const csp = directives(headers.get("Content-Security-Policy") ?? "")

  test("applies to every route and keeps the existing protections", () => {
    expect(global).toBeDefined()
    expect(headers.get("X-Frame-Options")).toBe("DENY")
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff")
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin")
    expect(headers.get("Strict-Transport-Security")).toContain("max-age=63072000")
  })

  test("Permissions-Policy disables camera, microphone and geolocation", () => {
    expect(headers.get("Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=()")
  })

  test("CSP has the restrictive directives required by R1.6", () => {
    expect(csp.get("object-src")).toEqual(["'none'"])
    expect(csp.get("base-uri")).toEqual(["'self'"])
    expect(csp.get("form-action")).toEqual(["'self'"])
    expect(csp.get("frame-ancestors")).toEqual(["'none'"])
    expect(csp.get("default-src")).toEqual(["'self'"])
  })

  test("CSP no longer allows OpenAI and pins the configured Supabase host", () => {
    const raw = headers.get("Content-Security-Policy") ?? ""
    expect(raw).not.toContain("openai")
    expect(raw).not.toContain("*.supabase.co")
    expect(csp.get("connect-src")).toContain("https://abcdefghijklmnop.supabase.co")
    expect(csp.get("img-src")).toContain("https://abcdefghijklmnop.supabase.co")
  })

  test("VLibras keeps the sources it needs (wave 1 keeps unsafe-inline/unsafe-eval)", () => {
    expect(csp.get("script-src")).toEqual([
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "https://vlibras.gov.br",
    ])
    expect(csp.get("frame-src")).toContain("https://vlibras.gov.br")
    expect(csp.get("img-src")).toContain("https://vlibras.gov.br")
    expect(csp.get("font-src")).toEqual(
      expect.arrayContaining(["https://vlibras.gov.br", "https://cdn.jsdelivr.net"]),
    )
    expect(csp.get("connect-src")).toEqual(
      expect.arrayContaining([
        "https://vlibras.gov.br",
        "https://traducao2.vlibras.gov.br",
        "https://dicionario2.vlibras.gov.br",
        "https://repositorio.vlibras.gov.br",
      ]),
    )
  })
})

test("without NEXT_PUBLIC_SUPABASE_URL the Supabase wildcard is the fallback", () => {
  const csp = directives(contentSecurityPolicy(undefined))
  expect(csp.get("connect-src")).toContain("https://*.supabase.co")
  expect(csp.get("img-src")).toContain("https://*.supabase.co")
})
