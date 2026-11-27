import { describe, expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import AdminGroupError from "../app/(admin)/error"
import AdminError from "../app/(admin)/admin/error"
import AdminLoading from "../app/(admin)/admin/loading"
import AdminNotFound from "../app/(admin)/admin/not-found"
import PublicError from "../app/(public)/error"
import PublicNotFound from "../app/(public)/not-found"
import NewsLoading from "../app/(public)/noticias/loading"
import RootNotFound from "../app/not-found"

// SPEC-PORTAL-001 R3.4: error, not-found and loading screens in Portuguese, with exactly one <main>
// per page (the public and panel layouts already have theirs).
const retry = () => {}
const mains = (html: string) => (html.match(/<main\b/g) ?? []).length

describe("error boundaries", () => {
  test("public error: Portuguese alert inside the layout's <main>, retry and link home", () => {
    const html = renderToStaticMarkup(<PublicError error={new Error("x")} retry={retry} />)
    expect(html).toContain('role="alert"')
    expect(html).toContain("Não foi possível carregar esta página")
    expect(html).toContain("Tentar novamente")
    expect(html).toContain('href="/"')
    expect(mains(html)).toBe(0)
  })

  test("the server digest is shown for support; the message never is", () => {
    const error = Object.assign(new Error("detalhe interno com dados"), { digest: "123abc" })
    const html = renderToStaticMarkup(<PublicError error={error} retry={retry} />)
    expect(html).toContain("123abc")
    expect(html).not.toContain("detalhe interno")
  })

  test("admin errors link back to the panel; the group-level one brings its own <main>", () => {
    const inPanel = renderToStaticMarkup(<AdminError error={null} retry={retry} />)
    expect(inPanel).toContain('href="/admin"')
    expect(inPanel).toContain("Voltar ao painel")
    expect(mains(inPanel)).toBe(0)
    const group = renderToStaticMarkup(<AdminGroupError error={null} retry={retry} />)
    expect(mains(group)).toBe(1)
    expect(group).toContain('id="main-content"')
  })
})

describe("not found", () => {
  test("root 404 has its own header and one <main>", () => {
    const html = renderToStaticMarkup(<RootNotFound />)
    expect(mains(html)).toBe(1)
    expect(html).toContain("Página não encontrada")
    for (const href of ["/", "/pauta", "/noticias", "/artigos", "/#contato"])
      expect(html).toContain(`href="${href}"`)
  })

  test("public and panel 404 render inside their layouts", () => {
    expect(mains(renderToStaticMarkup(<PublicNotFound />))).toBe(0)
    const admin = renderToStaticMarkup(<AdminNotFound />)
    expect(mains(admin)).toBe(0)
    expect(admin).toContain("Esta página não existe no painel.")
  })
})

describe("loading", () => {
  test("loading states are announced as status in Portuguese", () => {
    const news = renderToStaticMarkup(<NewsLoading />)
    expect(news).toContain('role="status"')
    expect(news).toContain("Carregando notícias…")
    const admin = renderToStaticMarkup(<AdminLoading />)
    expect(admin).toContain('role="status"')
    expect(admin).toContain("Carregando…")
  })
})
