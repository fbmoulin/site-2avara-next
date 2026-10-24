import { defineConfig } from "drizzle-kit"
import { requireDatabaseUrl } from "./lib/db/config"

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: requireDatabaseUrl(process.env.DATABASE_URL),
  },
})
