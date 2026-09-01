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
 # Nalanda Academy Cloud — Admin Portal Updates

This zip contains only the files that were added or changed across two increments:
1. Rich Admin Dashboard + reusable admin sidebar
2. Add Student / Add Teacher (with login account creation, secure credentials, reset password)

## How to upload to GitHub

The folder structure inside this zip **exactly matches your repo's folder structure**.
For each file below, go to that same path in your GitHub repo and either:
- **Replace** the file (if it already exists there) — open it, click the pencil/edit icon, select all, delete, paste the new content, commit.
- **Add as new** (if it doesn't exist yet) — use "Add file → Create new file" or "Add file → Upload files" and keep the exact same path.

If you have GitHub Desktop or `git` installed locally, the easiest way is:
1. Clone your repo locally (if not already).
2. Extract this zip **directly into your repo's root folder**, overwriting when prompted.
3. Run `git status` to see the same file list as below.
4. Commit and push.

## Files included

### Backend (apps/api)
- apps/api/src/auth/auth.service.ts
- apps/api/src/common/db-errors.ts *(new)*
- apps/api/src/dashboard/dashboard.controller.ts
- apps/api/src/dashboard/dashboard.module.ts
- apps/api/src/dashboard/dashboard.service.ts *(new)*
- apps/api/src/students/students.controller.ts
- apps/api/src/students/students.service.ts
- apps/api/src/teachers/teachers.controller.ts
- apps/api/src/teachers/teachers.service.ts

### Database (packages/database)
- packages/database/schema.ts
- packages/database/schema.pg.ts
- packages/database/migrations/0001_tiresome_gressill.sql *(new — SQLite migration)*
- packages/database/migrations/meta/0001_snapshot.json *(new)*
- packages/database/migrations/meta/_journal.json
- packages/database/migrations-postgres/0001_wonderful_reaper.sql *(new — Postgres migration)*
- packages/database/migrations-postgres/meta/0001_snapshot.json *(new)*
- packages/database/migrations-postgres/meta/_journal.json

### Shared (packages/shared)
- packages/shared/index.ts
- packages/shared/schemas/student.ts
- packages/shared/schemas/teacher.ts *(new)*

### Frontend (apps/web)
- apps/web/src/lib/admin-nav.tsx *(new)*
- apps/web/src/lib/api-client.ts
- apps/web/src/components/admin-shell.tsx
- apps/web/src/app/admin/dashboard/page.tsx
- apps/web/src/app/admin/students/page.tsx
- apps/web/src/app/admin/students/new/page.tsx *(new)*
- apps/web/src/app/admin/teachers/page.tsx *(new)*
- apps/web/src/app/admin/teachers/new/page.tsx *(new)*
- apps/web/src/app/admin/[...comingSoon]/page.tsx *(new — folder name has square brackets, this is intentional Next.js syntax)*

## After uploading — required steps

1. **Run the database migration** so the new columns actually exist:
   ```bash
   npm run db:migrate            # for local SQLite dev
   npm run db:migrate:postgres   # for your Render Postgres database
   ```
2. **Rebuild the packages in order** (database → shared → api → web) before starting the app, since `packages/database` and `packages/shared` are compiled, not run directly from source:
   ```bash
   npm run build --workspace=packages/database
   npm run build --workspace=packages/shared
   npm run build:api
   npm run build:web
   ```
3. Restart your API and web servers.

Both migrations are purely additive (`ALTER TABLE ADD COLUMN`) — no existing data is touched or dropped.
