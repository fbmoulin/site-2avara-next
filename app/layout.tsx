import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "2ª Vara Cível de Cariacica - TJES",
  description:
    "Portal informativo da 2ª Vara Cível de Cariacica (ES): serviços, pauta de audiências, notícias e contato.",
}

// Shared shell only. The public chrome (VLibras, guide, accessibility bar) lives in app/(public);
// the panel in app/(admin) loads no external script (SPEC-PORTAL-001 R2.1).
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
