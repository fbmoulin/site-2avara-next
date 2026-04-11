import { getDemands } from "../actions"
import { DemandasClient } from "./demandas-client"

export default async function DemandasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const status = params.status ?? "all"
  const demands = await getDemands(status)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Demandas</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie as demandas processuais recebidas
        </p>
      </div>

      <DemandasClient demands={demands} currentStatus={status} />
    </div>
  )
}
