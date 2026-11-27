import { requireOwner } from "@/lib/auth"
import { db } from "@/lib/db"
import { staffUsers } from "@/lib/db/schema"
import { StaffManager } from "./staff-manager"

export default async function UsersPage() {
  await requireOwner()
  const users = await db
    .select({
      id: staffUsers.id,
      email: staffUsers.email,
      role: staffUsers.role,
      active: staffUsers.active,
    })
    .from(staffUsers)
  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Usuários</h1>
      <p>
        Assessores acessam as rotinas administrativas. Estagiários editam apenas rascunhos da pauta.
        Somente o responsável gerencia usuários.
      </p>
      {!process.env.SUPABASE_SERVICE_ROLE_KEY && (
        <p role="status">
          O cadastro de novas contas aguarda a configuração segura do Supabase neste ambiente.
        </p>
      )}
      <StaffManager users={users} />
    </section>
  )
}
