"use client"

import { useState, useEffect, useCallback } from "react"
import { Scale, Menu, X } from "lucide-react"

const NAV_LINKS = [
  { label: "Início", href: "inicio" },
  { label: "Magistrado", href: "magistrado" },
  { label: "Serviços", href: "servicos" },
  { label: "Dúvidas", href: "duvidas" },
  { label: "Contato", href: "contato" },
  { label: "Localização", href: "localizacao" },
]

export function Navbar() {
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
    <header className="sticky top-9 z-40 bg-slate-900 shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        {/* Logo */}
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
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeSection === link.href
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {link.label}
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
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="border-t border-slate-800 bg-slate-900 px-4 pb-4 md:hidden">
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
    </header>
  )
}
