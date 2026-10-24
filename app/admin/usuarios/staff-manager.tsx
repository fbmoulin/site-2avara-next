"use client"
import { useActionState } from "react"
import { registerStaff, linkStaff, updateStaff } from "./actions"

const field = "block w-full rounded border bg-background p-2"
function RoleField({ value = "estagiario" }: { value?: string }) {
  return (
    <label>
      Categoria
      <select className={field} name="role" defaultValue={value}>
        <option value="estagiario">Estagiário</option>
        <option value="assessor">Assessor</option>
      </select>
    </label>
  )
}
function ExistingStaff({
  user,
}: {
  user: { id: string; email: string; role: string; active: boolean }
}) {
  const [state, action, pending] = useActionState(updateStaff, { message: "" })
  return (
    <form action={action} className="space-y-3 rounded border p-4">
      <h3 className="font-semibold">{user.email}</h3>
      <input type="hidden" name="id" value={user.id} />
      <fieldset disabled={pending} className="flex flex-wrap items-end gap-3">
        <RoleField value={user.role} />
        <label>
          Acesso
          <select className={field} name="active" defaultValue={String(user.active)}>
            <option value="true">Ativo</option>
            <option value="false">Desativado</option>
          </select>
        </label>
        <button className="rounded border p-2">Salvar permissões</button>
      </fieldset>
      <p role="status">{state.message}</p>
    </form>
  )
}
export function StaffManager({
  users,
}: {
  users: { id: string; email: string; role: string; active: boolean }[]
}) {
  const [state, action, pending] = useActionState(registerStaff, { message: "" })
  const [linkState, linkAction, linking] = useActionState(linkStaff, { message: "" })
  return (
    <div className="space-y-6">
      <form action={action} className="space-y-3 rounded border p-4">
        <h2 className="text-xl font-semibold">Cadastrar usuário</h2>
        <fieldset disabled={pending} className="grid gap-3 md:grid-cols-2">
          <label>
            E-mail
            <input
              className={field}
              name="email"
              type="email"
              required
              maxLength={255}
              autoComplete="off"
            />
          </label>
          <RoleField />
          <label>
            Senha inicial
            <input
              className={field}
              name="password"
              type="password"
              required
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
            />
          </label>
          <button className="self-end rounded bg-primary p-2 text-primary-foreground">
            {pending ? "Cadastrando…" : "Cadastrar usuário"}
          </button>
        </fieldset>
        <p role="status">{state.message}</p>
      </form>
      <details className="rounded border p-4">
        <summary>Vincular conta existente no Supabase</summary>
        <form action={linkAction} className="mt-3 space-y-3">
          <fieldset disabled={linking} className="space-y-3">
            <label>
              UUID da conta
              <input className={field} name="id" required />
            </label>
            <RoleField />
            <button className="rounded border p-2">Verificar e vincular conta</button>
          </fieldset>
          <p role="status">{linkState.message}</p>
        </form>
      </details>
      <h2 className="text-xl font-semibold">Contas da equipe</h2>
      {users.length === 0 ? (
        <p>Nenhum assessor ou estagiário cadastrado.</p>
      ) : (
        users.map((user) => (
          <ExistingStaff key={`${user.id}:${user.role}:${user.active}`} user={user} />
        ))
      )}
    </div>
  )
}
