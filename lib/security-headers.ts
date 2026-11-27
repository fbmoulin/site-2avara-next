// Security headers (SPEC-PORTAL-001 R1.6 and R2.1). Imported by next.config.ts and proxy.ts, so keep
// it free of Next/server-only imports.
// The public CSP keeps 'unsafe-inline'/'unsafe-eval' in script-src because VLibras needs them. The
// administrative routes do not load VLibras and get a per-request nonce CSP from proxy.ts instead.

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

// Paths rendered by app/(admin). They receive the nonce CSP from proxy.ts, never the public one.
export const ADMIN_PATHS = ["/admin", "/login", "/acesso-negado", "/servico-indisponivel"] as const

export function isAdminPath(pathname: string) {
  return ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

// next.config.ts header source: every path except the administrative ones. Kept in sync with
// ADMIN_PATHS by tests/security-headers.test.ts.
export const PUBLIC_CSP_SOURCE =
  "/((?!admin(?:/|$)|login(?:/|$)|acesso-negado(?:/|$)|servico-indisponivel(?:/|$)).*)"

function supabaseOrigin(supabaseHost: string | undefined) {
  // Pin the project host; the wildcard is only a fallback when the variable is absent.
  return supabaseHost ? `https://${supabaseHost}` : "https://*.supabase.co"
}

export function contentSecurityPolicy(supabaseHost: string | undefined): string {
  const supabase = supabaseOrigin(supabaseHost)
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

/**
 * CSP of the administrative routes: scripts only with the request nonce (and what they load, via
 * 'strict-dynamic'). No 'unsafe-inline' and, in production, no 'unsafe-eval'. React needs eval only
 * in development to rebuild server error stacks (Next CSP guide), so `development` adds it there.
 */
export function adminContentSecurityPolicy(
  nonce: string,
  supabaseUrl: string | undefined,
  development = false,
): string {
  // The login form talks to Supabase Auth from the browser: allow exactly that origin.
  let supabase = supabaseOrigin(undefined)
  try {
    if (supabaseUrl) supabase = new URL(supabaseUrl).origin
  } catch {}
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    // React style attributes and the component library need inline styles; scripts stay strict.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' https://images.unsplash.com ${supabase} data: blob:`,
    "font-src 'self' data:",
    `connect-src 'self' ${supabase}`,
    "frame-src 'none'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ")
}

export function createNonce() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
}

// Headers for every route. The CSP is separate: see publicSecurityHeaders and proxy.ts.
export function securityHeaders() {
  return [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ]
}

export function publicSecurityHeaders(supabaseHost: string | undefined) {
  return [{ key: "Content-Security-Policy", value: contentSecurityPolicy(supabaseHost) }]
}
