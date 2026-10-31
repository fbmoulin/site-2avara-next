// TypeScript's non-null assertion does not validate deployment configuration.
// Reject missing/invalid URLs before postgres-js can silently use local defaults.
export function requireDatabaseUrl(value: string | undefined): string {
  const connectionString = value?.trim()
  if (!connectionString) {
    throw new Error("[database] DATABASE_URL is required for this deployment environment.")
  }
  let url: URL
  try {
    url = new URL(connectionString)
  } catch {
    // Never include the supplied value or parser error: URLs can contain credentials.
    throw new Error("[database] DATABASE_URL must be a PostgreSQL URL with an explicit host.")
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname) {
    throw new Error("[database] DATABASE_URL must be a PostgreSQL URL with an explicit host.")
  }
  return connectionString
}
