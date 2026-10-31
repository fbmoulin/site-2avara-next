import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"
import { requireDatabaseUrl } from "./config"

const connectionString = requireDatabaseUrl(process.env.DATABASE_URL)

const client = postgres(connectionString, { prepare: false, max: 1 })

export const db = drizzle(client, { schema })
