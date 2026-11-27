export const metadata = { title: "Acesso não autorizado", robots: { index: false, follow: false } }

export default function AccessDeniedPage() {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-xl px-4 py-20">
      <h1 className="text-2xl font-semibold">Acesso não autorizado</h1>
      <p className="mt-4">
        Sua conta não possui permissão para acessar o painel administrativo. Entre em contato com o
        responsável pelo portal.
      </p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- full load so the public page gets its own CSP (proxy.ts) */}
      <a className="mt-6 inline-block underline" href="/">
        Voltar ao início
      </a>
    </main>
  )
}
