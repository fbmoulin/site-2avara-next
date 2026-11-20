import { NextResponse } from "next/server"

const MESSAGE =
  "Este serviço foi desativado. Para falar com a vara, use o formulário de contato do portal (/#contato)."

/**
 * Handlers for retired public endpoints (SPEC-PORTAL-001 R1.5): every method answers 410,
 * without reading the body, writing to the database or sending e-mail.
 */
export function retiredRouteHandlers() {
  const handler = () =>
    NextResponse.json({ error: MESSAGE }, { status: 410, headers: { "Cache-Control": "no-store" } })
  return {
    GET: handler,
    HEAD: handler,
    POST: handler,
    PUT: handler,
    PATCH: handler,
    DELETE: handler,
    OPTIONS: handler,
  }
}
