import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { AdminAccessError } from "@/lib/admin-policy"
import { authorizeStaff, canAccessAdminPath } from "@/lib/staff-access"

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request })
  response.headers.set("Cache-Control", "private, no-store")
  function carrySession(target: NextResponse) {
    for (const cookie of response.cookies.getAll()) target.cookies.set(cookie)
    target.headers.set("Cache-Control", "private, no-store")
    return target
  }
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new AdminAccessError(503)
    const supabase = createServerClient(url, key, {
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
    const staff = await authorizeStaff(error ? null : user)
    if (!canAccessAdminPath(staff.role, request.nextUrl.pathname)) throw new AdminAccessError(403)
    // Forward any cookies refreshed in this request to Server Components as well.
    const next = NextResponse.next({ request })
    return carrySession(next)
  } catch (error) {
    const denied = error instanceof AdminAccessError ? error : new AdminAccessError(503)
    if (denied.status === 401) {
      const login = new URL("/login", request.url)
      login.searchParams.set("redirect", request.nextUrl.pathname)
      return carrySession(NextResponse.redirect(login))
    }
    const destination = new URL(
      denied.status === 403 ? "/acesso-negado" : "/servico-indisponivel",
      request.url,
    )
    return carrySession(NextResponse.rewrite(destination, { status: denied.status }))
  }
}

export const config = { matcher: ["/admin/:path*"] }
