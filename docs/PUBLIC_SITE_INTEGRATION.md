# Public Website Integration

## What was done

The previously-separate public website (`nikhilpaharia96-lang/nalanda-academy`) was
added into this monorepo as its own workspace, **unmodified**:

```
apps/public-site/    Next.js 16.3.2 / React 19.2.8 / Tailwind v4 — copied byte-for-byte
                      (verified via `diff -rq` against the source clone before any
                      metadata changes)
```

The only file touched was `package.json`'s `name` field (`nalanda-academy` →
`@nalanda/public-site`, required for npm workspace uniqueness) and the addition of
`.env.example` documenting the vars the site's own README already specified. No
component, route, content file, or CSS was changed.

## Why a separate app instead of merging into `apps/web`

`apps/web` (the admin/teacher/student/parent portals) runs Next 14.2 / React 18.3 /
Tailwind v3. The public site runs Next 16.3 / React 19.2 / Tailwind v4 — a CSS-native
config system that isn't interchangeable with Tailwind v3's JS-config pipeline.
Forcing them into one Next.js process would have required rewriting the public site's
build system, which the integration brief explicitly ruled out. Keeping them as
separate workspace apps means:

- Zero risk to `apps/web`'s verified, 74/74-tests-passing state (confirmed after
  integration: `apps/web` still typechecks, lints, and builds cleanly with no changes).
- Zero modification to the public site's design system, animations, spacing, or image
  placeholder (`PlaceholderImage`) architecture.
- npm workspaces correctly isolate the two incompatible dependency trees — verified:
  root `node_modules/next` is 14.2.35 (used by `apps/web`), `apps/public-site/node_modules/next`
  is 16.3.2, no version bleed between them.

## Routing

No route collisions exist. Confirmed by booting the public site and checking:

| Path | Owner | Auth |
|---|---|---|
| `/`, `/about`, `/academics`, `/admission`, `/contact`, `/facilities`, `/faculty`, `/notices`, `/notices/[slug]`, `/results`, `/results/[year]`, `/events`, `/events/[slug]` | `apps/public-site` | None — public |
| `/admin/*` | `apps/web` | Admin/Super-Admin session |
| `/teacher/*` | `apps/web` | Teacher session |
| `/student/*` | `apps/web` | Student session |
| `/parent/*` | `apps/web` | Parent session (already existed, kept — confirmed intentional) |

`apps/public-site` was booted standalone and `/admin`, `/teacher`, `/student`,
`/parent` all 404 there — the auth-gated portals physically do not exist in that
app's route tree, so there is no way for the public site to accidentally expose or
gate a portal route.

## Local development

```bash
npm run dev:public-site   # http://localhost:3000  — public site (root/home domain)
npm run dev:web           # http://localhost:3002   — portal app (moved off 3000
                           #  to avoid colliding with the public site in local dev)
npm run dev:api           # http://localhost:4000/api
```

## Production topology (recommended, not yet configured)

Two separately-deployed Next.js apps behind one domain via path-based rewrites
(Vercel `rewrites`, or an nginx/Cloudflare rule):

```
nalanda.edu/*                          → apps/public-site
nalanda.edu/{admin,teacher,student,parent}/*  → apps/web
nalanda.edu/api/*  (or api.nalanda.edu) → apps/api
```

No code change is required to adopt this later — it's an infrastructure/proxy
configuration step.

## Backend integration

**Events & Notices — done.** The `EventsController`/`NoticesController` public GET
routes are unauthenticated (`OptionalJwtAuthGuard`, no `@Roles`) and return
published-only content to anonymous callers; `apps/web` now has an Upcoming
Events / Latest Notices admin section (create/edit/delete/publish, with the
new `endTime`, `registrationUrl`, `ctaText`, `externalLink`, `displayOrder`
fields — see `packages/database/migrations/0005_*`). `eventService.ts` and
`noticeService.ts` map the API's DTO shape onto `lib/types/index.ts`'s
`SchoolEvent`/`Notice` interfaces and fall back to an empty list (via
`apiGetSafe`) if the API is unreachable, rather than throwing. Setting
`NEXT_PUBLIC_API_URL` (see `.env.example`) switches these two sections from
mock content to the live, admin-managed data; leaving it unset keeps the
previous mock-content behavior for local/frontend-only work.

**Everything else — deliberately NOT done yet.** The public site's service
layer for `FacultyController`, `FacilitiesController`, and `ResultsController`
still branches on `USE_MOCK_DATA` and falls back to `lib/content/*.ts`
untouched. Gaps that must be closed before flipping those switches too
(intentionally left for a dedicated follow-up, out of scope for the
events/notices work above):

1. **Auth exemption**: `FacultyController`, `FacilitiesController`, and
   `ResultsController` currently require a logged-in session for *reads*
   (`@UseGuards(JwtAuthGuard, RolesGuard)` at the controller level). Public
   consumption needs unauthenticated GET access to published content,
   mirroring the pattern events/notices now use.
2. **Path naming**: the public site expects `POST /api/contact`; the API
   currently exposes this as `POST /api/messages`.
3. **Response-shape gaps**: several fields the public site's
   `lib/types/index.ts` expects don't exist on the current Drizzle
   schema/DTOs yet — e.g. `ResultYear`'s richer fields (`schoolAverage`,
   `performanceHighlights`, `toppers`, `subjectToppers`), `Facility.imageQuery`/
   `isPlaceholder`, `FacultyMember.photoAlt`/`isPlaceholder`. The admission form
   also sends `classApplyingFor` (free text) and `guardianName`/`phone`/`email`
   where the API expects `classId` (a foreign key) and
   `parentName`/`parentPhone`/`parentEmail`.

Recommended approach when this remaining work is picked up: the same thin
mapping-layer pattern used in `eventService.ts`/`noticeService.ts` — translate
the real API response into the exact interface shape already declared in
`lib/types/index.ts` — rather than changing either side's naming conventions
wholesale.
