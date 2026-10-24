"use client"

import { useActionState, useState } from "react"
import { addDays, type Hearing } from "@/lib/hearing-schedule"
import { saveSchedule } from "./actions"

export function ScheduleEditor({
  weekStart,
  hearings,
  version,
  published,
  canPublish,
}: {
  weekStart: string
  hearings: Hearing[]
  version: number
  published: boolean
  canPublish: boolean
}) {
  const [rows, setRows] = useState(hearings)
  const [state, action, pending] = useActionState(saveSchedule, { message: "" })
  const field = "block w-full rounded border bg-background p-2"
  function change(index: number, key: keyof Hearing, value: string) {
    setRows(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)))
  }
  function add() {
    const slots = [1, 2, 3].flatMap((day) =>
      ["14:00", "15:00", "16:00"].map((time) => ({ date: addDays(weekStart, day), time })),
    )
    const next = slots.find(
      (slot) => !rows.some((row) => row.date === slot.date && row.time === slot.time),
    ) ?? { date: addDays(weekStart, 1), time: "14:00" }
    setRows([
      ...rows,
      { ...next, type: "Instrução e julgamento", modality: "Híbrida", reference: "" },
    ])
  }
  return (
    <form action={action} className="space-y-5">
      <p>
        Status: <strong>{published ? "Liberada para a semana" : "Rascunho"}</strong>
      </p>
      <p className="text-sm">
        Sugestão: terça a quinta, às 14h, 15h e 16h. Máximo de três por dia, com intervalo mínimo de
        uma hora. Ajuste a modalidade conforme a designação.
      </p>
      <input type="hidden" name="payload" value={JSON.stringify({ weekStart, hearings: rows })} />
      <input type="hidden" name="version" value={version} />
      <fieldset disabled={pending} className="space-y-4">
        {rows.map((row, index) => (
          <fieldset key={index} className="grid gap-3 rounded-lg border p-4 md:grid-cols-3">
            <legend className="px-2 font-semibold">Audiência {index + 1}</legend>
            <label>
              Data
              <input
                className={field}
                type="date"
                value={row.date}
                min={weekStart}
                max={addDays(weekStart, 6)}
                onChange={(e) => change(index, "date", e.target.value)}
                required
              />
            </label>
            <label>
              Horário (Brasília)
              <input
                className={field}
                type="time"
                value={row.time}
                onChange={(e) => change(index, "time", e.target.value)}
                required
              />
            </label>
            <label>
              Tipo
              <select
                className={field}
                value={row.type}
                onChange={(e) => change(index, "type", e.target.value)}
              >
                {["Instrução e julgamento", "Conciliação", "Outra"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              Modalidade
              <select
                className={field}
                value={row.modality}
                onChange={(e) => change(index, "modality", e.target.value)}
              >
                {["Online", "Presencial", "Híbrida"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              Identificação pública (opcional)
              <input
                className={field}
                maxLength={100}
                value={row.reference}
                onChange={(e) => change(index, "reference", e.target.value)}
              />
            </label>
            <button
              className="self-end rounded border p-2"
              type="button"
              onClick={() => setRows(rows.filter((_, i) => i !== index))}
            >
              Remover audiência {index + 1}
            </button>
          </fieldset>
        ))}
        <button
          className="rounded border px-4 py-2"
          type="button"
          disabled={rows.length >= 21}
          onClick={add}
        >
          Adicionar audiência
        </button>
        {rows.length === 0 && (
          <p>Uma semana vazia só será divulgada como “sem audiências” após a liberação.</p>
        )}
        <div className="flex flex-wrap gap-3">
          {canPublish && published && (
            <button className="rounded border px-4 py-2" name="intent" value="withdraw">
              Retirar publicação
            </button>
          )}
          <button className="rounded border px-4 py-2" name="intent" value="draft">
            Salvar rascunho
          </button>
          {canPublish && (
            <button
              className="rounded bg-primary px-4 py-2 text-primary-foreground"
              name="intent"
              value="publish"
            >
              Revisar e liberar semana
            </button>
          )}
        </div>
      </fieldset>
      {pending && <p role="status">Salvando pauta…</p>}
      {state.message && <p role="status">{state.message}</p>}
    </form>
  )
}
