import type { Metadata } from "next"
import { NotFoundContent } from "@/components/not-found-content"

export const metadata: Metadata = { title: "Página não encontrada" }

// Addresses that match no route (R3.4). Renders in the root layout, outside the public and admin
// groups, so it brings its own header and the page's only <main>.
export default function NotFound() {
  return (
    <>
      <header className="bg-slate-900 px-4 py-4 text-white">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="font-semibold">
          2ª Vara Cível de Cariacica
        </a>
      </header>
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <NotFoundContent />
      </main>
    </>
  )
}
