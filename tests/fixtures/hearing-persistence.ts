import { mock } from "bun:test"
import assert from "node:assert/strict"
import { PGlite } from "@electric-sql/pglite"
import { drizzle } from "drizzle-orm/pglite"
import { generateDrizzleJson, generateMigration } from "drizzle-kit/api"
import * as schema from "../../lib/db/schema"
import { currentWeek, addDays } from "../../lib/hearing-schedule"

const pg = await PGlite.create()
for (const sql of await generateMigration(generateDrizzleJson({}), generateDrizzleJson(schema)))
  await pg.exec(sql)
const db = drizzle(pg, { schema })
mock.module("../../lib/db", () => ({ db }))
let role = "responsavel"
mock.module("../../lib/auth", () => ({
  requirePanelUser: async () => ({ id: "11111111-1111-4111-8111-111111111111", role }),
}))
mock.module("next/cache", () => ({ revalidatePath: () => {} }))
const { saveSchedule } = await import("../../app/admin/pauta/actions")
const weekStart = currentWeek()
function form(version: number, intent = "publish") {
  const result = new FormData()
  result.set(
    "payload",
    JSON.stringify({
      weekStart,
      hearings: [
        {
          date: addDays(weekStart, 1),
          time: "14:00",
          type: "Instrução e julgamento",
          modality: "Online",
          reference: "Teste sintético",
        },
      ],
    }),
  )
  result.set("version", String(version))
  result.set("intent", intent)
  return result
}
try {
  const initial = await Promise.all([
    saveSchedule({ message: "" }, form(0)),
    saveSchedule({ message: "" }, form(0)),
  ])
  assert.equal(initial.filter((result) => result.message.includes("liberada")).length, 1)
  assert.equal(initial.filter((result) => result.message.includes("outra pessoa")).length, 1)
  role = "estagiario"
  await assert.rejects(() => saveSchedule({ message: "" }, form(1, "publish")), { status: 403 })
  await assert.rejects(() => saveSchedule({ message: "" }, form(1, "withdraw")), { status: 403 })
  const edits = await Promise.all([
    saveSchedule({ message: "" }, form(1, "draft")),
    saveSchedule({ message: "" }, form(1, "draft")),
  ])
  assert.equal(edits.filter((result) => result.message.includes("Rascunho salvo")).length, 1)
  const [record] = await db.select().from(schema.hearingSchedules)
  assert.equal(record.version, 2)
  assert.equal(record.isPublished, true)
  assert.equal(record.publishedHearings?.length, 1)
  assert.equal(record.hearings.length, 1)
  assert.equal(record.updatedBy, "11111111-1111-4111-8111-111111111111")
  role = "assessor"
  assert.equal(
    (await saveSchedule({ message: "" }, form(2, "withdraw"))).message,
    "Publicação retirada.",
  )
  await pg.exec("DROP TABLE hearing_schedules")
  assert.equal(
    (await saveSchedule({ message: "" }, form(2))).message,
    "Não foi possível salvar. Seus dados continuam no formulário.",
  )
  console.log(
    "verified: concurrent create/update, intern draft isolation, publication permissions and controlled database failure",
  )
} finally {
  await pg.close()
}
