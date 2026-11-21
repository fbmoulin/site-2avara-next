import { mock } from "bun:test"
import assert from "node:assert/strict"
import { PGlite } from "@electric-sql/pglite"
import { drizzle } from "drizzle-orm/pglite"
import { generateDrizzleJson, generateMigration } from "drizzle-kit/api"
import * as schema from "../../lib/db/schema"

// Disposable in-memory PostgreSQL; synthetic rows only. Never production.
const pg = await PGlite.create()
for (const sql of await generateMigration(generateDrizzleJson({}), generateDrizzleJson(schema)))
  await pg.exec(sql)
const db = drizzle(pg, { schema })
mock.module("../../lib/db", () => ({ db }))

// Ages relative to the database clock, as created_at is filled in production.
const AGES = {
  old: "now() - interval '6 months'",
  justExpired: "now() - interval '90 days' - interval '1 day'",
  justInside: "now() - interval '90 days' + interval '1 day'",
  recent: "now() - interval '1 month'",
  fresh: "now()",
}
type Age = keyof typeof AGES
const EXPIRED: Age[] = ["old", "justExpired"]
const KEPT: Age[] = ["justInside", "recent", "fresh"]

for (const age of Object.keys(AGES) as Age[]) {
  const createdAt = AGES[age]
  await pg.exec(`
    INSERT INTO contact_messages (name, phone, email, subject, message, created_at)
      VALUES ('Pessoa Sintética ${age}', '27999999999', '${age}@example.com', 'outro', 'Mensagem fictícia.', ${createdAt});
    INSERT INTO appointments (type, with_whom, name, process_number, reason, created_at)
      VALUES ('virtual', 'juiz', '${age}', '0000000-00.0000.0.00.0000', 'Motivo fictício.', ${createdAt});
    INSERT INTO demands (process_number, demand_type, description, created_at)
      VALUES ('0000000-00.0000.0.00.0000', 'outro', '${age}', ${createdAt});
  `)
}
// Tables outside the retention scope keep their old rows.
await pg.exec(`
  INSERT INTO news (external_id, title, link, fetched_at)
    VALUES ('sintetico-1', 'Notícia antiga', 'https://www.tjes.jus.br/x/', now() - interval '3 years');
  INSERT INTO articles (title, slug, content, created_at)
    VALUES ('Artigo antigo', 'artigo-antigo', 'Conteúdo fictício.', now() - interval '3 years');
`)

process.env.CRON_SECRET = "disposable-local-test-only"
console.info = () => {}
const { GET } = await import("../../app/api/retention/route")
const { NextRequest } = await import("next/server")
const request = () =>
  new NextRequest("http://localhost/api/retention", {
    headers: { authorization: "Bearer disposable-local-test-only" },
  })

const first = await GET(request())
assert.equal(first.status, 200)
assert.deepEqual(await first.json(), {
  retentionDays: 90,
  deleted: { contactMessages: EXPIRED.length, appointments: EXPIRED.length, demands: EXPIRED.length },
})

const remaining = async (query: string) =>
  (await pg.query<{ tag: string }>(query)).rows.map((row) => row.tag).sort()
const kept = [...KEPT].sort()
assert.deepEqual(await remaining("SELECT split_part(email, '@', 1) AS tag FROM contact_messages"), kept)
assert.deepEqual(await remaining("SELECT name AS tag FROM appointments"), kept)
assert.deepEqual(await remaining("SELECT description AS tag FROM demands"), kept)
assert.equal((await pg.query("SELECT 1 FROM news")).rows.length, 1)
assert.equal((await pg.query("SELECT 1 FROM articles")).rows.length, 1)

const second = await GET(request())
assert.equal(second.status, 200)
assert.deepEqual((await second.json()).deleted, { contactMessages: 0, appointments: 0, demands: 0 })

await pg.close()
console.log("verified: only rows older than 90 days were deleted, in all three tables")
