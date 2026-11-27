import { PGlite } from "@electric-sql/pglite"
import { PGLiteSocketServer } from "@electric-sql/pglite-socket"
import { generateDrizzleJson, generateMigration } from "drizzle-kit/api"
import * as schema from "../lib/db/schema"

// Always create a disposable database. Never read a supplied DATABASE_URL.
const database = await PGlite.create()
const statements = await generateMigration(generateDrizzleJson({}), generateDrizzleJson(schema))
for (const statement of statements) await database.exec(statement)
await database.exec(
  `INSERT INTO articles (title, slug, content, excerpt, is_published, published_at) VALUES ('Artigo de teste', 'artigo-de-teste', 'Conteúdo fictício para validar a renderização.', 'Resumo fictício.', true, NOW());`
)
// Synthetic news (R3.5): 35 from the last 35 days in four categories and one 100 days old, which
// the public listing must leave out. Fictitious titles and tjes.jus.br-shaped links only.
await database.exec(`INSERT INTO news (external_id, title, link, description, category, published_at)
  SELECT 'e2e-' || g, 'Notícia fictícia ' || g, 'https://www.tjes.jus.br/noticia-ficticia-' || g || '/',
    'Descrição fictícia da notícia ' || g || '.', (ARRAY['Institucional', 'Cível', 'Criminal', 'Eventos'])[1 + g % 4],
    now() - (g || ' days')::interval + interval '1 hour'
  FROM generate_series(0, 34) g;
  INSERT INTO news (external_id, title, link, category, published_at)
  VALUES ('e2e-antiga', 'Notícia fictícia antiga', 'https://www.tjes.jus.br/noticia-ficticia-antiga/', 'Cível', now() - interval '100 days');`)
const server = new PGLiteSocketServer({
  db: database,
  host: "127.0.0.1",
  port: 0,
  maxConnections: 20,
})
await server.start()
const env = {
  ...process.env,
  DATABASE_URL: `postgresql://postgres:postgres@${server.getServerConn()}/postgres`,
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54329",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-test-only",
  ADMIN_USER_IDS: "11111111-1111-4111-8111-111111111111",
  OPENAI_API_KEY: "",
  RESEND_API_KEY: "",
  SUPABASE_SERVICE_ROLE_KEY: "",
  UPSTASH_REDIS_REST_URL: "",
  UPSTASH_REDIS_REST_TOKEN: "",
  CRON_SECRET: "disposable-local-test-only",
  NEXT_TELEMETRY_DISABLED: "1",
  E2E_FIXTURE: "1",
}
async function run(command: string[]) {
  const child = Bun.spawn(command, { env, stdout: "inherit", stderr: "inherit" })
  const code = await child.exited
  if (code !== 0) throw new Error(`Verification failed: ${command.join(" ")} (${code})`)
}
try {
  if (process.argv[2] !== "e2e") await run(["bun", "run", "build"])
  if (process.argv[2] !== "build") {
    await run(["bun", "x", "playwright", "test"])
    const persisted = await database.query<{ count: number }>(
      "SELECT count(*)::int AS count FROM contact_messages WHERE email = 'maria.teste@e2e.com' AND name = 'Maria Teste E2E'"
    )
    if (persisted.rows[0]?.count !== 1) throw new Error("Contact persistence verification failed")
    console.log("Verified: exactly one integration contact persisted in disposable PostgreSQL.")
    const retired = await database.query<{ count: number }>(
      "SELECT ((SELECT count(*) FROM appointments) + (SELECT count(*) FROM demands))::int AS count"
    )
    if (retired.rows[0]?.count !== 0) throw new Error("Retired routes wrote appointments or demands")
    console.log("Verified: retired appointment/demand routes wrote nothing.")
  }
} finally {
  await server.stop()
  await database.close()
}
