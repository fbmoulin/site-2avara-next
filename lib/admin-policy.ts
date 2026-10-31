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
