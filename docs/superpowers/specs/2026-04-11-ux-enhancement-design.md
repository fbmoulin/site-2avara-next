# UX Enhancement Design — site-2avara-next

**Date:** 2026-04-11
**Status:** Approved
**Scope:** Modern institutional UX upgrade — animations, glassmorphism, icon enrichment, route transitions

## Context

site-2avara-next is a judicial portal for the 2a Vara Civel de Cariacica, deployed on Vercel with Next.js 16, Tailwind v4, shadcn/ui, and Lucide icons. The site is functional and accessible but visually static — minimal animations, hard route cuts, no scroll-triggered reveals. This spec modernizes the UX feel without changing content, accessibility features, admin section, or backend.

## Design Decisions

| Question | Choice | Rationale |
|----------|--------|-----------|
| Scope | Modern institutional | Professional gravitas + modern motion. Not startup-bold, not just polish. |
| Animation library | Framer Motion (~33KB gz) | Declarative React API, scroll-triggered `whileInView`, `AnimatePresence`, spring physics. Battle-tested with Next.js. |
| Animation style | Mixed signatures | Each section type gets its own entrance: hero (scale+blur), sections (fade-rise), cards (stagger), FAQ (spring). Avoids repetition. |
| Hero treatment | Animate existing content | Keep approved copy/CTAs. Add scale(1.05)+blur(10px) entrance on load. |
| Navbar | Frosted glass | `backdrop-blur-xl` + `bg-slate-900/75` (Tailwind semantic) + amber gradient bottom border. Replaces solid slate-900. |
| Chatbot | Pulse ring + smooth panel | Subtle idle beacon (2s pulse ring). Spring-physics panel open. No redesign. |
| Animated stats | Skip | No vanity counters. Content speaks for itself. |
| Page transitions | Fade crossfade | 0.3s opacity transition on route change via `template.tsx` + AnimatePresence (layout.tsx persists across navigations — template.tsx re-mounts per route). |
| Icon enrichment | Section headers + service cards | Animated icons on section titles (entrance) and service card icons (hover micro-animations). |

## New Dependency

```
framer-motion (latest)
```

Only new package. Install via `bun add framer-motion`.

## Architecture

### New Components

#### `components/motion/scroll-reveal.tsx`

Reusable wrapper for scroll-triggered entrance animations. Wraps any children with Framer Motion `motion.div` + `whileInView`.

```typescript
// Variants:
// - "fade-up": opacity 0→1, y 20→0 (default, for sections)
// - "fade-left": opacity 0→1, x -40→0
// - "fade-right": opacity 0→1, x 40→0
// - "scale-blur": opacity 0→1, scale 1.05→1, blur 10→0 (hero only)

// Props:
// - variant: animation variant name
// - delay: additional delay in seconds
// - duration: override default (0.6s)
// - stagger: if true, staggers children (0.1s intervals)
// - once: trigger only once (default true)
// - className: passthrough

// Implementation: "use client" component using motion.div with whileInView
// viewport={{ once, amount: 0.2 }}
```

#### `components/motion/stagger-container.tsx`

Container that staggers its children's entrance animations.

```typescript
// Uses motion.div with variants:
// - container: { visible: { transition: { staggerChildren: 0.1 } } }
// - item: { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }

// Props:
// - staggerDelay: override 0.1s default
// - direction: "left" | "right" | "up" (default "up")
// - className: passthrough
```

#### `components/motion/page-transition.tsx`

Route transition wrapper using AnimatePresence. **Important:** Must be used in `app/template.tsx` (not `layout.tsx`), because App Router layouts persist across navigations and never unmount children. `template.tsx` re-mounts on every route change, giving AnimatePresence the mount/unmount cycle it needs.

```typescript
// Wraps children with:
// - AnimatePresence mode="wait"
// - motion.div with key={pathname}
// - initial={{ opacity: 0 }}, animate={{ opacity: 1 }}, exit={{ opacity: 0 }}
// - transition={{ duration: 0.3, ease: "easeInOut" }}

// Uses usePathname() from next/navigation for key
// "use client" component
```

### Edited Components

#### `components/navbar.tsx` — Frosted Glass

Replace solid `bg-slate-900` with:
- `bg-slate-900/75 backdrop-blur-xl` (Tailwind semantic tokens — adapts to dark mode)
- Bottom border: `border-b border-transparent` with CSS gradient border using `::after` pseudo-element
  - Gradient: `linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)`
- Note: use only Tailwind classes and semantic tokens, no hardcoded rgba() values in JSX
- Active link indicator: amber underline with `transition-all duration-300`
- Mobile menu: same glass treatment

#### `components/landing/hero.tsx` — Scale+Blur Entrance

Wrap hero content in `ScrollReveal variant="scale-blur"`:
- Initial: `scale: 1.05, filter: blur(10px), opacity: 0`
- Animate: `scale: 1, filter: blur(0px), opacity: 1`
- Duration: 0.8s, ease-out
- CTA buttons: slight delay (0.4s) for sequential reveal
- Background dot pattern: no change

#### `components/landing/judge.tsx` — Scroll Reveal + Stagger

- Wrap entire section in `ScrollReveal variant="fade-up"`
- Judge profile image: separate `ScrollReveal` with slight scale entrance
- Mission/vision cards: `StaggerContainer direction="up"`
- Team grid (4 members): `StaggerContainer direction="left"` with 0.1s intervals
- Section header: add `Users` icon with entrance animation

#### `components/landing/services.tsx` — Stagger + Icon Hover

- Wrap section in `ScrollReveal variant="fade-up"`
- Service cards: `StaggerContainer direction="up"`
- Icon hover micro-animations (per-icon):
  - Search → gentle pulse (scale 1→1.15→1, 0.4s)
  - Video → subtle rotate (0→10°→0, 0.3s)
  - Calendar → bounce (y 0→-4→0, 0.3s)
  - FileText → flip (rotateY 0→180→360, 0.5s)
  - MessageSquare → wiggle (rotate -5°→5°→0, 0.3s)
- Implement via `whileHover` on motion-wrapped icon containers
- Section header: add `Scale` icon with entrance animation

#### `components/landing/blog-preview.tsx` — Stagger Cards

- Wrap section in `ScrollReveal variant="fade-up"`
- Article cards: `StaggerContainer direction="left"` (3 cards stagger in)
- Card hover: keep existing `hover:shadow-lg`, add subtle `hover:y: -4` lift via motion
- Section header: add `BookOpen` icon with entrance animation

#### `components/landing/news-preview.tsx` — Stagger Cards

- Same pattern as blog-preview
- 6 news cards: `StaggerContainer direction="up"` in grid
- Section header: add `Newspaper` icon with entrance animation

#### `components/landing/faq.tsx` — Spring Accordion

- Replace CSS `max-h` + `transition-all` with Framer Motion `AnimatePresence`
- Expand: `motion.div` with `initial={{ height: 0, opacity: 0 }}`, `animate={{ height: "auto", opacity: 1 }}`
- Transition: spring physics `{ type: "spring", stiffness: 300, damping: 30 }`
- Chevron rotation: use `motion.div` with `animate={{ rotate: isExpanded ? 180 : 0 }}`
- Wrap section in `ScrollReveal variant="fade-up"`
- Section header: add `HelpCircle` icon with entrance animation

#### `components/landing/contact-form.tsx` — Scroll Reveal

- Wrap section in `ScrollReveal variant="fade-up"`
- Two-column layout: left column `ScrollReveal delay={0.1}`, right column `ScrollReveal delay={0.2}`
- Form success state: add scale-in animation for the CheckCircle
- Section header: add `Mail` icon with entrance animation

#### `components/chatbot.tsx` — Pulse Ring + Spring Panel

- Floating button: add CSS `@keyframes pulse-ring` animation
  - Ring expands from button boundary, amber-500/40% opacity, fades to transparent
  - 2s infinite cycle
- Panel open: wrap in `AnimatePresence`
  - Enter: `motion.div` with `initial={{ opacity: 0, y: 20, scale: 0.95 }}`
  - Animate: `{ opacity: 1, y: 0, scale: 1 }` with spring (stiffness 300, damping 30)
  - Exit: `{ opacity: 0, y: 20, scale: 0.95 }` with ease-out 0.2s
- Chat messages: each message fades in from bottom (`initial={{ opacity: 0, y: 10 }}`)

#### `app/template.tsx` — Page Transition Wrapper (NEW FILE)

- Create `app/template.tsx` that wraps `{children}` with `PageTransition` component
- `template.tsx` re-mounts on every navigation (unlike `layout.tsx` which persists)
- This gives AnimatePresence the mount/unmount cycle it needs for exit animations
- `layout.tsx` stays unchanged — Navbar, Footer, Chatbot remain outside transitions
- Note: `template.tsx` runs after `layout.tsx` in the rendering chain

#### Server Component Boundary Note

`hero.tsx`, `judge.tsx`, `blog-preview.tsx`, and `news-preview.tsx` are currently Server Components. Wrapping them in `ScrollReveal` (a `"use client"` component) converts their subtree to client-rendered. This is acceptable because:
1. The landing page is mostly static content (no sensitive server-only logic)
2. The content is already statically generated at build time
3. The JS bundle increase is modest (~33KB for framer-motion + component wrappers)
4. The trade-off is worth it for the UX improvement on the primary public-facing page

## Accessibility Considerations

- All animations respect `prefers-reduced-motion: reduce`
  - `ScrollReveal` and `StaggerContainer` call `useReducedMotion()` at the top level
  - When reduced motion is preferred: `initial` and `animate` props are set to the same value (final state), effectively rendering content immediately with no motion
  - This is a single check in the two wrapper components — individual landing sections do not need to handle it
  - Framer Motion's `useReducedMotion()` handles the media query listener and SSR hydration
- No content is hidden behind animations — everything renders, motion is progressive enhancement
- Focus management unaffected — tab order, skip-to-content, ARIA attributes unchanged
- Chatbot pulse ring uses CSS animation (not JS) — minimal battery/CPU impact

## Performance Considerations

- Framer Motion: ~33KB gzipped, tree-shakeable (only import used features)
- All scroll animations use `viewport={{ once: true }}` — trigger once, no re-computation
- `will-change: transform` applied automatically by Framer Motion for GPU compositing
- No layout thrashing — animations use transform/opacity only (compositor thread)
- Backdrop-blur on navbar: GPU-accelerated, well-supported (Chrome 76+, Firefox 103+, Safari 9+)

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `package.json` | EDIT | Add framer-motion dependency |
| `components/motion/scroll-reveal.tsx` | NEW | Reusable scroll-triggered animation wrapper |
| `components/motion/stagger-container.tsx` | NEW | Staggered children animation container |
| `components/motion/page-transition.tsx` | NEW | Route crossfade wrapper |
| `components/navbar.tsx` | EDIT | Frosted glass + amber border |
| `components/landing/hero.tsx` | EDIT | Scale+blur entrance |
| `components/landing/judge.tsx` | EDIT | Scroll reveal + stagger team |
| `components/landing/services.tsx` | EDIT | Stagger cards + icon hover animations |
| `components/landing/blog-preview.tsx` | EDIT | Stagger card reveal |
| `components/landing/news-preview.tsx` | EDIT | Stagger card reveal |
| `components/landing/faq.tsx` | EDIT | Spring-physics accordion |
| `components/landing/contact-form.tsx` | EDIT | Scroll reveal wrapper |
| `components/chatbot.tsx` | EDIT | Pulse ring + spring panel |
| `app/template.tsx` | NEW | PageTransition wrapper (re-mounts per route) |

**Total: 4 new files, 10 edited files, 1 new dependency**

## Out of Scope

- Admin section (no UX changes)
- Footer (stays as-is)
- Database/API changes
- Content/copy changes
- Color system changes
- Dark mode changes (animations work in both modes)
- Accessibility bar (stays as-is)
- Mobile-specific animation variants (use same animations, they work on mobile)
