import { redirect } from "next/navigation"
import { requirePanelUser } from "@/lib/auth"
import { AdminAccessError } from "@/lib/admin-policy"
import { AdminSidebar } from "@/components/admin/sidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePanelUser().catch((error: unknown) => {
    if (error instanceof AdminAccessError) {
      if (error.status === 401) redirect("/login")
      if (error.status === 403) redirect("/acesso-negado")
      if (error.status === 503) redirect("/servico-indisponivel")
    }
    throw error
  })

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar email={user.email ?? ""} role={user.role} />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
