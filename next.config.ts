import type { NextConfig } from "next"
import { PUBLIC_CSP_SOURCE, publicSecurityHeaders, securityHeaders } from "./lib/security-headers"

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined

const nextConfig: NextConfig = {
  // verify:local (E2E_FIXTURE=1) builds against one disposable PGlite behind a socket server, which
  // runs every connection on the same session: parallel build workers interleave their unnamed
  // prepared statements ("bind message supplies 3 parameters, but prepared statement "" requires
  // 2"). One build worker there keeps one connection. Production builds are unchanged.
  ...(process.env.E2E_FIXTURE === "1" ? { experimental: { cpus: 1 } } : {}),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/images/**",
            },
          ]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders(),
      },
      // The public CSP (VLibras) never reaches the admin routes; proxy.ts sends their nonce CSP.
      {
        source: PUBLIC_CSP_SOURCE,
        headers: publicSecurityHeaders(supabaseHost),
      },
    ]
  },
}

export default nextConfig
