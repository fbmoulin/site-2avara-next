import Link from "next/link"

// Unknown panel addresses (app/(admin)/admin/[...path]), inside the panel layout and its <main>,
// rendered on demand with the nonce CSP (R3.4).
export default function AdminNotFound() {
  return (
    <div className="max-w-xl py-8">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="mt-4">Esta página não existe no painel.</p>
      <Link href="/admin" className="mt-6 inline-block font-medium underline underline-offset-2">
        Voltar ao painel
      </Link>
    </div>
  )
}
