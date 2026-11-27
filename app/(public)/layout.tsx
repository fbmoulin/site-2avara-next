import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AccessibilityBar } from "@/components/accessibility-bar"
import { Chatbot } from "@/components/chatbot"
import { LoggerInit } from "@/components/logger-init"
import { VLibrasInit } from "@/components/vlibras-init"

// Public pages: accessibility bar, informative guide and VLibras. The admin group never renders these.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col pt-11 md:pt-9">
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
    </div>
  )
}
