# 2a Vara Civel de Cariacica — Portal

## Stack
- Next.js 16 App Router, TypeScript, Tailwind CSS, shadcn/ui
- Supabase PostgreSQL (Drizzle ORM, `prepare: false` for Supavisor)
- Supabase Auth (admin only, email/password)
- OpenAI GPT-4o-mini (streaming chatbot)
- Resend (email notifications, optional)
- Upstash Redis (rate limiting, optional)

## Commands
- `bun run dev` — dev server (port 3000)
- `bun run build` — production build
- `bun run start` — serve production build
- `bun run lint` — ESLint
- `bunx playwright test` — 14 E2E tests (auto-starts dev server)
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
- `lib/constants.ts` — Services, FAQs, judge info, contact info (hardcoded data)
- `app/admin/actions.ts` — All admin Server Actions (CRUD for 5 resources)
- `middleware.ts` — Protects `/admin/*` via Supabase Auth JWT check

## Architecture
- Landing page is SSG, news ISR 1h, articles ISR 60s, admin CSR
- API routes at `app/api/` — contact, appointments, demands, chat (SSE streaming), news (cron)
- Admin uses Server Actions, not API routes
- Chatbot is stateless — client sends `{ message, history[] }`, server prepends system prompt
- Cron: `vercel.json` triggers `/api/news?cron=true` daily (CRON_SECRET auth)

## Conventions
- Portuguese for all UI text
- English for code, variables, comments
- Server Components by default; `"use client"` only for interactivity
- Lazy init for API clients (OpenAI, Resend, Redis) — avoids build-time env errors
- `bun` only — never npm/yarn/pnpm

## Database
- 5 tables: contact_messages, appointments, demands, news, articles
- Connection: pooler URL (port 6543, `?pgbouncer=true`), direct URL (port 5432) for migrations only
- Admin users managed via Supabase Auth (not a custom table)

## Gotchas
- Zod v4 installed — import from `zod/v4`, not `zod`
- `drizzle-kit` does not auto-load `.env.local` — source env vars manually before running
- Turbopack warns about multiple lockfiles if parent dir has `package-lock.json` — safe to ignore
- `middleware.ts` is deprecated in Next.js 16 (should be `proxy.ts`) — works with deprecation warning
- OpenAI/Resend/Redis clients must be lazy-initialized (function, not top-level const) or build fails

## Deploy
- Vercel: https://site-2avara-next.vercel.app
- Domain: https://2avaraciveldecariacica.org (Hostinger DNS → Vercel A records)
- GitHub: https://github.com/fbmoulin/site-2avara-next
