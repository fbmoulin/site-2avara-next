# 2a Vara Civel de Cariacica — Portal Oficial

Portal institucional da 2a Vara Civel de Cariacica (TJES) com chatbot IA, painel administrativo e sistema de agendamentos.

## Stack

- **Frontend**: Next.js 16 (App Router, SSR/SSG/ISR)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase PostgreSQL + Drizzle ORM
- **Auth**: Supabase Auth (admin only)
- **Chatbot**: OpenAI GPT-4o-mini (streaming SSE)
- **Email**: Resend (notifications)
- **Rate Limiting**: Upstash Redis
- **Deploy**: Vercel
- **Domain**: 2avaraciveldecariacica.org (Hostinger DNS)

## Getting Started

```bash
bun install
cp .env.example .env.local
# Fill in Supabase, OpenAI, Resend, and Upstash credentials
bunx drizzle-kit push
bun run dev
```

## Project Structure

```
app/
  page.tsx              # Landing page (SSG)
  layout.tsx            # Root layout (navbar, footer, chatbot, VLibras)
  login/                # Admin login (Supabase Auth)
  admin/                # Admin panel (6 pages, server actions)
  noticias/             # News list (ISR 1h)
  artigos/              # Articles list + [slug] detail (ISR 60s)
  api/                  # API routes (contact, appointments, demands, chat, news)
components/
  landing/              # Landing page sections (hero, judge, services, faq, etc.)
  admin/                # Admin UI components (sidebar)
  chatbot.tsx           # OpenAI chat widget (SSE streaming)
  navbar.tsx            # Responsive navigation with scroll-spy
  footer.tsx            # Institutional footer
  accessibility-bar.tsx # Accessibility controls (font size, contrast, dark mode)
lib/
  db/                   # Drizzle schema + client
  auth.ts               # Supabase server auth helpers
  email.ts              # Resend email notifications
  openai.ts             # OpenAI client + legal triage system prompt
  news-scraper.ts       # TJES news RSS scraper
  rate-limit.ts         # Upstash rate limiting
  validators.ts         # Zod validation schemas
  constants.ts          # Services, FAQs, judge info, contact info
```

## Environment Variables

See `.env.example` for the full list. Required:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `DATABASE_URL` | Supabase pooler connection (port 6543) |
| `OPENAI_API_KEY` | OpenAI API key |
| `CRON_SECRET` | Secret for Vercel Cron jobs |

Optional (graceful fallback without):

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend email (logs to console without) |
| `UPSTASH_REDIS_REST_URL` | Rate limiting (disabled without) |

## Testing

```bash
bunx playwright test
# 14 tests: smoke (pages, validation, auth) + integration (DB, OpenAI streaming)
```

## Database

5 tables managed by Drizzle ORM: `contact_messages`, `appointments`, `demands`, `news`, `articles`. Admin users via Supabase Auth.

## Accessibility

Font size controls, high contrast, dark mode, VLibras (LIBRAS), keyboard shortcuts. WCAG 2.2 AA.
