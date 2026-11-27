"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod/v4"
import { requirePanelUser } from "@/lib/auth"
import { AdminAccessError } from "@/lib/admin-policy"
import { db } from "@/lib/db"
import { hearingSchedules } from "@/lib/db/schema"
import { scheduleSchema } from "@/lib/hearing-schedule"

export async function saveSchedule(_previous: { message: string }, form: FormData) {
  const user = await requirePanelUser()
  if (user.role === "estagiario" && form.get("intent") !== "draft") throw new AdminAccessError(403)
  const raw = form.get("payload")
  if (typeof raw !== "string" || raw.length > 16000) return { message: "Pauta inválida." }
  let input: unknown
  try {
    input = JSON.parse(raw)
  } catch {
    return { message: "Pauta inválida." }
  }
  const parsed = scheduleSchema.safeParse(input)
  if (!parsed.success) return { message: parsed.error.issues[0].message }
  const version = z.coerce.number().int().min(0).max(2147483646).safeParse(form.get("version"))
  const intent = form.get("intent")
  if (!version.success || !["draft", "publish", "withdraw"].includes(String(intent)))
    return { message: "Operação inválida." }
  const values = {
    ...parsed.data,
    hearings: [...parsed.data.hearings].sort((a, b) =>
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
    ),
    ...(intent === "publish"
      ? { isPublished: true, publishedHearings: parsed.data.hearings, publishedAt: new Date() }
      : intent === "withdraw"
        ? { isPublished: false }
        : {}),
    updatedAt: new Date(),
    updatedBy: user.id,
    version: version.data + 1,
  }
  try {
    // Optimistic concurrency: never silently overwrite another editor's version.
    const saved =
      version.data === 0
        ? await db
            .insert(hearingSchedules)
            .values(values)
            .onConflictDoNothing()
            .returning({ version: hearingSchedules.version })
        : await db
            .update(hearingSchedules)
            .set(values)
            .where(
              and(
                eq(hearingSchedules.weekStart, values.weekStart),
                eq(hearingSchedules.version, version.data),
              ),
            )
            .returning({ version: hearingSchedules.version })
    if (!saved.length)
      return {
        message: "A pauta foi alterada por outra pessoa. Recarregue a semana antes de salvar.",
      }
  } catch {
    console.error("[hearing-schedule] persistence_failed")
    return { message: "Não foi possível salvar. Seus dados continuam no formulário." }
  }
  revalidatePath("/admin/pauta")
  revalidatePath("/pauta")
  return {
    message:
      intent === "publish"
        ? "Pauta revisada e liberada para a semana selecionada."
        : intent === "withdraw"
          ? "Publicação retirada."
          : "Rascunho salvo. A versão pública permanece inalterada.",
  }
}
