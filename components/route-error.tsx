"use client"

import { useEffect } from "react"
import { initLogger, log } from "@/lib/logger"

interface RouteErrorProps {
  error: unknown
  retry: () => void
  /** Where the error happened: the public pages or the administrative panel. */
  area: "public" | "admin"
  /** Render the page's <main> when the boundary replaces the layout that has it. */
  withMain?: boolean
}

// Shared fallback of the error.tsx/global-error.tsx files (SPEC-PORTAL-001 R3.4). Logs only the
// error digest (an identifier of the server log), never the message. Links are plain <a>: a full
// load gives the destination its own CSP (public or admin nonce, proxy.ts).
export function RouteError({ error, retry, area, withMain = false }: RouteErrorProps) {
  const digest =
    error && typeof error === "object" && "digest" in error && typeof error.digest === "string"
      ? error.digest
      : undefined

  useEffect(() => {
    initLogger()
    log.error("route_error", { reason: digest ? `digest ${digest}` : "client", status: 500 })
  }, [digest])

  const content = (
    <div className="mx-auto max-w-xl px-4 py-16" role="alert">
      <h1 className="text-2xl font-bold text-foreground">Não foi possível carregar esta página</h1>
      <p className="mt-4 text-foreground/80">
        Ocorreu um erro inesperado. Tente novamente em instantes.
        {area === "public"
          ? " Se o problema continuar, use os canais de contato da vara."
          : " Se o problema continuar, avise o responsável pelo portal."}
      </p>
      {digest && (
        <p className="mt-2 text-sm text-foreground/80">
          Código para suporte: <code>{digest}</code>
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex h-11 items-center rounded-lg bg-slate-900 px-5 font-semibold text-white hover:bg-slate-800"
        >
          Tentar novamente
        </button>
        <a
          href={area === "public" ? "/" : "/admin"}
          className="inline-flex h-11 items-center rounded-lg border border-slate-900 px-5 font-semibold text-slate-900 hover:bg-slate-100"
        >
          {area === "public" ? "Voltar ao início" : "Voltar ao painel"}
        </a>
      </div>
    </div>
  )

  if (!withMain) return content
  return (
    <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
      {content}
    </main>
  )
}
