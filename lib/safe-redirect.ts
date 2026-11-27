// Where the login form may send the user after signing in (SPEC-PORTAL-001 R2.6): only a path of
// this site under /admin. Anything else (other origins, "//host", "/\host", other paths) → /admin.
export const DEFAULT_ADMIN_REDIRECT = "/admin"

export function safeAdminRedirect(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_ADMIN_REDIRECT
  // Resolve against a placeholder origin the way a browser would ("\\" counts as "/").
  const base = new URL("https://portal.invalid")
  let url: URL
  try {
    url = new URL(raw, base)
  } catch {
    return DEFAULT_ADMIN_REDIRECT
  }
  if (url.origin !== base.origin) return DEFAULT_ADMIN_REDIRECT
  if (url.pathname !== "/admin" && !url.pathname.startsWith("/admin/")) return DEFAULT_ADMIN_REDIRECT
  return `${url.pathname}${url.search}${url.hash}`
}
