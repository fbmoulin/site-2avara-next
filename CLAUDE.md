# 2a Vara Civel de Cariacica — Portal

## Stack
- Next.js 16 App Router, TypeScript, Tailwind CSS, shadcn/ui
- Supabase PostgreSQL (Drizzle ORM, `prepare: false`, `max: 1` for Supavisor)
- Supabase Auth (admin only, email/password)
- Supabase Storage (article image uploads, bucket `images`)
- OpenAI GPT-4o-mini (streaming chatbot)
- Resend (email notifications, optional)
- Upstash Redis (rate limiting, optional — lazy singleton pattern)

## Commands
- `bun run dev` — dev server (port 3000)
- `bun run build` — production build
- `bun run start` — serve production build
- `bun run lint` — ESLint
- `bunx playwright test` — 14 E2E tests (auto-starts dev server on port 3099)
- `bunx drizzle-kit push` — push schema to Supabase (source .env.local first)

## Environment Setup
```bash
cp .env.example .env.local
# Fill: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL, OPENAI_API_KEY, CRON_SECRET
# Optional: RESEND_API_KEY, UPSTASH_REDIS_REST_URL (graceful fallback without)
# Push schema:
source <(grep -v '^#' .env.local | grep -v '^$' | sed 's/^/export /') && bunx drizzle-kit push
```

## Key Files
- `lib/db/schema.ts` — Drizzle schema (5 tables, 7 indexes)
- `lib/openai.ts` — OpenAI client + legal triage system prompt
- `lib/constants.ts` — Services, FAQs, judge info, contact info
- `lib/validators.ts` — Zod v4 schemas for public API routes
- `lib/rate-limit.ts` — Upstash Redis rate limiters (lazy singleton, fail-open in dev)
- `app/admin/actions.ts` — Server Actions with requireAdmin() + Zod input validation
- `app/api/upload/route.ts` — Image upload with auth + magic byte validation
- `middleware.ts` — Protects `/admin/*` via Supabase Auth JWT

## Architecture
- Landing page is SSG, news ISR 1h, articles ISR 60s, admin CSR
- API routes at `app/api/` — contact, appointments, demands, chat (SSE), news (cron), upload
- Admin uses Server Actions with `requireAdmin()` auth guard on all 15 functions
- Chatbot is stateless — client sends `{ message, history[] }`, server prepends system prompt
- Cron: `vercel.json` triggers `/api/news?cron=true` daily (CRON_SECRET auth, fail-closed)
- Blog: admin publishes articles → `revalidatePath("/", "/artigos")` refreshes public pages
- Image upload: Supabase Storage bucket `images`, auth required, magic byte + MIME validation

## Conventions
- Portuguese for all UI text
- English for code, variables, comments
- Server Components by default; `"use client"` only for interactivity
- Lazy init for API clients (OpenAI, Resend, Redis) — avoids build-time env errors
- Rate limiters use lazy singleton (cached after first access, not recreated per call)
- `bun` only — never npm/yarn/pnpm
- Zod v4 — import from `zod/v4`

## Security
- All Server Actions validate UUID IDs and use status allow-lists
- Upload route: auth + MIME check + magic byte validation + sanitized error messages
- Chat: Zod schema (message max 2000 chars, history max 20 items, role enum)
- CSP header: restricts script/frame/connect/img sources
- HSTS 2yr + X-Frame-Options DENY + X-Content-Type-Options nosniff
- Email HTML: `esc()` helper prevents XSS in templates
- Rate limiting: x-forwarded-for first IP extraction, lazy singleton instances
- Login: redirect param validated (must start with "/" not "//")
- Dark mode/font size/contrast persisted to localStorage

## Database
- 5 tables: contact_messages, appointments, demands, news, articles
- Connection: pooler URL (port 6543, `?pgbouncer=true`, `max: 1`)
- Admin users managed via Supabase Auth (not a custom table)

## Gotchas
- Zod v4 installed — import from `zod/v4`, not `zod`
- `drizzle-kit` does not auto-load `.env.local` — source env vars manually
- Turbopack warns about multiple lockfiles if parent dir has `package-lock.json` — ignore
- `middleware.ts` deprecated in Next.js 16 (should be `proxy.ts`) — works with warning
- API clients must be lazy-initialized or build fails (no top-level const)
- Rate limiter getters must cache instances (lazy singleton) — recreating per access disables limiting
- Tailwind v4: CSS vars (`:root`/`.dark`) must be inside `@layer base` or they get stripped
- Use semantic tokens (bg-background) not hardcoded colors (bg-white) for dark mode

## Deploy
- Vercel: https://site-2avara-next.vercel.app
- Domain: https://2avaraciveldecariacica.org (Hostinger DNS → Vercel A records 76.76.21.21)
- GitHub: https://github.com/fbmoulin/site-2avara-next
- Admin: admin@2avaraciveldecariacica.org
