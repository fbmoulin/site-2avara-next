import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import {
  ADMIN_SESSION_COOKIE_OPTIONS,
  AdminAccessError,
  activeSessionUser,
} from "@/lib/admin-policy"
import { adminContentSecurityPolicy, createNonce } from "@/lib/security-headers"
import { authorizeStaff, canAccessAdminPath } from "@/lib/staff-access"

export async function proxy(request: NextRequest) {
  // Administrative routes (SPEC-PORTAL-001 R2.1): fresh nonce per request. Next reads it from the
  // request CSP header and applies it to its scripts while rendering app/(admin).
  const nonce = createNonce()
  const csp = adminContentSecurityPolicy(
    nonce,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NODE_ENV === "development",
  )
  function forwardedHeaders() {
    // Built at the end so that cookies refreshed below (request.cookies.set) are included.
    const headers = new Headers(request.headers)
    headers.set("x-nonce", nonce)
    headers.set("Content-Security-Policy", csp)
    return headers
  }
  const response = NextResponse.next({ request })
  function carrySession(target: NextResponse) {
    for (const cookie of response.cookies.getAll()) target.cookies.set(cookie)
    target.headers.set("Cache-Control", "private, no-store")
    target.headers.set("Content-Security-Policy", csp)
    return target
  }

  const path = request.nextUrl.pathname
  // /login and the access status pages only need the CSP; authorization is for /admin.
  if (path !== "/admin" && !path.startsWith("/admin/"))
    return carrySession(NextResponse.next({ request: { headers: forwardedHeaders() } }))

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new AdminAccessError(503)
    const supabase = createServerClient(url, key, {
      cookieOptions: ADMIN_SESSION_COOKIE_OPTIONS,
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookies) {
          for (const { name, value, options } of cookies) {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          }
        },
      },
    })
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error && (!error.status || error.status === 429 || error.status >= 500))
      throw new AdminAccessError(503)
    // A session older than 8 hours counts as no session (Q-8): the visitor signs in again.
    const staff = await authorizeStaff(error ? null : activeSessionUser(user))
    if (!canAccessAdminPath(staff.role, path)) throw new AdminAccessError(403)
    // Forward any cookies refreshed in this request to Server Components as well.
    return carrySession(NextResponse.next({ request: { headers: forwardedHeaders() } }))
  } catch (error) {
    const denied = error instanceof AdminAccessError ? error : new AdminAccessError(503)
    if (denied.status === 401) {
      const login = new URL("/login", request.url)
      login.searchParams.set("redirect", path)
      return carrySession(NextResponse.redirect(login))
    }
    const destination = new URL(
      denied.status === 403 ? "/acesso-negado" : "/servico-indisponivel",
      request.url,
    )
    return carrySession(
      NextResponse.rewrite(destination, {
        status: denied.status,
        request: { headers: forwardedHeaders() },
      }),
    )
  }
}

// Every route of app/(admin). Keep in sync with ADMIN_PATHS in lib/security-headers.ts.
export const config = {
  matcher: ["/admin/:path*", "/login", "/acesso-negado", "/servico-indisponivel"],
}
