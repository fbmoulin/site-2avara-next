import { describe, expect, test } from "bun:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import PrivacyPolicyPage, { metadata as privacyMetadata } from "../app/privacidade/page"
import TermsOfUsePage, { metadata as termsMetadata } from "../app/termos/page"
import { Footer } from "../components/footer"

const render = (component: () => React.ReactNode) => renderToStaticMarkup(createElement(component))
const count = (html: string, pattern: RegExp) => html.match(pattern)?.length ?? 0

describe("legal pages (R1.7)", () => {
  for (const [name, Page, metadata, heading] of [
    ["privacidade", PrivacyPolicyPage, privacyMetadata, "Política de Privacidade"],
    ["termos", TermsOfUsePage, termsMetadata, "Termos de Uso"],
  ] as const) {
    test(`/${name} has metadata, one h1, h2 sections, update date and the approval notice`, () => {
      expect(String(metadata.title)).toContain(heading)
      expect(metadata.description).toBeTruthy()
      const html = render(Page)
      expect(count(html, /<h1[\s>]/g)).toBe(1)
      expect(html).toContain(`>${heading}</h1>`)
      expect(count(html, /<h2[\s>]/g)).toBeGreaterThanOrEqual(5)
      expect(html).toContain('<time dateTime="2026-11-20">')
      expect(count(html, /data-testid="approval-notice"/g)).toBe(1)
      expect(html).toContain("https://www.tjes.jus.br")
    })
  }

  test("privacy policy keeps the TJES data officer channel as a visible pending marker", () => {
    const html = render(PrivacyPolicyPage)
    expect(html).toContain("[a confirmar: canal do encarregado do TJES]")
    expect(html).toContain("12 meses")
    expect(html).toContain("sa-east-1")
    expect(html).not.toMatch(/encarregado@|dpo@/i)
  })

  test("terms state that the portal does not replace official PJe/DJe communications", () => {
    const html = render(TermsOfUsePage)
    expect(html).toContain("não protocola petições")
    expect(html).toContain("PJe")
    expect(html).toContain("DJe")
    expect(html).toContain('href="https://portaldeservicos.pdpj.jus.br/consulta"')
  })
})

describe("footer legal links", () => {
  test("links to the legal pages with readable contrast and keeps the credit", () => {
    const html = render(Footer)
    expect(html).toMatch(/<a [^>]*href="\/privacidade"[^>]*>Política de Privacidade<\/a>/)
    expect(html).toMatch(/<a [^>]*href="\/termos"[^>]*>Termos de Uso<\/a>/)
    expect(html).not.toContain("text-slate-500")
    expect(html).not.toContain("text-slate-600")
    expect(html).toContain("Lex Intelligentia")
  })
})
