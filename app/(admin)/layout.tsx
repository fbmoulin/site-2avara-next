import { Geist_Mono } from "next/font/google"
import { connection } from "next/server"
import { LoggerInit } from "@/components/logger-init"

export const metadata = { robots: { index: false, follow: false } }

// Monospaced font only for the panel (process numbers); public pages do not download it (R3.3).
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

// Administrative group (/admin, /login and the access status pages): no VLibras, guide or
// accessibility bar, and no external script. proxy.ts sends a per-request nonce CSP, which Next
// applies only while rendering, so every page here renders on demand (SPEC-PORTAL-001 R2.1).
export default async function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  await connection()
  return (
    // display: contents keeps the body flex layout; the font variable still reaches the children.
    <div className={`${geistMono.variable} contents`}>
      {children}
      <LoggerInit />
    </div>
  )
}
