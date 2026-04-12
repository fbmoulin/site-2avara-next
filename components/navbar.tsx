import { NavbarClient } from "./navbar-client"

export function Navbar() {
  return (
    <header className="sticky top-9 z-40 bg-slate-900/75 backdrop-blur-xl shadow-lg relative">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <NavbarClient />
      </div>

      {/* Amber gradient border — purely decorative, no JS needed */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
    </header>
  )
}
