"use client"

import { useState, useEffect, useCallback } from "react"
import { Scale, Menu, X } from "lucide-react"

const NAV_LINKS = [
  { label: "Início", href: "inicio" },
  { label: "Magistrado", href: "magistrado" },
  { label: "Serviços", href: "servicos" },
  { label: "Blog", href: "blog" },
  { label: "Dúvidas", href: "duvidas" },
  { label: "Contato", href: "contato" },
] as const

export function NavbarClient() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("inicio")

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    setMobileOpen(false)
  }, [])

  useEffect(() => {
    const sectionIds = NAV_LINKS.map((l) => l.href)
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    )

    for (const id of sectionIds) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* Logo — interactive (scrolls to top) */}
      <button
        onClick={() => scrollTo("inicio")}
        className="flex items-center gap-3 text-white"
      >
        <Scale className="size-8 text-amber-400" />
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-medium tracking-wider text-slate-300 uppercase">
            Poder Judiciário
          </span>
          <span className="text-sm font-bold text-white">
            2ª Vara Cível de Cariacica
          </span>
        </div>
      </button>

      {/* Desktop nav */}
      <nav className="hidden items-center gap-1 md:flex">
        {NAV_LINKS.map((link) => (
          <button
            key={link.href}
            onClick={() => scrollTo(link.href)}
            className={`relative rounded-md px-3 py-2 text-sm font-medium transition-all duration-300 ${
              activeSection === link.href
                ? "bg-amber-500/20 text-amber-400"
                : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            {link.label}
            {activeSection === link.href && (
              <span className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-amber-400 transition-all duration-300" />
            )}
          </button>
        ))}
      </nav>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="rounded-md p-2 text-slate-300 hover:bg-slate-800 hover:text-white md:hidden"
        aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
      >
        {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
      </button>

      {/* Mobile menu — rendered after the header row via CSS absolute or portal,
          but here we keep it in flow since the parent header is relative */}
      {mobileOpen && (
        <nav className="absolute top-full left-0 right-0 border-t border-slate-700/50 bg-slate-900/75 backdrop-blur-xl px-4 pb-4 md:hidden">
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className={`block w-full rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                activeSection === link.href
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>
      )}
    </>
  )
}
