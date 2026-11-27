"use client"

import { useRef, useState } from "react"
import {
  Search,
  Video,
  Calendar,
  FileText,
  ExternalLink,
  ChevronDown,
  MessageSquare,
  Scale,
} from "lucide-react"
import { trackZoomTutorialPlay } from "@/lib/analytics"
import { SERVICES } from "@/lib/constants"
import type { ServiceItem } from "@/lib/constants"
import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-container"

const ICON_COMPONENTS: Record<string, React.ReactNode> = {
  search: <Search className="size-6" />,
  video: <Video className="size-6" />,
  calendar: <Calendar className="size-6" />,
  "file-text": <FileText className="size-6" />,
  "message-square": <MessageSquare className="size-6" />,
}

function getLinkIcon(icon: string) {
  switch (icon) {
    case "apple":
      return <ExternalLink className="size-4" />
    case "playstore":
      return <ExternalLink className="size-4" />
    case "file-text":
      return <FileText className="size-4" />
    case "message-square":
      return <MessageSquare className="size-4" />
    default:
      return <ExternalLink className="size-4" />
  }
}

function ServiceCard({
  service,
  isExpanded,
  onToggle,
}: {
  service: ServiceItem
  isExpanded: boolean
  onToggle: () => void
}) {
  const hasExpandableContent =
    (service.links && service.links.length > 0) ||
    (service.tutorial && service.tutorial.length > 0) ||
    Boolean(service.tutorialVideo)

  const panelId = `service-panel-${service.id}`
  // R3.8: one event the first time the tutorial video plays while the card is open.
  const videoTracked = useRef(false)
  // Hover effect in CSS (R3.3), off with reduced motion.
  const icon = (
    <div
      aria-hidden="true"
      className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
    >
      {ICON_COMPONENTS[service.icon] ?? <FileText className="size-6" />}
    </div>
  )

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-background transition-shadow hover:shadow-md">
      {hasExpandableContent ? (
        // Disclosure: the button names the card and controls the panel below (R2.4).
        <h3>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isExpanded}
            aria-controls={panelId}
            className="flex w-full cursor-pointer items-start gap-4 p-6 text-left"
          >
            {icon}
            <span className="flex-1">
              <span className="block text-lg font-semibold text-foreground">{service.title}</span>
              <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                {service.description}
              </span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className={`mt-1 size-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </h3>
      ) : (
        // Nothing to expand: plain content, not a button.
        <div className="flex w-full items-start gap-4 p-6 text-left">
          {icon}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">{service.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {service.description}
            </p>
          </div>
        </div>
      )}

      {/* Single external link */}
      {service.url && !hasExpandableContent && (
        <div className="border-t border-slate-100 px-6 py-3">
          <a
            href={service.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-amber-800 underline-offset-2 transition-colors hover:text-amber-900 hover:underline"
          >
            Acessar<span className="sr-only"> {service.title} (abre em nova aba)</span>
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
        </div>
      )}

      {/* Expandable content */}
      {/* Collapsed content is hidden and inert: out of the tab order and of the accessibility tree. */}
      {hasExpandableContent && (
        <div id={panelId} hidden={!isExpanded} inert={!isExpanded}>
          <div className="border-t border-slate-100 px-6 py-4">
            {/* Links */}
            {service.links && service.links.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {service.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    onClick={
                      link.url === "#assistant-panel"
                        ? (event) => {
                            event.preventDefault()
                            window.dispatchEvent(new Event("open-assistant"))
                          }
                        : undefined
                    }
                    target={link.url.startsWith("https:") ? "_blank" : undefined}
                    rel={!link.url.startsWith("https:") ? undefined : "noopener noreferrer"}
                    className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-amber-100 hover:text-amber-900"
                  >
                    {getLinkIcon(link.icon)}
                    {link.label}
                  </a>
                ))}
              </div>
            )}

            {/* Tutorial video: mounted only while expanded so it is never focusable or playing when hidden */}
            {service.tutorialVideo && isExpanded && (
              <figure className="mt-4">
                <figcaption
                  id={`tutorial-video-${service.id}-title`}
                  className="mb-2 text-sm font-semibold text-muted-foreground"
                >
                  {service.tutorialVideo.title}
                </figcaption>
                <video
                  controls
                  playsInline
                  preload="none"
                  onPlay={() => {
                    if (videoTracked.current) return
                    videoTracked.current = true
                    trackZoomTutorialPlay()
                  }}
                  poster={service.tutorialVideo.poster}
                  aria-labelledby={`tutorial-video-${service.id}-title`}
                  aria-describedby={`tutorial-video-${service.id}-desc`}
                  className="aspect-video w-full rounded-lg bg-black"
                >
                  <source src={service.tutorialVideo.src} type="video/mp4" />
                  Seu navegador não reproduz vídeos.{" "}
                  <a href={service.tutorialVideo.src} className="underline">
                    Baixe o vídeo
                  </a>
                  .
                </video>
                <p
                  id={`tutorial-video-${service.id}-desc`}
                  className="mt-2 text-xs text-muted-foreground"
                >
                  {service.tutorialVideo.description}
                </p>
              </figure>
            )}

            {/* Tutorial steps */}
            {service.tutorial && service.tutorial.length > 0 && (
              <div className="mt-4">
                <p className="mb-3 text-sm font-semibold text-muted-foreground">Passo a passo:</p>
                <ol className="space-y-2">
                  {service.tutorial.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-900">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                {service.tutorialTip && (
                  <p className="mt-3 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
                    {service.tutorialTip}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function Services() {
  const [expandedService, setExpandedService] = useState<string | null>(null)

  return (
    <section id="servicos" className="bg-muted py-20">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <ScrollReveal variant="fade-up">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold tracking-wider text-amber-800 uppercase">
              Atendimento
            </p>
            <h2 className="flex items-center justify-center gap-3 text-3xl font-bold text-foreground md:text-4xl">
              <Scale aria-hidden="true" className="size-8 text-amber-500" />
              Serviços Disponíveis
            </h2>
            <p className="mt-4 text-foreground/80">
              Conheça os serviços oferecidos pela 2ª Vara Cível de Cariacica.
            </p>
          </div>
        </ScrollReveal>

        <StaggerContainer direction="up" className="space-y-4">
          {SERVICES.map((service) => (
            <StaggerItem key={service.id}>
              <ServiceCard
                key={service.id}
                service={service}
                isExpanded={expandedService === service.id}
                onToggle={() =>
                  setExpandedService(expandedService === service.id ? null : service.id)
                }
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
