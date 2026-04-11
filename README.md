# 2a Vara Civel de Cariacica — Portal Oficial

Portal institucional da 2a Vara Civel de Cariacica (TJES) com chatbot IA, painel administrativo, blog e sistema de agendamentos.

## Stack

- **Frontend**: Next.js 16 (App Router, SSR/SSG/ISR)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Supabase PostgreSQL + Drizzle ORM
- **Storage**: Supabase Storage (image uploads)
- **Auth**: Supabase Auth (admin only)
- **Chatbot**: OpenAI GPT-4o-mini (streaming SSE)
- **Email**: Resend (notifications)
- **Rate Limiting**: Upstash Redis
- **Deploy**: Vercel
- **Domain**: 2avaraciveldecariacica.org

## Getting Started

```bash
bun install
cp .env.example .env.local
# Fill in credentials (see Environment Variables below)
source <(grep -v '^#' .env.local | grep -v '^$' | sed 's/^/export /') && bunx drizzle-kit push
bun run dev
```

## Project Structure

```
app/
  page.tsx              # Landing page (SSG) — hero, judge, services, blog, FAQ, contact
  layout.tsx            # Root layout (navbar, footer, chatbot, VLibras, accessibility)
  login/                # Admin login (Supabase Auth)
  admin/                # Admin panel (dashboard + 5 CRUD pages)
    actions.ts          # Server Actions with auth + Zod validation
  noticias/             # News list (ISR 1h)
  artigos/              # Articles list + [slug] detail (ISR 60s)
  api/
    contact/            # POST — contact form (rate limited)
    appointments/       # POST — booking (rate limited)
    demands/            # POST — demand registration (rate limited)
    chat/               # POST — OpenAI streaming SSE (rate limited, Zod validated)
    news/               # GET — news list + Cron scraper
    upload/             # POST — image upload (auth + magic byte validation)
components/
  landing/              # Landing sections (hero, judge, services, blog-preview, faq, etc.)
  admin/                # Admin sidebar
  chatbot.tsx           # Floating OpenAI chat widget
  navbar.tsx            # Responsive navigation with scroll-spy
  footer.tsx            # Institutional footer + Lex Intelligentia credit
  accessibility-bar.tsx # Font size, contrast, dark mode (persisted to localStorage)
lib/
  db/schema.ts          # Drizzle schema (5 tables, 7 indexes)
  db/index.ts           # Drizzle client (Supavisor pooler, max:1)
  auth.ts               # Supabase server auth (getUser only, no insecure getSession)
  email.ts              # Resend notifications with XSS-escaped HTML templates
  openai.ts             # OpenAI client + legal triage system prompt
  news-scraper.ts       # TJES RSS multi-strategy scraper
  rate-limit.ts         # Upstash Redis lazy singleton rate limiters
  validators.ts         # Zod v4 schemas (contact, appointment, demand)
  constants.ts          # Services, FAQs, judge info, contact info
```

## Environment Variables

See `.env.example`. Required:

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
| `UPSTASH_REDIS_REST_URL` | Rate limiting (disabled in dev without) |
| `SUPABASE_SERVICE_ROLE_KEY` | Required for image uploads |

## Testing

```bash
bunx playwright test
# 14 tests: smoke (pages, validation, auth) + integration (DB, OpenAI streaming)
```

## Security

- Server Actions protected by `requireAdmin()` + Zod input validation (UUID, status allow-lists)
- Image upload: auth required + MIME + magic byte + file size validation
- Chat: Zod schema (message 1-2000 chars, history max 20, role enum prevents prompt injection)
- CSP header restricts script/frame/connect/img sources
- HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy
- Email templates XSS-escaped via `esc()` helper
- Rate limiting: Upstash Redis with x-forwarded-for first IP extraction
- CRON_SECRET fails closed when env var undefined
- Login redirect validated against open redirect attacks

## Database

5 tables managed by Drizzle ORM: `contact_messages`, `appointments`, `demands`, `news`, `articles`. Admin users via Supabase Auth.

## Accessibility

Font size controls (A/A+/A++), high contrast mode, dark mode (persisted to localStorage), VLibras (LIBRAS translation), keyboard navigation. WCAG 2.2 AA compliant.

## License

Copyright 2026 2a Vara Civel de Cariacica. Developed by [Lex Intelligentia](https://lexintelligentia.com).
