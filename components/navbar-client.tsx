"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Scale, Menu, X } from "lucide-react"

// Sections of the home page are reached as "/#id" so the menu works from every public route.
const NAV_LINKS = [
  { label: "Início", href: "/#inicio", section: "inicio" },
  { label: "Magistrado", href: "/#magistrado", section: "magistrado" },
  { label: "Serviços", href: "/#servicos", section: "servicos" },
  { label: "Pauta", href: "/pauta" },
  { label: "Notícias", href: "/noticias" },
  { label: "Artigos", href: "/artigos" },
  { label: "Dúvidas", href: "/#duvidas", section: "duvidas" },
  { label: "Contato", href: "/#contato", section: "contato" },
] as const

type NavLink = (typeof NAV_LINKS)[number]

const MENU_ID = "mobile-navigation"

export function NavbarClient() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string>("inicio")
  const [lastPathname, setLastPathname] = useState(pathname)
  const menuButton = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLElement>(null)

  // Close the menu when the route changes (state adjusted during render, not in an effect).
  if (lastPathname !== pathname) {
    setLastPathname(pathname)
    setMobileOpen(false)
  }

  function closeMenu(returnFocus: boolean) {
    setMobileOpen(false)
    if (returnFocus) menuButton.current?.focus()
  }

  useEffect(() => {
    if (pathname !== "/") return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActiveSection(entry.target.id)
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 },
    )
    for (const link of NAV_LINKS) {
      const element = "section" in link ? document.getElementById(link.section) : null
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [pathname])

  // The mobile menu is hidden from the lg breakpoint up: close it there so its scroll lock and
  // focus trap do not outlive it.
  useEffect(() => {
    if (!mobileOpen) return
    const desktop = window.matchMedia("(min-width: 64rem)")
    function onChange() {
      if (desktop.matches) setMobileOpen(false)
    }
    onChange()
    desktop.addEventListener("change", onChange)
    return () => desktop.removeEventListener("change", onChange)
  }, [mobileOpen])

  // Open mobile menu: lock page scroll, trap focus, close with Esc or a click outside.
  useEffect(() => {
    if (!mobileOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function focusables() {
      return [
        menuButton.current,
        ...Array.from(menu.current?.querySelectorAll<HTMLElement>("a[href]") ?? []),
      ].filter((element): element is HTMLElement => Boolean(element))
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        setMobileOpen(false)
        menuButton.current?.focus()
        return
      }
      if (event.key !== "Tab") return
      const items = focusables()
      const index = items.indexOf(document.activeElement as HTMLElement)
      const next = event.shiftKey
        ? index <= 0
          ? items.length - 1
          : index - 1
        : index === -1 || index === items.length - 1
          ? 0
          : index + 1
      event.preventDefault()
      items[next]?.focus()
    }
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (menu.current?.contains(target) || menuButton.current?.contains(target)) return
      setMobileOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("pointerdown", onPointerDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("pointerdown", onPointerDown)
    }
  }, [mobileOpen])

  function isCurrent(link: NavLink) {
    if ("section" in link) return pathname === "/" && activeSection === link.section
    return pathname === link.href || pathname.startsWith(`${link.href}/`)
  }

  return (
    <>
      <Link href="/" className="flex min-w-0 items-center gap-2 text-left text-white sm:gap-3">
        <Scale aria-hidden="true" className="size-7 shrink-0 text-amber-400 sm:size-8" />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="text-xs font-medium tracking-wider text-slate-300 uppercase">
            Poder Judiciário
          </span>
          <span className="text-sm font-bold text-white">2ª Vara Cível de Cariacica</span>
        </span>
      </Link>

      {/* Desktop nav */}
      <nav aria-label="Menu principal" className="hidden items-center gap-1 lg:flex">
        {NAV_LINKS.map((link) => {
          const current = isCurrent(link)
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={current ? ("section" in link ? "location" : "page") : undefined}
              className={`relative rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                current
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* Mobile hamburger */}
      <button
        ref={menuButton}
        type="button"
        onClick={() => (mobileOpen ? closeMenu(true) : setMobileOpen(true))}
        className="min-h-11 min-w-11 shrink-0 rounded-md p-2 text-slate-300 hover:bg-slate-800 hover:text-white lg:hidden"
        aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={mobileOpen}
        aria-controls={MENU_ID}
      >
        {mobileOpen ? (
          <X aria-hidden="true" className="size-6" />
        ) : (
          <Menu aria-hidden="true" className="size-6" />
        )}
      </button>

      {mobileOpen && (
        <nav
          ref={menu}
          id={MENU_ID}
          aria-label="Menu principal"
          className="absolute top-full right-0 left-0 max-h-[calc(100dvh-7rem)] overflow-y-auto border-t border-slate-700 bg-slate-900 px-4 pb-4 shadow-lg lg:hidden"
        >
          {NAV_LINKS.map((link) => {
            const current = isCurrent(link)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                aria-current={current ? ("section" in link ? "location" : "page") : undefined}
                className={`block w-full rounded-md px-3 py-3 text-left text-sm font-medium transition-colors ${
                  current
                    ? "bg-amber-500/20 text-amber-400"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      )}
    </>
  )
}
