import { CalendarDays, ExternalLink, MessageSquare, Search, Video } from "lucide-react"
import { HomeShortcutLink } from "@/components/landing/home-shortcut-link"
import type { HomeShortcut } from "@/lib/analytics"
import { PROCESS_LOOKUP_URL, VIRTUAL_HEARINGS_ANCHOR } from "@/lib/constants"

type Shortcut = {
  id: HomeShortcut
  title: string
  description: string
  href: string
  icon: typeof Video
  external?: boolean
}

// The four first-screen tasks (SPEC-PORTAL-001 R3.7), in the order of the approved proposal.
export const HOME_SHORTCUT_LINKS: readonly Shortcut[] = [
  {
    id: "tenho_audiencia",
    title: "Tenho audiência",
    description: "Como entrar pelo Zoom",
    href: `/#${VIRTUAL_HEARINGS_ANCHOR}`,
    icon: Video,
  },
  {
    id: "consultar_processo",
    title: "Consultar processo",
    description: "Portal de Serviços do PDPJ",
    href: PROCESS_LOOKUP_URL,
    icon: Search,
    external: true,
  },
  {
    id: "pauta_da_semana",
    title: "Pauta da semana",
    description: "Horários das audiências",
    href: "/pauta",
    icon: CalendarDays,
  },
  {
    id: "falar_com_a_vara",
    title: "Falar com a vara",
    description: "Balcão Virtual, telefone e e-mail",
    href: "/#contato",
    icon: MessageSquare,
  },
]

// The last word never breaks ("e-mail") and keeps the new-tab icon on its line.
function Description({ text, external }: { text: string; external?: boolean }) {
  const words = text.split(" ")
  const last = words.pop()
  return (
    <>
      {words.length > 0 && `${words.join(" ")} `}
      <span className="whitespace-nowrap">
        {last}
        {external && (
          <ExternalLink
            aria-hidden="true"
            className="ml-1 inline size-3.5 align-[-2px] lg:size-4"
          />
        )}
      </span>
    </>
  )
}

// Above the fold: rendered visible in the server HTML, without ScrollReveal or entrance animation
// (R2.3). Only the shortcut links are client components, for the analytics event (R3.8).
// As in the approved proposal, the first screen is filled down to the bottom of the viewport
// (minus the accessibility bar, 44/36 px, and the header, 68 px): the Fórum photo below stays
// out of the first screen and does not become the LCP element (R3.3).
export function Hero({ notice }: { notice: string | null }) {
  return (
    <section
      id="inicio"
      aria-labelledby="inicio-heading"
      className="flex min-h-[calc(100svh-112px)] flex-col bg-slate-900 text-slate-50 md:min-h-[calc(100svh-104px)] md:justify-center"
    >
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-5 px-4 pt-6 pb-5 md:gap-8 md:px-8 md:pt-[72px] md:pb-14">
        <div className="flex flex-col gap-2 md:items-center md:gap-3 md:text-center">
          <p className="text-xs font-semibold tracking-[0.16em] text-amber-500 uppercase md:text-base">
            <span className="hidden md:inline">2ª Vara Cível &mdash; </span>
            Comarca de Cariacica &mdash; ES
          </p>
          <h1
            id="inicio-heading"
            className="text-[30px] leading-[1.15] font-bold text-white md:text-5xl md:leading-[1.1]"
          >
            Como podemos ajudar?
          </h1>
          <p className="text-[15px] leading-[1.45] text-slate-300 md:text-lg">
            Escolha o que você precisa resolver hoje.
          </p>
        </div>

        <nav aria-label="Atalhos">
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {HOME_SHORTCUT_LINKS.map((shortcut) => {
              const Icon = shortcut.icon
              return (
                <li key={shortcut.id}>
                  <HomeShortcutLink
                    shortcut={shortcut.id}
                    href={shortcut.href}
                    external={shortcut.external}
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-amber-500 text-slate-900"
                    >
                      <Icon className="size-[22px]" strokeWidth={2} />
                    </span>
                    <span className="text-[17px] leading-snug font-bold lg:text-xl">
                      {shortcut.title}
                    </span>
                    <span className="text-[13px] leading-[1.35] text-slate-300 lg:text-[15px]">
                      <Description text={shortcut.description} external={shortcut.external} />
                    </span>
                  </HomeShortcutLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {notice && (
          <p className="rounded-[10px] bg-amber-50 px-3.5 py-3 text-sm font-semibold text-slate-900 md:mx-auto md:px-[18px] md:text-[15px]">
            {notice}
          </p>
        )}
      </div>
    </section>
  )
}
