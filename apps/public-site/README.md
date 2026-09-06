# Nalanda Academy — Public Website

A standalone, production-ready public website for Nalanda Academy, built to be merged
later into **Nalanda Academy Cloud** (Next.js frontend + NestJS API + PostgreSQL +
Drizzle ORM + Razorpay + cloud storage).

This project is **only the public-facing site**. It does not contain an admin,
teacher, student, or parent portal, and it does not contain a backend or database —
those are being built separately.

---

## 1. Tech Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4** — design tokens defined as CSS variables in `app/globals.css`
- **Framer Motion** — reusable animation primitives in `components/motion/Reveal.tsx`
- **Lucide React** — icon set
- No database, ORM, or backend of any kind is included in this repo.

## 2. Installation

```bash
npm install
```

## 3. Development

```bash
npm run dev
```

Visit `http://localhost:3000`.

## 4. Environment Variables

Copy `.env.example` to `.env.local` and fill in what's known:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the NestJS API. **Leave empty** to use local mock data (default for this standalone build). |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL, used in metadata/sitemap/JSON-LD. |
| `NEXT_PUBLIC_GOOGLE_MAPS_URL` | Optional embed URL for the Contact page map. |
| `NEXT_PUBLIC_SOCIAL_INSTAGRAM` / `_FACEBOOK` / `_YOUTUBE` | Optional social links, only rendered when set. |

## 5. Production Build

```bash
npm run build
npm run start
```

Verified: `tsc --noEmit`, `next lint`, and `next build` all pass cleanly. Every route
(including all dynamic `results/[year]`, `events/[slug]`, `notices/[slug]` pages)
was statically generated and smoke-tested (HTTP 200, including a working custom 404).

## 6. Content Replacement

**No real school data is invented anywhere in this codebase.** Every place that
would normally hold official information — school history, principal's name,
teacher names, addresses, phone/email, facilities, results — instead contains
copy clearly marked `[Official information to be added]` or a placeholder image
tagged as such.

All of this content lives in `lib/content/*.ts`. To go live:

1. Open the relevant file in `lib/content/` (e.g. `about.ts`, `admission.ts`, `site.ts`).
2. Replace placeholder strings with real copy.
3. Replace `<PlaceholderImage>` usages with real `next/image` components once
   official photography is available (each usage is isolated and easy to find —
   search for `PlaceholderImage`).
4. Update `components/brand/Logo.tsx` with a real logo asset when available.

## 7. API Integration (connecting Nalanda Academy Cloud)

The UI never talks to mock data directly — it always goes through the service
layer in `lib/services/*.ts` (`resultService`, `eventService`, `noticeService`,
`facultyService`, `facilityService`, `admissionService`, `contactService`).

Each service function currently branches on `USE_MOCK_DATA` (true when
`NEXT_PUBLIC_API_URL` is empty). To connect the real backend:

1. Deploy the NestJS API and set `NEXT_PUBLIC_API_URL` in the environment.
2. That's it — `USE_MOCK_DATA` becomes `false` automatically and every service
   function switches to calling the real endpoint via `apiGet`/`apiPost` in
   `lib/services/apiClient.ts`. No component code needs to change.

Expected backend contract (not implemented in this repo):

```
GET  /api/results
GET  /api/results/:year
GET  /api/events
GET  /api/events/:slug
GET  /api/notices
GET  /api/notices/:slug
GET  /api/faculty
GET  /api/facilities
POST /api/admissions
POST /api/contact
```

Response shapes should match the TypeScript interfaces in `lib/types/index.ts`
and the payload/response types exported from `admissionService.ts` and
`contactService.ts`.

## 8. Project Structure

```
app/                  Route segments (App Router), one folder per public page
components/
  layout/              Navbar, MobileMenu, Footer
  hero/                Hero (homepage), PageHero (interior pages)
  sections/            Homepage + page-specific section components
  cards/               EventCard, NoticeCard, FacultyCard, FacilityCard
  ui/                  Button, Badge, Container, SectionHeading, Breadcrumbs, etc.
  brand/               Logo.tsx (isolated, swap-in-place)
  motion/              Reveal.tsx — FadeUp / StaggerGroup / fade & scale variants
lib/
  content/             All copy + mock data, clearly marked where placeholder
  services/            API-ready service layer (mock now, real API later)
  types/                Shared TypeScript interfaces
  utils.ts             cn() class merge helper, formatDate()
```

## 9. Design System

Tokens are defined once in `app/globals.css` (`:root` custom properties, mapped
into Tailwind via `@theme inline`) and consumed everywhere as Tailwind utilities
(`bg-navy-950`, `text-gold-500`, `font-display`, `font-data`, etc.). Palette:
deep navy, academic blue, warm gold, paper/off-white, with a signature "chapter
mark" (gold rule + numbered eyebrow) used as the site's wayfinding device,
echoing an academic prospectus rather than a generic template.

Typography uses a display/body/data three-family system (Plus Jakarta Sans /
Inter / IBM Plex Mono by design intent). Because this sandbox has no internet
access to Google Fonts at build time, `globals.css` currently falls back to a
close system-font stack. **To finish the type system**, swap the `--font-display`
/ `--font-body` / `--font-data` values in `app/globals.css` for `next/font/google`
imports of Plus Jakarta Sans, Inter, and IBM Plex Mono — a one-file, ~10-line
change, documented inline in `globals.css`.

## 10. Accessibility & Performance Notes

- Skip-to-content link, visible focus rings (`focus-ring` utility), semantic
  headings, labelled form fields, `aria-current`/`aria-selected` on nav and tabs.
- `prefers-reduced-motion` is respected globally.
- Server Components by default; `"use client"` only on interactive pieces
  (Navbar, MobileMenu, forms, filters/search, animated reveals).
- All dynamic routes are statically generated at build time via
  `generateStaticParams`.

## 11. Known Limitations

- Fonts fall back to system stack pending internet access for `next/font/google`
  (see Section 9).
- All content is placeholder/demo data — see Section 6.
- No backend, database, or payment integration is included by design.
- Admin/teacher/student/parent portal routes are intentionally not built here.
- Map on the Contact page renders a placeholder until
  `NEXT_PUBLIC_GOOGLE_MAPS_URL` is configured.
