"use client"

import { useState, useCallback, useEffect } from "react"
import { Sun, Moon, Eye } from "lucide-react"

export function AccessibilityBar() {
  const [fontSize, setFontSize] = useState(0)
  const [highContrast, setHighContrast] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("a11y")
      if (saved) {
        const { fontSize: fs, highContrast: hc, darkMode: dm } = JSON.parse(saved)
        if (fs === 1) document.documentElement.classList.add("font-lg")
        if (fs === 2) document.documentElement.classList.add("font-xl")
        if (hc) document.documentElement.classList.add("high-contrast")
        if (dm) document.documentElement.classList.add("dark")
        setFontSize(fs || 0)
        setHighContrast(!!hc)
        setDarkMode(!!dm)
      }
    } catch {}
  }, [])

  function persistA11y(fs: number, hc: boolean, dm: boolean) {
    try { localStorage.setItem("a11y", JSON.stringify({ fontSize: fs, highContrast: hc, darkMode: dm })) } catch {}
  }

  const changeFontSize = useCallback((size: number) => {
    const html = document.documentElement
    html.classList.remove("font-lg", "font-xl")
    if (size === 1) html.classList.add("font-lg")
    if (size === 2) html.classList.add("font-xl")
    setFontSize(size)
    persistA11y(size, highContrast, darkMode)
  }, [highContrast, darkMode])

  const toggleContrast = useCallback(() => {
    document.documentElement.classList.toggle("high-contrast")
    const newHc = !highContrast
    setHighContrast(newHc)
    persistA11y(fontSize, newHc, darkMode)
  }, [fontSize, highContrast, darkMode])

  const toggleDark = useCallback(() => {
    document.documentElement.classList.toggle("dark")
    const newDm = !darkMode
    setDarkMode(newDm)
    persistA11y(fontSize, highContrast, newDm)
  }, [fontSize, highContrast, darkMode])

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-slate-950 text-xs text-slate-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1 md:px-6">
        <div className="flex items-center gap-3">
          <span className="hidden font-medium sm:inline">Acessibilidade</span>

          {/* Font size buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => changeFontSize(0)}
              className={`rounded px-1.5 py-0.5 transition-colors ${
                fontSize === 0
                  ? "bg-amber-500 text-slate-900"
                  : "hover:bg-slate-800"
              }`}
              aria-label="Tamanho de fonte padrão"
              title="Tamanho padrão"
            >
              A
            </button>
            <button
              onClick={() => changeFontSize(1)}
              className={`rounded px-1.5 py-0.5 text-sm transition-colors ${
                fontSize === 1
                  ? "bg-amber-500 text-slate-900"
                  : "hover:bg-slate-800"
              }`}
              aria-label="Aumentar fonte"
              title="Fonte grande"
            >
              A+
            </button>
            <button
              onClick={() => changeFontSize(2)}
              className={`rounded px-1.5 py-0.5 text-base transition-colors ${
                fontSize === 2
                  ? "bg-amber-500 text-slate-900"
                  : "hover:bg-slate-800"
              }`}
              aria-label="Fonte extra grande"
              title="Fonte extra grande"
            >
              A++
            </button>
          </div>

          {/* High contrast */}
          <button
            onClick={toggleContrast}
            className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
              highContrast
                ? "bg-amber-500 text-slate-900"
                : "hover:bg-slate-800"
            }`}
            aria-label="Alternar alto contraste"
            title="Alto Contraste"
          >
            <Eye className="size-3" />
            <span className="hidden sm:inline">Contraste</span>
          </button>

          {/* Dark mode */}
          <button
            onClick={toggleDark}
            className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
              darkMode ? "bg-amber-500 text-slate-900" : "hover:bg-slate-800"
            }`}
            aria-label="Alternar modo escuro"
            title="Modo Escuro"
          >
            {darkMode ? (
              <Sun className="size-3" />
            ) : (
              <Moon className="size-3" />
            )}
            <span className="hidden sm:inline">
              {darkMode ? "Claro" : "Escuro"}
            </span>
          </button>
        </div>

        {/* Skip to content */}
        <a
          href="#main-content"
          className="rounded px-2 py-0.5 transition-colors hover:bg-slate-800 focus:bg-amber-500 focus:text-slate-900 focus:outline-none"
        >
          Ir para conteúdo
        </a>
      </div>
    </div>
  )
}
