import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

// R3.1: absolute URLs from metadataBase, page titles as "<page> | 2ª Vara Cível de Cariacica" and a
// shared Open Graph card. Each public page sets its own canonical (alternates is not inherited
// on purpose: a canonical here would point every page to the home).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
}

// Shared shell only. Geist Mono is loaded by app/(admin)/layout.tsx, the only place that uses it (R3.3). The public chrome (VLibras, guide, accessibility bar) lives in app/(public);
// the panel in app/(admin) loads no external script (SPEC-PORTAL-001 R2.1).
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
