import { Suspense } from "react"
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
      <Suspense fallback={<div className="bg-background py-20"><div className="mx-auto max-w-7xl px-4"><div className="h-64 animate-pulse rounded-xl bg-muted" /></div></div>}>
        <BlogPreview />
      </Suspense>
      <Suspense fallback={<div className="bg-muted py-20"><div className="mx-auto max-w-7xl px-4"><div className="h-64 animate-pulse rounded-xl bg-background" /></div></div>}>
        <NewsPreview />
      </Suspense>
      <Faq />
      <ContactForm />
    </main>
  )
}
