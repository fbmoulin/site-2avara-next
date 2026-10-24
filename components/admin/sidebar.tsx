"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Mail,
  Calendar,
  FileText,
  Newspaper,
  Globe,
  LogOut,
  Menu,
  X,
} from "lucide-react"
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
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)

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
    <aside
      className="w-full shrink-0 border-b border-border bg-card lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-b-0"
      onKeyDown={(event) => {
        if (event.key === "Escape" && menuOpen) {
          setMenuOpen(false)
          menuButton.current?.focus()
        }
      }}
    >
      {/* Logo area */}
      <div className="flex items-center justify-between gap-3 p-4 lg:border-b lg:border-border">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">Painel Admin</h2>
          <p className="text-xs text-muted-foreground">2ª Vara Cível de Cariacica</p>
        </div>
        <button
          ref={menuButton}
          type="button"
          aria-expanded={menuOpen}
          aria-controls="admin-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-medium focus-visible:outline-2 lg:hidden"
        >
          {menuOpen ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
          {menuOpen ? "Fechar" : "Menu"}
          <span className="sr-only"> administrativo</span>
        </button>
      </div>

      <div
        id="admin-navigation"
        className={cn("flex-col lg:flex lg:flex-1", menuOpen ? "flex" : "hidden")}
      >
        {/* Navigation */}
        <nav aria-label="Administração" className="flex-1 space-y-1 p-3">
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
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4 shrink-0" aria-hidden="true" />
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
      </div>
    </aside>
  )
}
