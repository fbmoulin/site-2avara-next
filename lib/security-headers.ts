// Security headers for every route (SPEC-PORTAL-001 R1.6). Imported by next.config.ts, so keep it
// free of Next/server-only imports.
// 'unsafe-inline'/'unsafe-eval' in script-src stay until the admin is isolated (wave 2): VLibras needs them.

const VLIBRAS = "https://vlibras.gov.br"
// vlibras.gov.br/app/vlibras-plugin.js redirects to the official build on jsDelivr. Only that
// repository path is allowed: opening all of cdn.jsdelivr.net would let any GitHub code run here.
const VLIBRAS_CDN = "https://cdn.jsdelivr.net/gh/spbgovbr-vlibras/"
// Services the VLibras widget calls from the page (translation, sign dictionary, categories).
const VLIBRAS_API = [
  "https://traducao2.vlibras.gov.br",
  "https://dicionario2.vlibras.gov.br",
  "https://repositorio.vlibras.gov.br",
]

export function contentSecurityPolicy(supabaseHost: string | undefined): string {
  // Pin the project host; the wildcard is only a fallback when the variable is absent.
  const supabase = supabaseHost ? `https://${supabaseHost}` : "https://*.supabase.co"
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${VLIBRAS} ${VLIBRAS_CDN}`,
    `style-src 'self' 'unsafe-inline' ${VLIBRAS_CDN}`,
    `img-src 'self' https://images.unsplash.com ${supabase} ${VLIBRAS} ${VLIBRAS_CDN} data: blob:`,
    // font-src follows the official VLibras CSP guide (vlibras.gov.br and cdn.jsdelivr.net).
    `font-src 'self' data: ${VLIBRAS} ${VLIBRAS_CDN}`,
    `frame-src https://www.google.com ${VLIBRAS}`,
    `connect-src 'self' ${supabase} ${VLIBRAS} ${VLIBRAS_CDN} ${VLIBRAS_API.join(" ")}`,
    // The VLibras avatar runs in WebAssembly with blob: workers.
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ")
}

export function securityHeaders(supabaseHost: string | undefined) {
  return [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Content-Security-Policy", value: contentSecurityPolicy(supabaseHost) },
  ]
}
