import type { MetadataRoute } from "next"
import { ADMIN_PATHS } from "@/lib/security-headers"
import { absoluteUrl } from "@/lib/seo"

// R3.1: the panel, login and access status pages (app/(admin)) and the APIs stay out of the index.
// The admin pages also send robots noindex in their metadata.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...ADMIN_PATHS, "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  }
}
