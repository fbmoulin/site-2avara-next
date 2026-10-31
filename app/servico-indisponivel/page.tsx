import Link from "next/link"

export const metadata = {
  title: "Serviço temporariamente indisponível",
  robots: { index: false, follow: false },
}

export default function ServiceUnavailablePage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-20">
      <h1 className="text-2xl font-semibold">Serviço temporariamente indisponível</h1>
      <p className="mt-4">
        Não foi possível verificar o acesso administrativo. Tente novamente mais tarde.
      </p>
      <Link className="mt-6 inline-block underline" href="/">
        Voltar ao início
      </Link>
    </section>
  )
}
