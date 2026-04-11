"use client"

import { useState } from "react"
import { ChevronDown, HelpCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { FAQS } from "@/lib/constants"
import { ScrollReveal } from "@/components/motion/scroll-reveal"

export function Faq() {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)

  return (
    <section id="duvidas" className="bg-background py-20">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <ScrollReveal variant="fade-up">
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold tracking-wider text-amber-500 uppercase">
            Ajuda
          </p>
          <h2 className="flex items-center justify-center gap-3 text-3xl font-bold text-foreground md:text-4xl">
            <HelpCircle className="size-8 text-amber-500" />
            Perguntas Frequentes
          </h2>
          <p className="mt-4 text-muted-foreground">
            Encontre respostas para as dúvidas mais comuns sobre os serviços da
            vara.
          </p>
        </div>
        </ScrollReveal>

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
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="border-t border-slate-100 px-5 py-4">
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
