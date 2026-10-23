import "server-only"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { AdminAccessError, authorizeAdmin } from "./admin-policy"

export async function createSupabaseServer() {
  const cookieStore = await cookies()
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new AdminAccessError(503)
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch (error) {
            // Server Components cannot write cookies; Proxy refreshes them.
            if (
              !(error instanceof Error) ||
              !error.message.includes("Cookies can only be modified")
            )
              throw error
          }
        },
      },
    }
  )
}

export async function getUser() {
  // Keep Next.js request/dynamic rendering signals outside the provider catch.
  const supabase = await createSupabaseServer()
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error && (!error.status || error.status === 429 || error.status >= 500))
      throw new AdminAccessError(503)
    return error ? null : user
  } catch (error) {
    if (error instanceof AdminAccessError) throw error
    throw new AdminAccessError(503)
  }
}

export async function requireAdmin() {
  return authorizeAdmin(await getUser(), process.env.ADMIN_USER_IDS)
}
