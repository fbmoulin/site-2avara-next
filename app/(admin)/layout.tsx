import { connection } from "next/server"
import { LoggerInit } from "@/components/logger-init"

export const metadata = { robots: { index: false, follow: false } }

// Administrative group (/admin, /login and the access status pages): no VLibras, guide or
// accessibility bar, and no external script. proxy.ts sends a per-request nonce CSP, which Next
// applies only while rendering, so every page here renders on demand (SPEC-PORTAL-001 R2.1).
export default async function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  await connection()
  return (
    <>
      {children}
      <LoggerInit />
    </>
  )
}
