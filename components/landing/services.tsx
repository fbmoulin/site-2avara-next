"use client"

import { useState } from "react"
import {
  Search,
  Video,
  Calendar,
  FileText,
  ExternalLink,
  ChevronDown,
  MessageSquare,
} from "lucide-react"
import { SERVICES } from "@/lib/constants"
import type { ServiceItem } from "@/lib/constants"

const ICON_MAP: Record<string, React.ReactNode> = {
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
    (service.tutorial && service.tutorial.length > 0)

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md">
      <button
        onClick={hasExpandableContent ? onToggle : undefined}
        className={`flex w-full items-start gap-4 p-6 text-left ${
          hasExpandableContent ? "cursor-pointer" : "cursor-default"
        }`}
      >
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          {ICON_MAP[service.icon] ?? <FileText className="size-6" />}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900">
            {service.title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {service.description}
          </p>
        </div>
        {hasExpandableContent && (
          <ChevronDown
            className={`mt-1 size-5 shrink-0 text-slate-400 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {/* Single external link */}
      {service.url && !hasExpandableContent && (
        <div className="border-t border-slate-100 px-6 py-3">
          <a
            href={service.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 transition-colors hover:text-amber-700"
          >
            Acessar
            <ExternalLink className="size-4" />
          </a>
        </div>
      )}

      {/* Expandable content */}
      {hasExpandableContent && (
        <div
          className={`transition-all duration-300 ${
            isExpanded
              ? "max-h-[800px] opacity-100"
              : "max-h-0 overflow-hidden opacity-0"
          }`}
        >
          <div className="border-t border-slate-100 px-6 py-4">
            {/* Links */}
            {service.links && service.links.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {service.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target={link.url.startsWith("#") ? undefined : "_blank"}
                    rel={
                      link.url.startsWith("#")
                        ? undefined
                        : "noopener noreferrer"
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-amber-100 hover:text-amber-700"
                  >
                    {getLinkIcon(link.icon)}
                    {link.label}
                  </a>
                ))}
              </div>
            )}

            {/* Tutorial steps */}
            {service.tutorial && service.tutorial.length > 0 && (
              <div className="mt-4">
                <p className="mb-3 text-sm font-semibold text-slate-700">
                  Passo a passo:
                </p>
                <ol className="space-y-2">
                  {service.tutorial.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-600">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
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
    <section id="servicos" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold tracking-wider text-amber-500 uppercase">
            Atendimento
          </p>
          <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
            Serviços Disponíveis
          </h2>
          <p className="mt-4 text-slate-600">
            Conheça os serviços oferecidos pela 2ª Vara Cível de Cariacica.
          </p>
        </div>

        <div className="space-y-4">
          {SERVICES.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isExpanded={expandedService === service.id}
              onToggle={() =>
                setExpandedService(
                  expandedService === service.id ? null : service.id
                )
              }
            />
          ))}
        </div>
      </div>
    </section>
  )
}
