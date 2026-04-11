import { Hero } from "@/components/landing/hero"
import { Judge } from "@/components/landing/judge"
import { Services } from "@/components/landing/services"
import { NewsPreview } from "@/components/landing/news-preview"
import { Faq } from "@/components/landing/faq"
import { ContactForm } from "@/components/landing/contact-form"

export default function Home() {
  return (
    <main id="main-content">
      <Hero />
      <Judge />
      <Services />
      <NewsPreview />
      <Faq />
      <ContactForm />
    </main>
  )
}
