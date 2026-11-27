export const metadata = {
  title: "Serviço temporariamente indisponível",
  robots: { index: false, follow: false },
}

export default function ServiceUnavailablePage() {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-xl px-4 py-20">
      <h1 className="text-2xl font-semibold">Serviço temporariamente indisponível</h1>
      <p className="mt-4">
        Não foi possível verificar o acesso administrativo. Tente novamente mais tarde.
      </p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- full load so the public page gets its own CSP (proxy.ts) */}
      <a className="mt-6 inline-block underline" href="/">
        Voltar ao início
      </a>
    </main>
  )
}
