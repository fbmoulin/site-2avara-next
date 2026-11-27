import type { NextConfig } from "next"
import { PUBLIC_CSP_SOURCE, publicSecurityHeaders, securityHeaders } from "./lib/security-headers"

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined

const nextConfig: NextConfig = {
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
