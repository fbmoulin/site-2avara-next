import { describe, expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { HearingScheduleUnavailable } from "../components/hearing-schedule-unavailable"
import { BALCAO_VIRTUAL_URL, CONTACT_INFO, FORUM_MAP_EMBED_URL } from "../lib/constants"

// SPEC-PORTAL-001 R2.9.
describe("/pauta read failure message", () => {
  const html = renderToStaticMarkup(<HearingScheduleUnavailable />)
  test("is an alert that points to the Balcão Virtual and the office phone", () => {
    expect(html).toContain('role="alert"')
    expect(html).toContain("Não foi possível consultar a pauta agora.")
    expect(html).toContain(`href="${BALCAO_VIRTUAL_URL}"`)
    expect(html).toContain("Balcão Virtual do TJES")
    expect(html).toContain(`href="${CONTACT_INFO.phoneHref}"`)
    expect(html).toContain(CONTACT_INFO.phone)
  })
})

test("map embed is centred on the Fórum (−20.3332 / −40.3767)", () => {
  const url = new URL(FORUM_MAP_EMBED_URL)
  expect(url.hostname).toBe("www.google.com")
  expect(url.searchParams.get("q")).toBe("-20.3332,-40.3767")
})
