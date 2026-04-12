# 2a Vara Civel de Cariacica — Portal

## Stack
- Next.js 16 App Router, TypeScript, Tailwind CSS v4, shadcn/ui
- Supabase PostgreSQL (Drizzle ORM, `prepare: false`, `max: 1` for Supavisor)
- Supabase Auth (admin only, email/password)
- Supabase Storage (article image uploads, bucket `images`)
- OpenAI GPT-4o-mini (streaming chatbot with option-based conversational flow)
- Framer Motion (scroll animations, spring accordion, stagger reveals)
- Resend (email notifications, optional)
- Upstash Redis (rate limiting, optional — lazy singleton, fail-closed on error)
- ESLint strict + a11y (jsx-a11y) + Prettier

## Commands
- `bun run dev` — dev server (port 3000)
- `bun run build` — production build
- `bun run start` — serve production build
- `bun run lint` — ESLint (strict TS + a11y + Prettier)
- `bun run lint:fix` — ESLint auto-fix
- `bun run format` — Prettier format all files
- `bunx playwright test` — 19 E2E tests (auto-starts dev server on port 3099)
- `bunx drizzle-kit push` — push schema to Supabase (source .env.local first)

## Environment Setup
```bash
cp .env.example .env.local
# Fill: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL, OPENAI_API_KEY, CRON_SECRET
# Optional: RESEND_API_KEY, UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN (graceful fallback without)
# Push schema:
source <(grep -v '^#' .env.local | grep -v '^$' | sed 's/^/export /') && bunx drizzle-kit push
```

## Key Files
- `lib/db/schema.ts` — Drizzle schema (5 tables, 7 indexes)
- `lib/openai.ts` — OpenAI client (lazy singleton) + chatbot system prompt
- `lib/logger.ts` — Structured browser logger (sendBeacon transport to /api/client-errors)
- `lib/constants.ts` — Services, FAQs, judge info, contact info
- `lib/validators.ts` — Zod v4 schemas for public API routes
- `lib/rate-limit.ts` — Upstash Redis rate limiters (lazy singleton, fail-closed on Redis error)
- `app/admin/actions.ts` — Server Actions with requireAdmin() + Zod input validation + status allow-lists
- `app/api/upload/route.ts` — Image upload with auth + magic byte validation (JPEG/PNG/WebP full signature)
- `app/api/client-errors/route.ts` — Frontend error logging endpoint (Zod validated, max 10 per batch)
- `app/sitemap.ts` — Dynamic sitemap with article slugs
- `app/robots.ts` — Robots.txt (disallows /admin, /api, /login)
- `middleware.ts` — Protects `/admin/*` via Supabase Auth JWT
- `components/motion/scroll-reveal.tsx` — Scroll-triggered animation wrapper (useInView + initial={false})
- `components/motion/stagger-container.tsx` — Staggered children animation container

## Architecture
- Landing page is SSG with Suspense boundaries (blog/news stream with skeleton fallbacks)
- API routes at `app/api/` — contact, appointments, demands, chat (SSE), news (cron), upload, client-errors
- Admin uses Server Actions with `requireAdmin()` auth guard on all 15 functions
- Chatbot: option-based conversational flow (2-3 numbered choices), induces virtual appointments first
- Cron: `vercel.json` triggers `/api/news?cron=true` daily (CRON_SECRET auth, fail-closed)
- Blog: admin publishes articles → `revalidatePath("/", "/artigos")` refreshes public pages
- Image upload: Supabase Storage bucket `images`, auth required, magic byte + MIME validation
- Frontend logger: auto-captures window.onerror + unhandledrejection, sendBeacon to /api/client-errors (prod only)
- Navbar: Server Component shell + client island (navbar-client.tsx) for scroll-spy/hamburger
- VLibras: client component (vlibras-init.tsx) loads script + initializes Widget in onload callback
- Route transitions: CSS-only fade via template.tsx (tw-animate-css, no hydration issues)
- Scroll animations: Framer Motion useInView + initial={false} (no SSR style mismatch)

## Conventions
- Portuguese for all UI text
- English for code, variables, comments
- Server Components by default; `"use client"` only for interactivity
- Lazy init for API clients (OpenAI, Resend, Redis) — avoids build-time env errors
- Rate limiters use lazy singleton (cached after first access, not recreated per call)
- `bun` only — never npm/yarn/pnpm
- Zod v4 — import from `zod/v4`; `z.record()` requires 2 args (key schema, value schema)
- All API routes wrap `request.json()` in try/catch returning 400

## Security
- All Server Actions validate UUID IDs and use status allow-lists (read + write)
- Upload route: auth + MIME check + magic byte validation (full WEBP signature) + sanitized error messages
- Chat: Zod schema (message max 2000 chars, history max 20 items, role enum), try/catch around streamChatResponse (503)
- CSP header: restricts script/frame/connect/img sources
- HSTS 2yr + X-Frame-Options DENY + X-Content-Type-Options nosniff
- Email HTML: `esc()` helper prevents XSS in templates
- Rate limiting: x-forwarded-for first IP extraction, lazy singleton instances, fail-closed on Redis error
- Login: redirect param validated (must start with "/" not "//"), Supabase client via useMemo singleton
- Dark mode/font size/contrast persisted to localStorage
- Client error logging: Zod validated batch (max 10), structured JSON to Vercel stdout

## Database
- 5 tables: contact_messages, appointments, demands, news, articles
- Connection: pooler URL (port 6543, `?pgbouncer=true`, `max: 1`)
- Admin users managed via Supabase Auth (not a custom table)
- News scraper: batch-fetches existing externalIds before insert/update loop (no N+1)

## SEO
- `app/sitemap.ts` — dynamic sitemap with published article slugs
- `app/robots.ts` — disallows /admin, /api, /login
- Article pages: Open Graph metadata (title, description, image, type: article)
- All article images use `next/image` with priority + responsive sizes

## Gotchas
- Zod v4 installed — import from `zod/v4`, not `zod`; `z.record()` needs 2 args
- `drizzle-kit` does not auto-load `.env.local` — source env vars manually
- Turbopack warns about multiple lockfiles if parent dir has `package-lock.json` — ignore
- `middleware.ts` deprecated in Next.js 16 (should be `proxy.ts`) — works with warning
- API clients must be lazy-initialized or build fails (no top-level const)
- Rate limiter getters must cache instances (lazy singleton) — recreating per access disables limiting
- Tailwind v4: CSS vars (`:root`/`.dark`) must be inside `@layer base` or they get stripped
- Use semantic tokens (bg-background) not hardcoded colors (bg-white) for dark mode
- Framer Motion SSR: use `initial={false}` + `useInView` hook, NOT `whileInView` + `initial={{ opacity: 0 }}` (causes hydration mismatch)
- Framer Motion + `position: fixed`: don't add `relative` to a `fixed` element (Tailwind v4: `relative` overrides `fixed`)
- VLibras: must load plugin JS and init Widget in same onload callback (separate Script tags race)
- `next/dynamic` with `ssr: false` cannot be used in Server Component layout.tsx

## Deploy
- Vercel: https://site-2avara-next.vercel.app
- Domain: https://2avaraciveldecariacica.org (Hostinger DNS → Vercel A records 76.76.21.21)
- GitHub: https://github.com/fbmoulin/site-2avara-next
- Admin: admin@2avaraciveldecariacica.org

## Pending (next session)
- Audio chatbot (voice input via Whisper + TTS output) — research complete, Option B recommended (~$20-40/mo)
- `middleware.ts` → `proxy.ts` migration (Next.js 16 deprecation, warning only, no runtime impact)
