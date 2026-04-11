"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { FAQS } from "@/lib/constants"

export function Faq() {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)

  return (
    <section id="duvidas" className="bg-background py-20">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold tracking-wider text-amber-500 uppercase">
            Ajuda
          </p>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Perguntas Frequentes
          </h2>
          <p className="mt-4 text-muted-foreground">
            Encontre respostas para as dúvidas mais comuns sobre os serviços da
            vara.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq) => {
            const isExpanded = expandedFaq === faq.id
            return (
              <div
                key={faq.id}
                className="overflow-hidden rounded-xl border border-border bg-background"
              >
                <button
                  onClick={() =>
                    setExpandedFaq(isExpanded ? null : faq.id)
                  }
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                >
                  <div className="flex-1">
                    <span className="mb-1 inline-block text-xs font-semibold text-amber-500 uppercase">
                      {faq.category}
                    </span>
                    <p className="font-medium text-foreground">
                      {faq.question}
                    </p>
                  </div>
                  <ChevronDown
                    className={`size-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isExpanded
                      ? "max-h-96 opacity-100"
                      : "max-h-0 overflow-hidden opacity-0"
                  }`}
                >
                  <div className="border-t border-slate-100 px-5 py-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
