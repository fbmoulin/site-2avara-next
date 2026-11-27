"use client"

import Link from "next/link"
import { trackHomeShortcut, type HomeShortcut } from "@/lib/analytics"

const CARD_CLASS =
  "flex h-full min-h-[150px] flex-col gap-2.5 rounded-[14px] border border-slate-700 bg-slate-800 p-4 text-left text-slate-50 transition-colors hover:border-amber-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 motion-reduce:transition-none lg:min-h-[190px]"

/**
 * One of the four first-screen shortcuts (SPEC-PORTAL-001 R3.7). The only client part of the hero:
 * it sends the shortcut event (R3.8) and leaves navigation to the link itself. The content (icon,
 * title, description) is rendered on the server and passed as children.
 */
export function HomeShortcutLink({
  shortcut,
  href,
  external = false,
  children,
}: {
  shortcut: HomeShortcut
  href: string
  external?: boolean
  children: React.ReactNode
}) {
  function onClick() {
    trackHomeShortcut(shortcut)
    // A link to the anchor already in the address bar fires no "hashchange": announce it so the
    // target (e.g. the "Audiências Virtuais" card) opens again after being closed.
    const hash = href.startsWith("/#") ? href.slice(1) : null
    if (hash && window.location.pathname === "/" && window.location.hash === hash) {
      window.dispatchEvent(new HashChangeEvent("hashchange"))
    }
  }

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        data-shortcut={shortcut}
        className={CARD_CLASS}
      >
        {children}
        <span className="sr-only"> (abre em nova aba)</span>
      </a>
    )
  }

  // Same-page anchors use a plain <a>: the browser scrolls and fires "hashchange" natively.
  if (href.startsWith("/#")) {
    return (
      <a href={href} onClick={onClick} data-shortcut={shortcut} className={CARD_CLASS}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} onClick={onClick} data-shortcut={shortcut} className={CARD_CLASS}>
      {children}
    </Link>
  )
}
