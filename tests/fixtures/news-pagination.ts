// Runs in its own process (tests/news-pagination.test.ts) so its module mock stays isolated.
import { mock } from "bun:test"
import assert from "node:assert/strict"
import { PGlite } from "@electric-sql/pglite"
import { drizzle } from "drizzle-orm/pglite"
import { generateDrizzleJson, generateMigration } from "drizzle-kit/api"
import * as schema from "../../lib/db/schema"

// Disposable in-memory database with synthetic news. Never a real database.
const pg = await PGlite.create()
for (const sql of await generateMigration(generateDrizzleJson({}), generateDrizzleJson(schema)))
  await pg.exec(sql)
const db = drizzle(pg, { schema })
mock.module("../../lib/db", () => ({ db }))

const { getNewsPage, latestNews, NEWS_PAGE_SIZE } = await import("../../lib/news")

const day = 24 * 60 * 60 * 1000
const categories = ["Institucional", "Cível", "Criminal", "Eventos"]
// 65 recent items (one per day, newest first), 3 older than 90 days, 1 inactive, and 1 without a
// publication date collected 100 days ago and 1 collected 2 days ago.
const rows = [
  ...Array.from({ length: 65 }, (_, i) => ({
    externalId: `recente-${i}`,
    title: `Notícia recente ${i}`,
    link: `https://www.tjes.jus.br/recente-${i}/`,
    category: categories[i % categories.length],
    publishedAt: new Date(Date.now() - i * day - 60_000),
  })),
  ...[91, 120, 400].map((age) => ({
    externalId: `antiga-${age}`,
    title: `Notícia antiga ${age}`,
    link: `https://www.tjes.jus.br/antiga-${age}/`,
    category: "Cível",
    publishedAt: new Date(Date.now() - age * day),
  })),
  {
    externalId: "inativa",
    title: "Notícia inativa",
    link: "https://www.tjes.jus.br/inativa/",
    category: "Cível",
    publishedAt: new Date(),
    isActive: false,
  },
  {
    externalId: "sem-data-antiga",
    title: "Sem data antiga",
    link: "https://www.tjes.jus.br/sem-data-antiga/",
    publishedAt: null,
    fetchedAt: new Date(Date.now() - 100 * day),
  },
  {
    externalId: "sem-data-nova",
    title: "Sem data nova",
    link: "https://www.tjes.jus.br/sem-data-nova/",
    publishedAt: null,
    fetchedAt: new Date(Date.now() - 2 * day - 120_000),
  },
]
await db.insert(schema.news).values(rows)

const first = await getNewsPage(1)
assert.equal(first.totalItems, 66)
assert.equal(first.totalPages, 3)
assert.equal(first.items.length, NEWS_PAGE_SIZE)
assert.equal(first.items[0].title, "Notícia recente 0")
console.log("verified: 30 per page, newest first, only the last 90 days")

const third = await getNewsPage(3)
assert.equal(third.items.length, 6)
const titles = [...first.items, ...(await getNewsPage(2)).items, ...third.items].map((i) => i.title)
assert.equal(new Set(titles).size, 66)
assert.ok(!titles.some((title) => title.startsWith("Notícia antiga")))
assert.ok(!titles.includes("Notícia inativa"))
assert.ok(!titles.includes("Sem data antiga"))
assert.ok(titles.includes("Sem data nova"))
console.log("verified: older than 90 days, inactive and stale undated items left out")

const shown = new Set([...first.items, ...third.items].map((item) => item.category))
for (const category of categories) assert.ok(shown.has(category), category)
console.log("verified: every category is listed (Q-5)")

const beyond = await getNewsPage(4)
assert.deepEqual(beyond.items, [])
assert.equal(beyond.totalPages, 3)
console.log("verified: a page past the end has no items")

const latest = await latestNews(6)
assert.equal(latest.length, 6)
assert.equal(latest[0].title, "Notícia recente 0")
console.log("verified: home preview uses the same rule")
