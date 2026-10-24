import { z } from "zod/v4"

export function localDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

export function currentWeek(now = new Date()) {
  const date = localDate(now)
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()
  return addDays(date, -((weekday + 6) % 7))
}

export const dateSchema = z.iso.date()
export const weekSchema = dateSchema.refine(
  (date) => new Date(`${date}T12:00:00Z`).getUTCDay() === 1,
  "Selecione a segunda-feira da semana.",
)
export const hearingSchema = z
  .object({
    date: dateSchema,
    time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Horário inválido."),
    type: z.enum(["Instrução e julgamento", "Conciliação", "Outra"]),
    modality: z.enum(["Online", "Presencial", "Híbrida"]),
    reference: z.string().trim().max(100),
  })
  .strict()

export const scheduleSchema = z
  .object({
    weekStart: weekSchema,
    hearings: z.array(hearingSchema).max(21),
  })
  .strict()
  .superRefine(({ weekStart, hearings }, ctx) => {
    const end = addDays(weekStart, 7)
    const days = new Map<string, number[]>()
    for (const hearing of hearings) {
      if (hearing.date < weekStart || hearing.date >= end) {
        ctx.addIssue({
          code: "custom",
          message: "Todas as audiências devem pertencer à semana selecionada.",
        })
      }
      const [hour, minute] = hearing.time.split(":").map(Number)
      const slots = days.get(hearing.date) ?? []
      slots.push(hour * 60 + minute)
      days.set(hearing.date, slots)
    }
    for (const slots of days.values()) {
      if (slots.length > 3)
        ctx.addIssue({ code: "custom", message: "Limite de três audiências por dia." })
      slots.sort((a, b) => a - b)
      if (slots.some((slot, index) => index > 0 && slot - slots[index - 1] < 60)) {
        ctx.addIssue({ code: "custom", message: "Reserve pelo menos uma hora entre audiências." })
      }
    }
  })

export type Hearing = z.infer<typeof hearingSchema>
export function formatDate(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  })
}
