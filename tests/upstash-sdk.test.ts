import { expect, test } from "bun:test"

test("real Upstash SDK resolved HTTP timeout is rejected by the application", async () => {
  // Other tests mock provider modules; a subprocess keeps the real SDK independent.
  const child = Bun.spawn([process.execPath, "tests/fixtures/upstash-timeout.ts"], {
    stdout: "pipe",
    stderr: "pipe",
  })
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ])
  expect({ code, stdout, stderr }).toMatchObject({ code: 0 })
  expect(JSON.parse(stdout)).toMatchObject({
    sdk: { success: true, reason: "timeout" },
    application: { success: false, unavailable: true },
  })
})
