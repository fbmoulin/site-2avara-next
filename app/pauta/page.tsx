import Link from "next/link"
import { connection } from "next/server"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { hearingSchedules } from "@/lib/db/schema"
import { addDays, currentWeek, formatDate, scheduleSchema } from "@/lib/hearing-schedule"

export const metadata = { title: "Pauta semanal de audiências — 2ª Vara Cível de Cariacica" }

export default async function HearingSchedulePage() {
  await connection()
  const weekStart = currentWeek()
  let schedule:
    | { hearings: import("@/lib/hearing-schedule").Hearing[]; updatedAt: Date }
    | undefined
  let unavailable = false
  try {
    const [record] = await db
      .select({
        hearings: hearingSchedules.publishedHearings,
        updatedAt: hearingSchedules.publishedAt,
      })
      .from(hearingSchedules)
      .where(and(eq(hearingSchedules.weekStart, weekStart), eq(hearingSchedules.isPublished, true)))
    if (record?.updatedAt)
      schedule = {
        ...record,
        updatedAt: record.updatedAt,
        hearings: scheduleSchema.parse({ weekStart, hearings: record.hearings }).hearings,
      }
  } catch {
    unavailable = true
    console.error("[hearing-schedule] read_failed")
  }
  return (
    <section id="main-content" className="mx-auto max-w-5xl space-y-6 px-4 py-12">
      <Link href="/" className="underline">
        Voltar ao início
      </Link>
      <h1 className="text-3xl font-bold">Pauta semanal de audiências</h1>
      <p>
        Semana de {formatDate(weekStart)} a {formatDate(addDays(weekStart, 6))}. Horários de
        Brasília.
      </p>
      <p>
        A pauta revisada é disponibilizada às segundas-feiras e pode receber atualizações durante a
        semana.
      </p>
      {unavailable ? (
        <p role="alert">Não foi possível consultar a pauta. Tente novamente mais tarde.</p>
      ) : !schedule ? (
        <p role="status">A pauta desta semana ainda não foi publicada.</p>
      ) : schedule.hearings.length === 0 ? (
        <p>Nenhuma audiência consta na pauta publicada desta semana.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left">
            <caption className="sr-only">Audiências confirmadas para a semana</caption>
            <thead className="bg-muted">
              <tr>
                {["Data", "Horário", "Tipo", "Modalidade", "Identificação"].map((label) => (
                  <th scope="col" className="p-3" key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...schedule.hearings]
                .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
                .map((hearing, index) => (
                  <tr className="border-t" key={index}>
                    <td className="p-3">{formatDate(hearing.date)}</td>
                    <td className="p-3">{hearing.time}</td>
                    <td className="p-3">{hearing.type}</td>
                    <td className="p-3">{hearing.modality}</td>
                    <td className="p-3">{hearing.reference || "—"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
      {schedule && (
        <p className="text-sm text-muted-foreground">
          Atualizada em{" "}
          {schedule.updatedAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}{" "}
          (Brasília).
        </p>
      )}
      <div className="rounded-lg bg-muted p-5">
        <h2 className="font-semibold">Participação nas audiências</h2>
        <p>
          Nas modalidades online e híbrida, a participação remota ocorre pelo Zoom. Utilize o link
          recebido na intimação e confira nela o local e a modalidade de comparecimento.
        </p>
        <Link className="underline" href="/#servicos">
          Ver orientações para audiências e instalação do Zoom
        </Link>
      </div>
    </section>
  )
}
