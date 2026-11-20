import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { PGlite } from "@electric-sql/pglite"
import { generateDrizzleJson, generateMigration } from "drizzle-kit/api"
import * as schema from "../lib/db/schema"

// Disposable database only. Supabase creates the anon/authenticated roles and grants them
// ALL on new public tables by default; the setup below reproduces that starting point.
const tables = ["contact_messages", "appointments", "demands", "articles", "news"]
const migration = readFileSync("lib/db/migrations/20261116_rls_public_tables.sql", "utf8")
const rollback = readFileSync("lib/db/migrations/20261116_rls_public_tables_rollback.sql", "utf8")
let pg: PGlite

async function canRead(role: "anon" | "authenticated", table: string) {
  await pg.exec(`SET ROLE ${role}`)
  try {
    await pg.query(`SELECT id FROM public.${table} LIMIT 0`)
    return true
  } catch (error) {
    expect((error as Error).message).toContain("permission denied")
    return false
  } finally {
    await pg.exec("RESET ROLE")
  }
}

beforeAll(async () => {
  pg = await PGlite.create()
  for (const sql of await generateMigration(generateDrizzleJson({}), generateDrizzleJson(schema)))
    await pg.exec(sql)
  await pg.exec("CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;")
  await pg.exec("GRANT USAGE ON SCHEMA public TO anon, authenticated;")
  await pg.exec(`GRANT ALL ON ${tables.map((t) => `public.${t}`).join(", ")} TO anon, authenticated;`)
})
afterAll(async () => {
  await pg.close()
})

describe("20261116_rls_public_tables migration", () => {
  test("before the migration the public roles can read every table (Supabase default)", async () => {
    for (const table of tables) expect(await canRead("anon", table)).toBe(true)
  })

  test("after the migration anon and authenticated cannot read or write; the server role still can", async () => {
    await pg.exec(migration)
    for (const table of tables) {
      expect(await canRead("anon", table)).toBe(false)
      expect(await canRead("authenticated", table)).toBe(false)
    }
    await pg.exec("SET ROLE anon")
    await expect(
      pg.query(
        "INSERT INTO public.news (external_id, title, link) VALUES ('x', 'Teste', 'https://www.tjes.jus.br/')",
      ),
    ).rejects.toThrow("permission denied")
    await pg.exec("RESET ROLE")
    const rls = await pg.query<{ relname: string; relrowsecurity: boolean }>(
      "SELECT relname, relrowsecurity FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relname = ANY($1)",
      [tables],
    )
    expect(rls.rows).toHaveLength(tables.length)
    expect(rls.rows.every((row) => row.relrowsecurity)).toBe(true)
    expect((await pg.query("SELECT id FROM public.contact_messages LIMIT 0")).rows).toEqual([])
  })

  test("the migration is idempotent and the rollback restores the previous grants", async () => {
    await pg.exec(migration)
    await pg.exec(rollback)
    for (const table of tables) expect(await canRead("anon", table)).toBe(true)
    await pg.exec(migration)
    for (const table of tables) expect(await canRead("anon", table)).toBe(false)
  })
})
