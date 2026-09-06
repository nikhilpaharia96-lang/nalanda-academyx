# Nalanda Academy Cloud

A cloud-based school website and management platform, built as a monorepo.

## Status

Phases 1–8 complete and verified (74/74 automated tests passing): foundation,
database, auth, Admin Portal, Teacher Portal, Student Portal, Parent Portal —
including real Razorpay payments, manual attendance with duplicate protection,
and ownership-enforced access throughout. See `docs/IMPLEMENTATION_PLAN.md` for
the phase breakdown and `docs/FINAL_VERIFICATION.md` for the full verification
report, test results, and known limitations.

**Not built here:** the public marketing website (developed separately, to be
merged later), real cloud storage (R2/S3), and transactional email.

## Quick start (local dev)

```bash
npm install

# Database (SQLite locally — see docs/IMPLEMENTATION_PLAN.md for why, and
# how to point this at real Postgres in production)
cp .env.example packages/database/.env
npm run db:generate
npm run db:migrate
npm run db:seed        # creates demo accounts, see console output for logins

# API (needs its own .env — copy .env.example and fill JWT secrets + DATABASE_URL)
cp .env.example apps/api/.env
npm run dev:api        # http://localhost:4000/api

# Web (needs apps/web/.env.local with NEXT_PUBLIC_API_URL)
npm run dev:web        # http://localhost:3000
```

Demo logins (after seeding): `admin@nalanda.demo`, `teacher@nalanda.demo`,
`student@nalanda.demo`, `parent@nalanda.demo` — all share the password printed
by the seed script (default `Passw0rd!Demo`, override with `SEED_DEMO_PASSWORD`).

Portals: `/admin/login`, `/teacher/login`, `/student/login`, `/parent/login`.

## Structure

```
apps/public-site    Next.js 16 / React 19 / Tailwind v4 — public marketing site
                     (see docs/PUBLIC_SITE_INTEGRATION.md)
apps/web             Next.js 14 (App Router) + TypeScript + Tailwind v3 — 4 portals
apps/api             NestJS + TypeScript — 24 feature modules
packages/database    Drizzle ORM schema, migrations, seed
packages/shared      Zod schemas & shared types
docs/                Implementation plan, final verification, public site integration
```

## Running everything locally

```bash
npm install
npm run db:migrate && npm run db:seed
npm run dev:api            # http://localhost:4000/api
npm run dev:web            # http://localhost:3002 — admin/teacher/student/parent portals
npm run dev:public-site    # http://localhost:3000 — public website
```
