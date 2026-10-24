"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { LayoutDashboard, Mail, Calendar, FileText, Newspaper, Globe, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { StaffRole } from "@/lib/staff-access"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/contatos", label: "Contatos", icon: Mail },
  { href: "/admin/agendamentos", label: "Agendamentos", icon: Calendar },
  { href: "/admin/pauta", label: "Pauta de audiências", icon: Calendar },
  { href: "/admin/demandas", label: "Demandas", icon: FileText },
  { href: "/admin/artigos", label: "Artigos", icon: Newspaper },
  { href: "/admin/noticias", label: "Notícias", icon: Globe },
  { href: "/admin/usuarios", label: "Usuários", icon: LayoutDashboard },
]

export function AdminSidebar({ email, role }: { email: string; role: StaffRole }) {
  const pathname = usePathname()
  const router = useRouter()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  async function handleLogout() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) return

    const supabase = createBrowserClient(supabaseUrl, supabaseKey)
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-card">
      {/* Logo area */}
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold text-foreground">Painel Admin</h2>
        <p className="text-xs text-muted-foreground">2ª Vara Cível de Cariacica</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems
          .filter((item) =>
            role === "estagiario"
              ? item.href === "/admin/pauta"
              : item.href !== "/admin/usuarios" || role === "responsavel",
          )
          .map((item) => {
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-4">
        <p className="mb-2 truncate text-xs text-muted-foreground" title={email}>
          {email}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
