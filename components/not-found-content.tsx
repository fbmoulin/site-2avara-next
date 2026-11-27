// Text of the 404 pages (SPEC-PORTAL-001 R3.4). Server component with plain links only: the root
// not-found ships with every route, so it must not pull client code into the admin pages.
const LINKS = [
  { href: "/", label: "Página inicial" },
  { href: "/pauta", label: "Pauta semanal de audiências" },
  { href: "/noticias", label: "Notícias" },
  { href: "/artigos", label: "Artigos" },
  { href: "/#contato", label: "Contato" },
]

export function NotFoundContent({ heading = "Página não encontrada" }: { heading?: string }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <p className="text-sm font-semibold tracking-wider text-amber-800 uppercase">Erro 404</p>
      <h1 className="mt-2 text-3xl font-bold text-foreground">{heading}</h1>
      <p className="mt-4 text-foreground/80">
        O endereço pode ter sido digitado errado ou a página pode ter saído do ar.
      </p>
      <nav aria-label="Páginas do portal" className="mt-6">
        <ul className="space-y-2">
          {LINKS.map((link) => (
            <li key={link.href}>
              {/* Plain <a>: a full load also suits the admin routes, which use another CSP. */}
              <a
                href={link.href}
                className="font-medium text-foreground underline underline-offset-2"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
