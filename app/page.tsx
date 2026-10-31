import { Suspense } from "react"
import Link from "next/link"
import { Hero } from "@/components/landing/hero"
import { Judge } from "@/components/landing/judge"
import { Services } from "@/components/landing/services"
import { BlogPreview } from "@/components/landing/blog-preview"
import { NewsPreview } from "@/components/landing/news-preview"
import { Faq } from "@/components/landing/faq"
import { ContactForm } from "@/components/landing/contact-form"

export default function Home() {
  return (
    <main id="main-content">
      <Hero />
      <Judge />
      <Services />
      <section className="bg-muted px-4 py-10 text-center" aria-labelledby="pauta-heading">
        <h2 id="pauta-heading" className="text-2xl font-bold">
          Pauta semanal de audiências
        </h2>
        <p className="my-3">Consulte os horários e as modalidades das audiências desta semana.</p>
        <Link
          href="/pauta"
          className="inline-block rounded bg-primary px-5 py-3 text-primary-foreground"
        >
          Consultar pauta da semana
        </Link>
      </section>
      <Suspense
        fallback={
          <div className="bg-background py-20">
            <div className="mx-auto max-w-7xl px-4">
              <div className="h-64 animate-pulse rounded-xl bg-muted" />
            </div>
          </div>
        }
      >
        <BlogPreview />
      </Suspense>
      <Suspense
        fallback={
          <div className="bg-muted py-20">
            <div className="mx-auto max-w-7xl px-4">
              <div className="h-64 animate-pulse rounded-xl bg-background" />
            </div>
          </div>
        }
      >
        <NewsPreview />
      </Suspense>
      <Faq />
      <ContactForm />
    </main>
  )
}
