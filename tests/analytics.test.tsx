import { afterEach, describe, expect, mock, test } from "bun:test"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { renderToStaticMarkup } from "react-dom/server"

// SPEC-PORTAL-001 R3.8: Vercel Web Analytics on the public pages, events without personal data.
let calls: { name: string; properties?: Record<string, unknown> }[] = []
let throws = false
mock.module("@vercel/analytics", () => ({
  track: (name: string, properties?: Record<string, unknown>) => {
    if (throws) throw new Error("analytics down")
    calls.push({ name, properties })
  },
}))
mock.module("@vercel/analytics/next", () => ({
  Analytics: () => <i data-testid="vercel-analytics" />,
}))

const analytics = await import("../lib/analytics")
const { WebAnalytics } = await import("../components/web-analytics")
const { contentSecurityPolicy } = await import("../lib/security-headers")

const savedVercel = process.env.VERCEL
afterEach(() => {
  calls = []
  throws = false
  if (savedVercel === undefined) delete process.env.VERCEL
  else process.env.VERCEL = savedVercel
})

describe("events", () => {
  test("Zoom tutorial video and confirmed contact", () => {
    analytics.trackZoomTutorialPlay()
    analytics.trackContactFormSent("informacao")
    expect(calls).toEqual([
      { name: "zoom_tutorial_play", properties: undefined },
      { name: "contact_form_sent", properties: { subject: "informacao" } },
    ])
  })

  test("the four first-screen shortcuts are ready", () => {
    expect([...analytics.HOME_SHORTCUTS]).toEqual([
      "tenho_audiencia",
      "consultar_processo",
      "pauta_da_semana",
      "falar_com_a_vara",
    ])
    for (const shortcut of analytics.HOME_SHORTCUTS) analytics.trackHomeShortcut(shortcut)
    expect(calls.map((call) => call.properties?.shortcut)).toEqual([...analytics.HOME_SHORTCUTS])
    expect(new Set(calls.map((call) => call.name))).toEqual(new Set(["home_shortcut"]))
  })

  test("a tracking failure never reaches the page", () => {
    throws = true
    expect(() => analytics.trackContactFormSent("outro")).not.toThrow()
    expect(() => analytics.trackZoomTutorialPlay()).not.toThrow()
  })
})

describe("script", () => {
  test("rendered only on Vercel builds", () => {
    delete process.env.VERCEL
    expect(renderToStaticMarkup(<WebAnalytics />)).toBe("")
    process.env.VERCEL = "1"
    expect(renderToStaticMarkup(<WebAnalytics />)).toContain("vercel-analytics")
  })

  test("only the public layout includes it; the admin group never does", () => {
    expect(readFileSync("app/(public)/layout.tsx", "utf8")).toContain("<WebAnalytics />")
    const files = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const path = join(dir, name)
        return statSync(path).isDirectory() ? files(path) : [path]
      })
    for (const file of [...files("app/(admin)"), "app/layout.tsx", "proxy.ts"]) {
      const source = readFileSync(file, "utf8")
      expect(source).not.toContain("web-analytics")
      expect(source).not.toContain("@vercel/analytics")
    }
  })

  test("public CSP already allows the same-origin script and endpoint (/_vercel/insights)", () => {
    const csp = contentSecurityPolicy("project.supabase.co")
    const directive = (name: string) =>
      csp
        .split("; ")
        .find((part) => part.startsWith(`${name} `))
        ?.split(" ") ?? []
    expect(directive("script-src")).toContain("'self'")
    expect(directive("connect-src")).toContain("'self'")
  })
})
