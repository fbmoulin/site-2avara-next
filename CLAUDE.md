# 2a Vara Civel de Cariacica — Portal

## Stack
- Next.js 16 App Router, TypeScript, Tailwind CSS, shadcn/ui
- Supabase PostgreSQL (Drizzle ORM, `prepare: false` for Supavisor)
- Supabase Auth (admin only, email/password)
- OpenAI GPT-4o-mini (streaming chatbot)
- Resend (email notifications)
- Upstash Redis (rate limiting)

## Commands
- `bun run dev` — dev server
- `bun run build` — production build
- `bunx playwright test` — 14 E2E tests (requires dev server or auto-starts)
- `bunx drizzle-kit push` — push schema to Supabase (needs DATABASE_URL)

## Conventions
- Portuguese for all UI text
- English for code, variables, comments
- Server Components by default; "use client" only for interactivity
- Lazy init for API clients (OpenAI, Resend, Redis) to avoid build-time errors
- Rate limiting and email have graceful fallbacks when env vars missing

## Architecture
- `middleware.ts` protects `/admin/*` (Supabase Auth check)
- API routes at `app/api/` (contact, appointments, demands, chat, news)
- Admin uses Server Actions in `app/admin/actions.ts`
- Landing page is SSG, news ISR 1h, articles ISR 60s
- Chatbot is stateless (client sends history[], server prepends system prompt)

## Database
- 5 tables: contact_messages, appointments, demands, news, articles
- Connection: pooler URL (port 6543, `?pgbouncer=true`)
- Supabase project: lssmtwilfxiwojahqfaa (sa-east-1, Free tier)
