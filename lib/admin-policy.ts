import { z } from "zod/v4"

export class AdminAccessError extends Error {
  constructor(public readonly status: 401 | 403 | 503) {
    super(
      status === 401
        ? "Autenticação necessária."
        : status === 403
          ? "Acesso não autorizado."
          : "Acesso administrativo temporariamente indisponível."
    )
    this.name = "AdminAccessError"
  }
}

// Pure policy: no browser-supplied role or metadata participates in authorization.
export function authorizeAdmin<T extends { id: string }>(
  user: T | null,
  configuredIds: string | undefined
): T {
  if (!user) throw new AdminAccessError(401)
  const ids = configuredIds?.split(",").map((id) => id.trim().toLowerCase())
  if (!ids?.length || ids.some((id) => !z.string().uuid().safeParse(id).success)) {
    throw new AdminAccessError(503)
  }
  if (!ids.includes(user.id.toLowerCase())) throw new AdminAccessError(403)
  return user
}

// Panel sessions last 8 hours from the password sign-in (Q-8, approved on 21/11/2026). Token
// refreshes do not extend it: Supabase only moves last_sign_in_at on a new sign-in.
export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60

// Returns null (no identity, so 401) when the session is older than the limit or has no
// verifiable sign-in time. Fail-closed: an unknown age never counts as a valid session.
export function activeSessionUser<T extends { last_sign_in_at?: string | null }>(
  user: T | null,
  now = Date.now(),
): T | null {
  if (!user) return null
  const signedIn = user.last_sign_in_at ? Date.parse(user.last_sign_in_at) : Number.NaN
  if (!Number.isFinite(signedIn)) return null
  const age = now - signedIn
  if (age < -60_000 || age > ADMIN_SESSION_MAX_AGE_SECONDS * 1000) return null
  return user
}

// Cookie lifetime for the Supabase clients: the browser drops the session with the same limit.
export const ADMIN_SESSION_COOKIE_OPTIONS = { maxAge: ADMIN_SESSION_MAX_AGE_SECONDS }
