import { describe, expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { Hero, HOME_SHORTCUT_LINKS } from "../components/landing/hero"
import { HOME_SHORTCUTS } from "../lib/analytics"
import { PROCESS_LOOKUP_URL, SERVICES, VIRTUAL_HEARINGS_ANCHOR } from "../lib/constants"
import { hearingSuspensionNotice } from "../lib/hearing-schedule"

// SPEC-PORTAL-001 R3.7: first screen with four task shortcuts.
describe("first-screen shortcuts", () => {
  test("one link per analytics identifier, in the approved order", () => {
    expect(HOME_SHORTCUT_LINKS.map((link) => link.id)).toEqual([...HOME_SHORTCUTS])
    expect(HOME_SHORTCUT_LINKS.map((link) => link.href)).toEqual([
      "/#audiencias-virtuais",
      PROCESS_LOOKUP_URL,
      "/pauta",
      "/#contato",
    ])
  })

  test("the hearing shortcut targets the card with the Zoom video", () => {
    const card = SERVICES.find((service) => service.anchor === VIRTUAL_HEARINGS_ANCHOR)
    expect(card?.title).toBe("Audiências Virtuais")
    expect(card?.tutorialVideo).toBeDefined()
    // The case lookup shortcut reuses the "Consulta Processual" card link.
    expect(SERVICES.find((service) => service.title === "Consulta Processual")?.url).toBe(
      PROCESS_LOOKUP_URL,
    )
  })

  test("renders title, shortcuts and the notice when there is one", () => {
    const notice = hearingSuspensionNotice(new Date("2026-12-01T12:00:00-03:00"))
    expect(notice).toBe("Sem audiências designadas até 31/01/2027.")
    const html = renderToStaticMarkup(<Hero notice={notice} />)
    expect(html).toContain("Como podemos ajudar?")
    expect(html).toContain("Escolha o que você precisa resolver hoje.")
    expect(html).toContain("Sem audiências designadas até 31/01/2027.")
    expect(html.match(/<a /g)).toHaveLength(4)
    expect(html).toContain(`href="${PROCESS_LOOKUP_URL}" target="_blank" rel="noopener noreferrer"`)
    expect(html).toContain("(abre em nova aba)")
    // Every icon is decorative.
    expect(html.match(/<svg /g)?.length).toBe(html.match(/<svg [^>]*aria-hidden="true"/g)?.length)
  })

  test("no notice once the suspension is over", () => {
    expect(hearingSuspensionNotice(new Date("2027-02-01T12:00:00-03:00"))).toBeNull()
    const html = renderToStaticMarkup(<Hero notice={null} />)
    expect(html).not.toContain("Sem audiências")
    expect(html).toContain("Como podemos ajudar?")
  })
})
