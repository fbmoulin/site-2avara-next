import { getAppointments } from "../actions"
import { AgendamentosClient } from "./agendamentos-client"

export default async function AgendamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const status = params.status ?? "all"
  const appointments = await getAppointments(status)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Agendamentos</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie os agendamentos de atendimento
        </p>
      </div>

      <AgendamentosClient appointments={appointments} currentStatus={status} />
    </div>
  )
}
