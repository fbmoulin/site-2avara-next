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
    <div className="flex min-h-screen min-w-0 flex-col bg-background lg:flex-row">
      <AdminSidebar email={user.email ?? ""} role={user.role} />
      <div
        id="main-content"
        tabIndex={-1}
        className="admin-content min-w-0 flex-1 p-4 pb-24 sm:p-6 sm:pb-24"
      >
        {children}
      </div>
    </div>
  )
}
