import { eq } from "drizzle-orm"
import { requirePanelUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { hearingSchedules } from "@/lib/db/schema"
import { currentWeek, weekSchema } from "@/lib/hearing-schedule"
import { ScheduleEditor } from "./schedule-editor"

export default async function ScheduleAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const user = await requirePanelUser()
  const requested = (await searchParams).week
  const week = weekSchema.safeParse(requested ?? currentWeek())
  if (!week.success)
    return (
      <p role="alert">
        Selecione uma segunda-feira válida. <a href="/admin/pauta">Voltar à pauta</a>
      </p>
    )
  const [schedule] = await db
    .select()
    .from(hearingSchedules)
    .where(eq(hearingSchedules.weekStart, week.data))
  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold">Pauta de audiências</h1>
      <p>
        Cadastre apenas informações destinadas à divulgação pública, sem nomes das partes, dados
        sigilosos ou credenciais do Zoom.
      </p>
      <form className="flex flex-wrap items-end gap-3" action="/admin/pauta" method="get">
        <label>
          Segunda-feira da semana
          <input
            className="block rounded border p-2"
            type="date"
            name="week"
            defaultValue={week.data}
            required
          />
        </label>
        <button className="rounded border px-4 py-2" type="submit">
          Carregar semana
        </button>
      </form>
      <p className="text-sm text-muted-foreground">
        A pauta liberada fica visível a partir da segunda-feira correspondente, no horário de
        Brasília. Revisões liberadas da semana atual aparecem imediatamente. Salvar rascunho
        preserva a versão pública até nova liberação pelo responsável ou assessor.
      </p>
      <ScheduleEditor
        canPublish={user.role !== "estagiario"}
        key={`${week.data}:${schedule?.version ?? 0}`}
        weekStart={week.data}
        hearings={schedule?.hearings ?? []}
        version={schedule?.version ?? 0}
        published={schedule?.isPublished ?? false}
      />
    </section>
  )
}
