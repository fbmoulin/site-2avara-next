import { describe, expect, test } from "bun:test"
import robots from "../app/robots"
import { ADDRESS, CONTACT_INFO, FAQS, OFFICE_HOURS } from "../lib/constants"
import { ADMIN_PATHS } from "../lib/security-headers"
import {
  absoluteUrl,
  articleJsonLd,
  faqPageJsonLd,
  FIXED_PUBLIC_ROUTES,
  governmentOrganizationJsonLd,
  OG_IMAGE,
  pageMetadata,
  serializeJsonLd,
  SITE_NAME,
  SITE_URL,
} from "../lib/seo"

// Reads a dotted path ("address.postalCode") from parsed JSON-LD.
function field(value: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], value)
}

// SPEC-PORTAL-001 R3.1
describe("search metadata", () => {
  test("pageMetadata sets canonical and a complete Open Graph block", () => {
    const meta = pageMetadata({ title: "Notícias do TJES", path: "/noticias" })
    expect(meta.title).toBe("Notícias do TJES")
    expect(meta.alternates.canonical).toBe("/noticias")
    expect(meta.openGraph).toMatchObject({
      url: "/noticias",
      siteName: SITE_NAME,
      locale: "pt_BR",
      images: [OG_IMAGE],
    })
    expect(pageMetadata({ title: SITE_NAME, path: "/", absoluteTitle: true }).title).toEqual({
      absolute: SITE_NAME,
    })
  })

  test("the portal never calls itself official", () => {
    const texts = JSON.stringify([
      pageMetadata({ title: "x", path: "/" }),
      governmentOrganizationJsonLd(),
      OG_IMAGE,
    ])
    expect(texts.toLowerCase()).not.toContain("oficial")
  })

  test("fixed routes are the four public pages", () => {
    expect([...FIXED_PUBLIC_ROUTES]).toEqual(["/", "/pauta", "/noticias", "/artigos"])
    expect(absoluteUrl("/pauta")).toBe(`${SITE_URL}/pauta`)
    expect(absoluteUrl("/")).toBe(SITE_URL)
  })

  test("robots keeps the admin group and the APIs out and points to the sitemap", () => {
    const rules = robots()
    expect(rules.sitemap).toBe(`${SITE_URL}/sitemap.xml`)
    const disallow = (rules.rules as { disallow: string[] }).disallow
    for (const path of [...ADMIN_PATHS, "/api/"]) expect(disallow).toContain(path)
    expect(disallow).not.toContain("/")
  })
})

describe("JSON-LD", () => {
  test("GovernmentOrganization carries address, phone and opening hours from the constants", () => {
    const org = governmentOrganizationJsonLd()
    expect(org["@type"]).toBe("GovernmentOrganization")
    expect(org.name).toBe(SITE_NAME)
    expect(org.telephone).toBe(CONTACT_INFO.phoneInternational)
    expect(org.address).toMatchObject({
      "@type": "PostalAddress",
      streetAddress: ADDRESS.street,
      addressLocality: "Cariacica",
      addressRegion: "ES",
      postalCode: ADDRESS.postalCode,
      addressCountry: "BR",
    })
    const hours = {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [...OFFICE_HOURS.days],
      opens: "12:00",
      closes: "18:00",
    }
    expect(field(org, "location.openingHoursSpecification")).toEqual(hours)
    expect(field(org, "contactPoint.hoursAvailable")).toEqual(hours)
    expect(CONTACT_INFO.address).toBe("R. Meridional, 1000 - Alto Lage, Cariacica - ES, 29151-230")
  })

  test("FAQPage has one question per FAQ with the answer text", () => {
    const faq = faqPageJsonLd(FAQS) as { mainEntity: Record<string, unknown>[] }
    expect(faq.mainEntity).toHaveLength(FAQS.length)
    expect(faq.mainEntity[0]).toEqual({
      "@type": "Question",
      name: FAQS[0].question,
      acceptedAnswer: { "@type": "Answer", text: FAQS[0].answer },
    })
  })

  test("Article uses absolute URLs, dates and the organization as publisher", () => {
    const published = new Date("2026-11-20T10:00:00Z")
    const article = articleJsonLd({
      title: "Título",
      slug: "titulo",
      excerpt: "Resumo",
      author: SITE_NAME,
      imageUrl: null,
      publishedAt: published,
      updatedAt: published,
    })
    expect(article).toMatchObject({
      "@type": "Article",
      headline: "Título",
      url: `${SITE_URL}/artigos/titulo`,
      image: [`${SITE_URL}${OG_IMAGE.url}`],
      datePublished: published.toISOString(),
      author: { "@type": "Organization", name: SITE_NAME },
    })
    const byPerson = articleJsonLd({
      title: "T",
      slug: "t",
      excerpt: null,
      author: "Fulana de Tal",
      imageUrl: "https://exemplo.supabase.co/storage/v1/object/public/images/a.jpg",
      publishedAt: null,
      updatedAt: null,
    })
    expect(byPerson.author).toEqual({ "@type": "Person", name: "Fulana de Tal" })
    expect(byPerson.image).toEqual([
      "https://exemplo.supabase.co/storage/v1/object/public/images/a.jpg",
    ])
    expect(byPerson).not.toHaveProperty("datePublished")
  })

  test("serialization cannot close the script tag", () => {
    const json = serializeJsonLd({ headline: "</script><script>alert(1)</script>" })
    expect(json).not.toContain("<")
    expect(JSON.parse(json).headline).toBe("</script><script>alert(1)</script>")
  })
})
