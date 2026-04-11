import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vlibras.gov.br",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' https://images.unsplash.com https://*.supabase.co data: blob:",
              "font-src 'self' data:",
              "frame-src https://www.google.com https://vlibras.gov.br",
              "connect-src 'self' https://*.supabase.co https://api.openai.com https://vlibras.gov.br",
            ].join("; "),
          },
        ],
      },
    ]
  },
}

export default nextConfig
