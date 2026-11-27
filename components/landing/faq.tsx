import { ChevronDown, HelpCircle } from "lucide-react"
import { FAQS } from "@/lib/constants"
import { ScrollReveal } from "@/components/motion/scroll-reveal"

// R3.2: native <details>/<summary>, rendered on the server. Every answer is in the HTML (indexable
// and readable without JavaScript); the browser handles keyboard, focus and the expanded state.
export function Faq() {
  return (
    <section id="duvidas" className="bg-background py-20" aria-labelledby="duvidas-heading">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <ScrollReveal variant="fade-up">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold tracking-wider text-amber-800 uppercase">
              Ajuda
            </p>
            <h2
              id="duvidas-heading"
              className="flex items-center justify-center gap-3 text-3xl font-bold text-foreground md:text-4xl"
            >
              <HelpCircle aria-hidden="true" className="size-8 text-amber-500" />
              Perguntas Frequentes
            </h2>
            <p className="mt-4 text-muted-foreground">
              Encontre respostas para as dúvidas mais comuns sobre os serviços da vara.
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-3">
          {FAQS.map((faq) => (
            <details
              key={faq.id}
              className="group overflow-hidden rounded-xl border border-border bg-background"
            >
              <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-4 p-5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 [&::-webkit-details-marker]:hidden">
                <span className="flex-1">
                  <span className="mb-1 block text-xs font-semibold text-amber-800 uppercase">
                    {faq.category}
                  </span>
                  <span className="block font-medium text-foreground">{faq.question}</span>
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <div className="border-t border-slate-100 px-5 py-4">
                <p className="text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
