"use client"

import "./globals.css"
import { RouteError } from "@/components/route-error"

// Failure of the root layout (R3.4): replaces the whole document, so it brings its own <html>,
// <body>, styles and title (metadata exports are not supported here).
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-full flex-col antialiased">
        <title>Erro | 2ª Vara Cível de Cariacica</title>
        <RouteError error={error} retry={retry} area="public" withMain />
      </body>
    </html>
  )
}
