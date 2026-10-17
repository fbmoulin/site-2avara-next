import Link from "next/link"

export const metadata = { title: "Acesso não autorizado", robots: { index: false, follow: false } }

export default function AccessDeniedPage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-20">
      <h1 className="text-2xl font-semibold">Acesso não autorizado</h1>
      <p className="mt-4">
        Sua conta não possui permissão para acessar o painel administrativo. Entre em contato com o
        responsável pelo portal.
      </p>
      <Link className="mt-6 inline-block underline" href="/">
        Voltar ao início
      </Link>
    </section>
  )
}
