import { describe, expect, test } from "bun:test"
import { safeAdminRedirect } from "../lib/safe-redirect"

describe("login redirect (R2.6)", () => {
  test.each([
    ["/admin", "/admin"],
    ["/admin/pauta", "/admin/pauta"],
    ["/admin/contatos?status=pending#lista", "/admin/contatos?status=pending#lista"],
  ])("keeps the admin path %s", (raw, expected) => {
    expect(safeAdminRedirect(raw)).toBe(expected)
  })

  test.each([
    null,
    undefined,
    "",
    "/\\evil.com",
    "\\\\evil.com",
    "//evil.com",
    "///evil.com",
    "https://evil.com/admin",
    "http://portal.invalid/admin",
    "javascript:alert(1)",
    "/\t/evil.com",
    "/login",
    "/",
    "/administracao",
    "/admin/../login",
    "/admin/..%2f..%2flogin/../../",
    "admin",
  ])("sends %p to /admin", (raw) => {
    expect(safeAdminRedirect(raw as string | null | undefined)).toBe("/admin")
  })
})
