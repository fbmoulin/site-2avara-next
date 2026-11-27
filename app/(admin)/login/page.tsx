import { safeAdminRedirect } from "@/lib/safe-redirect"
import { LoginForm } from "./login-form"

export const metadata = { title: "Entrar — Painel da 2ª Vara Cível de Cariacica" }

// The redirect target is validated on the server: only same-origin paths under /admin (R2.6).
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string | string[] }>
}) {
  const { redirect } = await searchParams
  return (
    <LoginForm redirectTo={safeAdminRedirect(Array.isArray(redirect) ? redirect[0] : redirect)} />
  )
}
