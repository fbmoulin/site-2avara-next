import { expect, test } from "bun:test"
import JSON5 from "json5"
import { auditProduction } from "../scripts/audit-production.mjs"

function advisory(name: string) {
  return { vulnerable_versions: "*", severity: "high", url: `https://example.test/${name}` }
}

test("real lockfile excludes dev-only optional peers but retains production Redis", async () => {
  const lock = JSON5.parse(await Bun.file("bun.lock").text())
  const result = auditProduction(lock, {
    "@playwright/test": [advisory("playwright")],
    "@electric-sql/pglite": [advisory("pglite")],
    "@upstash/redis": [advisory("redis")],
  })
  expect(result.productionFindings.map((finding: { name: string }) => finding.name)).toEqual([
    "@upstash/redis",
  ])
})

test("required peers, optional dependencies and independently reachable optional peers are audited", () => {
  const lock = {
    workspaces: { "": { dependencies: { app: "1", direct: "1" } } },
    packages: {
      app: [
        "app@1.0.0",
        "",
        {
          peerDependencies: { dev: "1", direct: "1", required: "1", explicit: "1" },
          optionalPeers: ["dev", "direct", "explicit"],
          optionalDependencies: { optional: "1" },
          dependencies: { explicit: "1", nested: "1" },
        },
      ],
      dev: ["dev@1.0.0"],
      direct: ["direct@1.0.0"],
      required: ["required@1.0.0"],
      explicit: ["explicit@1.0.0"],
      optional: ["optional@1.0.0"],
      // Resolve the nested installed version, not a same-name root dev package.
      "app/nested": ["nested@2.0.0"],
      nested: ["nested@1.0.0"],
    },
  }
  const advisories = Object.fromEntries(
    ["dev", "direct", "required", "explicit", "optional", "nested"].map((name) => [
      name,
      [advisory(name)],
    ]),
  )
  const result = auditProduction(lock, advisories)
  expect(result.productionEntriesChecked).toBe(6)
  expect(result.productionFindings.map((finding: { name: string }) => finding.name).sort()).toEqual(
    ["direct", "explicit", "nested", "optional", "required"],
  )
  expect(result.productionFindings).toContainEqual(
    expect.objectContaining({ name: "nested", version: "2.0.0" }),
  )
})

test("malformed audit data cannot silently pass the production gate", async () => {
  const lock = JSON5.parse(await Bun.file("bun.lock").text())
  expect(() => auditProduction(lock, null)).toThrow("Invalid dependency audit response")
  expect(() =>
    auditProduction(lock, {
      next: [{ vulnerable_versions: "not-a-range" }],
    }),
  ).toThrow("Cannot classify advisory for next")
})
