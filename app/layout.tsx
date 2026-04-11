import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AccessibilityBar } from "@/components/accessibility-bar"
import { Chatbot } from "@/components/chatbot"
import { LoggerInit } from "@/components/logger-init"
import { VLibrasInit } from "@/components/vlibras-init"
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
    "Portal oficial da 2ª Vara Cível de Cariacica, Espírito Santo. Consulte processos, agende atendimentos e conheça nossos serviços.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pt-9">
        <AccessibilityBar />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />

        <LoggerInit />
        <Chatbot />

        {/* VLibras - acessibilidade em Libras */}
        <div
          // @ts-expect-error — VLibras uses non-standard vw attribute
          vw="true"
          className="enabled"
        >
          <div vw-access-button="true" className="active" />
          <div vw-plugin-wrapper="true">
            <div className="vw-plugin-top-wrapper" />
          </div>
        </div>
        <VLibrasInit />
        <style>{`
          [vw] .active { position: fixed !important; bottom: 20px !important; right: 20px !important; z-index: 9999 !important; }
          [vw-plugin-wrapper] { position: fixed !important; z-index: 9998 !important; }
        `}</style>
      </body>
    </html>
  )
}
