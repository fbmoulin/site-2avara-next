# Security Hardening Sprint 2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 6 security findings from the legal-domain security review (3 HIGH, 3 MEDIUM)

**Architecture:** Input validation on Server Actions + fail-closed patterns on missing env vars + error message sanitization

**Tech Stack:** Zod v4, Next.js 16 Server Actions, Drizzle ORM

---

### Task 1: CRON_SECRET undefined bypass (Finding 6 — MEDIUM, trivial to exploit)

**Files:**
- Modify: `app/api/news/route.ts:7-13`

- [ ] **Step 1: Fix cron auth to fail closed**

```typescript
// In app/api/news/route.ts, replace:
const authHeader = request.headers.get("authorization")
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {

// With:
const cronSecret = process.env.CRON_SECRET
if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
```

- [ ] **Step 2: Run tests**

Run: `bunx playwright test e2e/smoke.spec.ts`
Expected: 14/14 PASS (cron rejection test still works)

- [ ] **Step 3: Commit**

```bash
git add app/api/news/route.ts
git commit -m "security: fail closed when CRON_SECRET not set"
```

---

### Task 2: Server Action input validation (Findings 1, 2 — HIGH)

**Files:**
- Modify: `app/admin/actions.ts`

- [ ] **Step 1: Add status validation to updateContactStatus**

```typescript
const CONTACT_STATUSES = ["pending", "answered", "archived"] as const
export async function updateContactStatus(id: string, status: string, answeredBy: string, notes: string) {
  await requireAdmin()
  if (!CONTACT_STATUSES.includes(status as typeof CONTACT_STATUSES[number])) {
    throw new Error("Status inválido")
  }
  // ... rest unchanged
```

- [ ] **Step 2: Add status validation to appointment actions**

```typescript
const APPOINTMENT_STATUSES = ["pre_reserved", "confirmed", "completed", "cancelled"] as const
```

Apply to `confirmAppointment` and `rejectAppointment`.

- [ ] **Step 3: Add status validation to resolveDemand**

```typescript
const DEMAND_STATUSES = ["pending", "in_analysis", "resolved", "archived"] as const
```

- [ ] **Step 4: Add Zod validation to updateArticle**

```typescript
import { z } from "zod/v4"

const updateArticleSchema = z.object({
  title: z.string().max(255).optional(),
  slug: z.string().max(255).regex(/^[a-z0-9-]+$/).optional(),
  excerpt: z.string().max(2000).optional(),
  content: z.string().optional(),
  author: z.string().max(255).optional(),
  category: z.string().max(100).optional(),
  imageUrl: z.string().url().max(500).optional(),
})
```

- [ ] **Step 5: Add UUID validation to all ID parameters**

```typescript
const uuidSchema = z.string().uuid()
// At top of each mutating action:
const validId = uuidSchema.parse(id)
```

- [ ] **Step 6: Run tests + commit**

```bash
bun run build && bunx playwright test
git add app/admin/actions.ts
git commit -m "security: validate Server Action inputs (status allow-lists, UUID format, Zod schemas)"
```

---

### Task 3: Upload error message sanitization (Finding 3 — HIGH)

**Files:**
- Modify: `app/api/upload/route.ts`

- [ ] **Step 1: Replace raw error messages with generic ones**

```typescript
// Replace all instances of:
return NextResponse.json({ error: `Erro no upload: ${error.message}` }, { status: 500 })
// With:
console.error("[upload] Error:", error)
return NextResponse.json({ error: "Erro interno no upload. Tente novamente." }, { status: 500 })
```

- [ ] **Step 2: Commit**

```bash
git add app/api/upload/route.ts
git commit -m "security: sanitize upload error messages, log details server-side"
```

---

### Task 4: Rate limiting fail-closed in production (Finding 4 — MEDIUM)

**Files:**
- Modify: `lib/rate-limit.ts:35-39`

- [ ] **Step 1: Block requests when rate limiting unavailable in production**

```typescript
if (!process.env.UPSTASH_REDIS_REST_URL) {
  if (process.env.NODE_ENV === "production") {
    console.error("[rate-limit] CRITICAL: rate limiting disabled in production")
    // In production, still allow requests but log loudly
    // Blocking would break the site if Redis env var is accidentally unset
  }
  return { success: true, remaining: 999 }
}
```

Note: Decided to warn-not-block in production to avoid site outage on misconfiguration. The warn was already added in the previous sprint.

- [ ] **Step 2: No change needed** — current behavior (warn + allow) is the correct tradeoff for a court website where availability > rate limiting.

---

### Task 5: Chat endpoint Zod validation (Finding 5 — MEDIUM)

**Files:**
- Modify: `app/api/chat/route.ts`

- [ ] **Step 1: Replace manual validation with Zod schema**

```typescript
import { z } from "zod/v4"

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(2000),
  })).max(20).default([]),
})

export async function POST(request: NextRequest) {
  // ... rate limit ...
  let body
  try { body = await request.json() } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 })
  }
  const result = chatSchema.safeParse(body)
  if (!result.success) {
    return Response.json({ error: "Dados inválidos." }, { status: 400 })
  }
  const { message, history } = result.data
  // Remove manual validation, use validated data directly
```

- [ ] **Step 2: Run tests + commit**

```bash
bun run build && bunx playwright test
git add app/api/chat/route.ts
git commit -m "security: Zod validation on chat endpoint (message + history schema)"
```

---

### Task 6: CSP header (Finding 8 — MEDIUM)

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add Content-Security-Policy header**

```typescript
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
```

- [ ] **Step 2: Test in browser — verify no CSP violations**

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "security: add Content-Security-Policy header"
```

---

## Verification

1. `bun run build` — 0 errors
2. `bunx playwright test` — 14/14 pass
3. Deploy to Vercel — verify CSP header in response
4. Test cron with `curl -H "Authorization: Bearer undefined" https://2avaraciveldecariacica.org/api/news?cron=true` — should return 401
