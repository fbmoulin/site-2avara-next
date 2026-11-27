// Runs in its own process (tests/article-revalidation.test.ts) so its module mocks stay isolated.
import { mock } from "bun:test"
import assert from "node:assert/strict"
import { PGlite } from "@electric-sql/pglite"
import { drizzle } from "drizzle-orm/pglite"
import { generateDrizzleJson, generateMigration } from "drizzle-kit/api"
import * as schema from "../../lib/db/schema"

// Disposable in-memory database with synthetic articles. Never a real database.
const pg = await PGlite.create()
for (const sql of await generateMigration(generateDrizzleJson({}), generateDrizzleJson(schema)))
  await pg.exec(sql)
const db = drizzle(pg, { schema })
mock.module("../../lib/db", () => ({ db }))
mock.module("server-only", () => ({}))
mock.module("../../lib/auth", () => ({
  requireAdmin: async () => ({
    id: "11111111-1111-4111-8111-111111111111",
    email: "responsavel@example.com",
    role: "responsavel",
  }),
}))
let revalidated: string[] = []
mock.module("next/cache", () => ({
  revalidatePath: (path: string) => {
    revalidated.push(path)
  },
}))

const actions = await import("../../app/(admin)/admin/actions")
const page = await import("../../app/(public)/artigos/[slug]/page")

const [article] = await db
  .insert(schema.articles)
  .values({
    title: "Artigo sintético",
    slug: "artigo-antigo",
    excerpt: "Resumo sintético.",
    content: "Conteúdo sintético.",
    author: "Equipe",
    category: "Teste",
    isPublished: true,
    publishedAt: new Date(),
  })
  .returning({ id: schema.articles.id })
const metadata = (slug: string) => page.generateMetadata({ params: Promise.resolve({ slug }) })

assert.equal((await metadata("artigo-antigo")).title, "Artigo sintético")

// Renaming the slug revalidates the old and the new address.
revalidated = []
await actions.updateArticle(article.id, { slug: "artigo-novo" })
assert.ok(revalidated.includes("/artigos/artigo-antigo"), revalidated.join())
assert.ok(revalidated.includes("/artigos/artigo-novo"), revalidated.join())
assert.ok(revalidated.includes("/artigos") && revalidated.includes("/"))
assert.equal((await metadata("artigo-antigo")).title, "Artigo não encontrado")
console.log("verified: slug change revalidates old and new article pages")

// Unpublishing revalidates the page and leaves no public metadata behind.
revalidated = []
await actions.toggleArticlePublish(article.id, false)
assert.ok(revalidated.includes("/artigos/artigo-novo"), revalidated.join())
const hidden = await metadata("artigo-novo")
assert.equal(hidden.title, "Artigo não encontrado")
assert.equal("description" in hidden, false)
console.log("verified: unpublished article has no public metadata")

await pg.close()
