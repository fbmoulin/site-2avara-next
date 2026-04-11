import { getContacts } from "../actions"
import { ContatosClient } from "./contatos-client"

export default async function ContatosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const status = params.status ?? "all"
  const contacts = await getContacts(status)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contatos</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie as mensagens de contato recebidas
        </p>
      </div>

      <ContatosClient contacts={contacts} currentStatus={status} />
    </div>
  )
}
