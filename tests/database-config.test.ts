import { expect, test } from "bun:test"
import { requireDatabaseUrl } from "../lib/db/config"

test.each([undefined, "", "  ", "\n"])("missing database URL %j is rejected", (value) => {
  expect(() => requireDatabaseUrl(value)).toThrow("DATABASE_URL is required")
})

test.each([
  "not-a-url",
  "https://user:credential-marker@example.test/database",
  "postgresql:///database",
  "postgres://user:credential-marker@/database",
])("invalid database URL %j is rejected without exposing credentials", (value) => {
  let failure: Error | undefined
  try {
    requireDatabaseUrl(value)
  } catch (error) {
    failure = error as Error
  }
  expect(failure).toBeInstanceOf(Error)
  expect(failure?.message).toContain("PostgreSQL URL with an explicit host")
  expect(failure?.message).not.toContain(value)
  expect(failure?.message).not.toContain("credential-marker")
  expect(failure?.cause).toBeUndefined()
})

test.each([
  "postgresql://user:encoded%40password@db.example.test:6543/postgres?sslmode=require",
  "postgres://localhost:5432/development",
  "postgresql://postgres:postgres@127.0.0.1:54321/postgres",
])("explicit database URL %j remains usable", (value) => {
  expect(requireDatabaseUrl(`  ${value}\n`)).toBe(value)
})

test("database import rejects missing configuration before the driver can default to localhost", async () => {
  const child = Bun.spawn([
    process.execPath,
    "-e",
    'delete process.env.DATABASE_URL; await import("./lib/db")',
  ], { stdout: "pipe", stderr: "pipe" })
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ])
  expect({ code, stdout, stderr }).toMatchObject({ code: 1 })
  expect(stderr).toContain("DATABASE_URL is required")
})
