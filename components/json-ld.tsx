import { serializeJsonLd } from "@/lib/seo"

// Structured data for search engines (R3.1): a native <script> of data, which the browser never
// executes (so the CSP does not apply to it). Rendered only by public pages.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
  )
}
