import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import { getTableName, type SQL } from "drizzle-orm"
import { PgDialect, type PgTable } from "drizzle-orm/pg-core"

// Mocked database: counts per table, recorded conditions. No production data.
let rowsByTable: Record<string, { id: string }[]> = {}
let conditions: Record<string, SQL> = {}
let deletedTables: string[] = []
let transactions = 0
let failure: Error | null = null

const tx = {
  delete: (table: PgTable) => ({
    where: (condition: SQL) => ({
      returning: async () => {
        if (failure) throw failure
        const name = getTableName(table)
        deletedTables.push(name)
        conditions[name] = condition
        return rowsByTable[name] ?? []
      },
    }),
  }),
}

mock.module("../lib/db", () => ({
  db: {
    transaction: async <T>(run: (client: typeof tx) => Promise<T>) => {
      transactions++
      return run(tx)
    },
  },
}))

const { purgeExpiredRecords, RETENTION_DAYS } = await import("../lib/retention")
const { GET } = await import("../app/api/retention/route")
const { NextRequest } = await import("next/server")

const SECRET = "local-test-only-secret"
const savedSecret = process.env.CRON_SECRET
const consoleInfo = console.info
const consoleError = console.error
let logs: string[] = []

const ids = (count: number) => Array.from({ length: count }, (_, i) => ({ id: `id-${i}` }))

beforeEach(() => {
  rowsByTable = {}
  conditions = {}
  deletedTables = []
  transactions = 0
  failure = null
  logs = []
  process.env.CRON_SECRET = SECRET
  console.info = (line: string) => void logs.push(line)
  console.error = (line: string) => void logs.push(line)
})
afterEach(() => {
  console.info = consoleInfo
  console.error = consoleError
  if (savedSecret === undefined) delete process.env.CRON_SECRET
  else process.env.CRON_SECRET = savedSecret
})

function cronRequest(authorization?: string) {
  return new NextRequest("http://localhost/api/retention", {
    headers: authorization ? { authorization } : {},
  })
}

describe("purgeExpiredRecords", () => {
  test("retention period is 90 days", () => {
    expect(RETENTION_DAYS).toBe(90)
  })

  test("deletes from the three personal-data tables in one transaction and counts per table", async () => {
    rowsByTable = { contact_messages: ids(3), appointments: ids(1), demands: [] }
    expect(await purgeExpiredRecords()).toEqual({ contactMessages: 3, appointments: 1, demands: 0 })
    expect(transactions).toBe(1)
    expect(deletedTables).toEqual(["contact_messages", "appointments", "demands"])
  })

  test("each condition compares created_at with now() minus 90 days", async () => {
    await purgeExpiredRecords()
    const dialect = new PgDialect()
    for (const table of ["contact_messages", "appointments", "demands"]) {
      const query = dialect.sqlToQuery(conditions[table])
      expect(query.sql).toBe(`"${table}"."created_at" < now() - interval '90 days'`)
      expect(query.params).toEqual([])
    }
  })
})

describe("GET /api/retention", () => {
  test.each([
    [undefined],
    ["Bearer wrong"],
    [`Bearer ${SECRET}x`],
    [`Bearer ${SECRET.slice(0, -1)}`],
    [SECRET],
    [`bearer ${SECRET}`],
  ])("authorization %s is rejected with 401 and nothing is deleted", async (authorization) => {
    const response = await GET(cronRequest(authorization))
    expect(response.status).toBe(401)
    expect(transactions).toBe(0)
  })

  test("missing CRON_SECRET fails closed with 503", async () => {
    delete process.env.CRON_SECRET
    const response = await GET(cronRequest("Bearer "))
    expect(response.status).toBe(503)
    expect(transactions).toBe(0)
    expect(JSON.parse(logs[0])).toEqual({
      event: "retention_cron_misconfigured",
      reason: "missing_cron_secret",
    })
  })

  test("blank CRON_SECRET also fails closed with 503", async () => {
    process.env.CRON_SECRET = "   "
    const response = await GET(cronRequest("Bearer    "))
    expect(response.status).toBe(503)
    expect(transactions).toBe(0)
  })

  test("valid secret purges, answers 200 with counts and logs a data_retention JSON", async () => {
    rowsByTable = { contact_messages: ids(2), appointments: ids(4), demands: ids(1) }
    const response = await GET(cronRequest(`Bearer ${SECRET}`))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      retentionDays: 90,
      deleted: { contactMessages: 2, appointments: 4, demands: 1 },
    })
    expect(logs).toHaveLength(1)
    const entry = JSON.parse(logs[0])
    expect(Object.keys(entry).sort()).toEqual(["deleted", "durationMs", "event", "retentionDays"])
    expect(entry).toMatchObject({
      event: "data_retention",
      retentionDays: 90,
      deleted: { contactMessages: 2, appointments: 4, demands: 1 },
    })
    expect(logs[0]).not.toContain("id-")
  })

  test("database failure answers 500 with only the error name, also in the log", async () => {
    class PostgresError extends Error {
      override name = "PostgresError"
    }
    failure = new PostgresError(
      'delete from "contact_messages" where email = $1 -- params: maria@example.com',
    )
    const response = await GET(cronRequest(`Bearer ${SECRET}`))
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: "PostgresError" })
    expect(logs).toHaveLength(1)
    expect(JSON.parse(logs[0])).toMatchObject({
      event: "data_retention",
      failure: "database",
      error: "PostgresError",
    })
    expect(logs[0]).not.toContain("delete")
    expect(logs[0]).not.toContain("maria")
  })

  test("non-Error rejections are reported as UnknownError", async () => {
    failure = "boom" as unknown as Error
    const response = await GET(cronRequest(`Bearer ${SECRET}`))
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: "UnknownError" })
  })
})

test("real disposable database deletes only rows older than 90 days", async () => {
  const child = Bun.spawn([process.execPath, "tests/fixtures/retention-pglite.ts"], {
    stdout: "pipe",
    stderr: "pipe",
  })
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ])
  expect({ stdout, stderr, code }).toMatchObject({ code: 0 })
  expect(stdout).toContain("verified: only rows older than 90 days were deleted")
}, 30000)
