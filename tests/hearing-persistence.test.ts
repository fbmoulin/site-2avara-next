import { expect, test } from "bun:test"

test("real disposable database prevents concurrent overwrite and preserves publication state", async () => {
  const child = Bun.spawn([process.execPath, "tests/fixtures/hearing-persistence.ts"], {
    stdout: "pipe",
    stderr: "pipe",
  })
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ])
  expect({ stdout, stderr, code }).toMatchObject({ code: 0 })
  expect(stdout).toContain("verified: concurrent create/update")
}, 30000)
