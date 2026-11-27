import { expect, test } from "bun:test"

// SPEC-PORTAL-001 R2.10, against a disposable PGlite database in a separate process.
test("article edits and unpublishing revalidate old and new slugs; metadata only for published", async () => {
  const child = Bun.spawn([process.execPath, "tests/fixtures/article-revalidation.ts"], {
    stdout: "pipe",
    stderr: "pipe",
  })
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ])
  expect({ stdout, stderr, code }).toMatchObject({ code: 0 })
  expect(stdout).toContain("verified: slug change revalidates old and new article pages")
  expect(stdout).toContain("verified: unpublished article has no public metadata")
}, 30000)
