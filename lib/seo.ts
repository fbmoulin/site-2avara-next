// Search metadata and structured data (SPEC-PORTAL-001 R3.1). Pure functions, no Next imports, so
// the JSON-LD can be unit tested. The portal is informative and is not an official TJES page: no
// text here may present it as "portal oficial".
import {
  ADDRESS,
  CONTACT_INFO,
  FORUM_COORDINATES,
  OFFICE_HOURS,
  type FaqItem,
} from "./constants"

export const SITE_URL = "https://2avaraciveldecariacica.org"
export const SITE_NAME = "2ª Vara Cível de Cariacica"
export const SITE_DESCRIPTION =
  "Portal informativo da 2ª Vara Cível de Cariacica (ES): serviços, pauta de audiências, notícias e contato."
export const OG_IMAGE = {
  url: "/images/og-portal.jpg",
  width: 1200,
  height: 630,
  alt: "2ª Vara Cível de Cariacica, Comarca de Cariacica (ES): serviços, pauta de audiências, notícias e contato",
} as const

// Public routes with a fixed address; the sitemap lists them plus the published articles.
export const FIXED_PUBLIC_ROUTES = ["/", "/pauta", "/noticias", "/artigos"] as const

// The home is written without the trailing slash, like the canonical Next derives from metadataBase.
export function absoluteUrl(path: string) {
  const url = new URL(path, SITE_URL).toString()
  return url === `${SITE_URL}/` ? SITE_URL : url
}

/**
 * Metadata of a public page: title (completed by the root title.template), description, canonical
 * and the whole Open Graph block. Next merges metadata shallowly, so a page that sets openGraph must
 * repeat the shared fields, or it would lose the image and the site name.
 */
export function pageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path,
  absoluteTitle = false,
}: {
  title: string
  description?: string
  path: string
  absoluteTitle?: boolean
}) {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website" as const,
      locale: "pt_BR",
      siteName: SITE_NAME,
      title,
      description,
      url: path,
      images: [OG_IMAGE],
    },
  }
}

type JsonLd = Record<string, unknown>

const TJES = {
  "@type": "GovernmentOrganization",
  name: "Tribunal de Justiça do Estado do Espírito Santo",
  url: "https://www.tjes.jus.br",
}

function postalAddress() {
  return {
    "@type": "PostalAddress",
    streetAddress: ADDRESS.street,
    addressLocality: ADDRESS.city,
    addressRegion: ADDRESS.region,
    postalCode: ADDRESS.postalCode,
    addressCountry: ADDRESS.country,
  }
}

function openingHours() {
  return {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [...OFFICE_HOURS.days],
    opens: OFFICE_HOURS.opens,
    closes: OFFICE_HOURS.closes,
  }
}

export function governmentOrganizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "GovernmentOrganization",
    "@id": `${SITE_URL}/#organizacao`,
    name: SITE_NAME,
    description: "Unidade judiciária cível da Comarca de Cariacica (ES).",
    url: SITE_URL,
    telephone: CONTACT_INFO.phoneInternational,
    email: CONTACT_INFO.email,
    address: postalAddress(),
    parentOrganization: TJES,
    areaServed: { "@type": "City", name: "Cariacica" },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "atendimento ao público",
      telephone: CONTACT_INFO.phoneInternational,
      email: CONTACT_INFO.email,
      availableLanguage: "pt-BR",
      hoursAvailable: openingHours(),
    },
    // The Fórum is the place where the court works; opening hours belong to a Place.
    location: {
      "@type": "Courthouse",
      name: "Fórum de Cariacica",
      address: postalAddress(),
      geo: {
        "@type": "GeoCoordinates",
        latitude: FORUM_COORDINATES.latitude,
        longitude: FORUM_COORDINATES.longitude,
      },
      openingHoursSpecification: openingHours(),
    },
  }
}

export function faqPageJsonLd(faqs: readonly FaqItem[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  }
}

export interface ArticleForJsonLd {
  title: string
  slug: string
  excerpt: string | null
  author: string
  imageUrl: string | null
  publishedAt: Date | null
  updatedAt: Date | null
}

export function articleJsonLd(article: ArticleForJsonLd): JsonLd {
  const url = absoluteUrl(`/artigos/${article.slug}`)
  const publisher = { "@type": "Organization", name: SITE_NAME, url: SITE_URL }
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title.slice(0, 110),
    ...(article.excerpt ? { description: article.excerpt } : {}),
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: [article.imageUrl ? absoluteUrl(article.imageUrl) : absoluteUrl(OG_IMAGE.url)],
    ...(article.publishedAt ? { datePublished: article.publishedAt.toISOString() } : {}),
    ...(article.updatedAt ? { dateModified: article.updatedAt.toISOString() } : {}),
    author:
      article.author === SITE_NAME ? publisher : { "@type": "Person", name: article.author },
    publisher,
    inLanguage: "pt-BR",
  }
}

/**
 * JSON for a <script type="application/ld+json">. JSON.stringify does not escape HTML, so "<" is
 * written as < (Next JSON-LD guide): text from the database cannot close the script tag.
 */
export function serializeJsonLd(data: JsonLd) {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
