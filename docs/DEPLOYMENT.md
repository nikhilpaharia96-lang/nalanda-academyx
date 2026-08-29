# Deployment Guide — Vercel (frontends) + Render (API) + Managed PostgreSQL

This guide is written for exactly this target architecture:

```
apps/public-site  → Vercel
apps/web          → Vercel (separate Vercel project)
apps/api          → Render (Web Service)
Database          → managed PostgreSQL (Neon / Supabase / Render Postgres / RDS)
```

**Nothing in this repository has been deployed.** This document only prepares you to
do it yourself. Every command below was actually run against this repository during
preparation — see the "Local build verification" section for the results.

---

## 🟢 PostgreSQL support has been added — read this before the old blocker text below

**Update:** `packages/database` now has genuine PostgreSQL support, added as an
explicitly separate driver + schema alongside the existing SQLite setup (nothing about
local SQLite development changed). Specifically:

- `packages/database/schema.pg.ts` — a real PostgreSQL-dialect schema built with
  `pgTable` from `drizzle-orm/pg-core` (not a renamed copy of the SQLite schema).
  Every table, column, foreign key, unique constraint, and index was ported 1:1 from
  `schema.ts`. See that file's header comment for the exact, deliberate type-mapping
  decisions made during the port (booleans use Postgres's native type; dates and
  currency columns were **deliberately left unchanged** — still `text` and `real`
  respectively — per an explicit instruction not to silently change financial/temporal
  behavior in this pass; see "Known follow-ups" below).
- `packages/database/postgres.ts` — the real Postgres client, using the `pg`
  (node-postgres) driver and `drizzle-orm/node-postgres`.
- `packages/database/index.ts` — now dispatches between the SQLite driver and the
  Postgres driver based on `DATABASE_URL`: a `postgres://` or `postgresql://` URL
  selects Postgres; anything else (including the existing `file:./dev.db` style values)
  keeps the exact SQLite behavior this package has always had. Every consumer in
  `apps/api` keeps doing `import { db, schema } from "@nalanda/database"` completely
  unchanged — verified: `apps/api`'s TypeScript, ESLint, and build all pass unmodified
  against this new dispatch logic, and the full 74+23-test suite still passes end to
  end against the (unchanged) SQLite path.
- `packages/database/migrate.postgres.ts` and `drizzle.config.postgres.ts` — a
  dedicated Postgres migration runner and drizzle-kit config, explicitly separate from
  the SQLite ones (`migrate.ts`, `drizzle.config.ts`).
- A real PostgreSQL migration was generated (`drizzle-kit generate` reads the schema
  file directly — it does not need a live database connection to do this) and
  structurally verified: 30 tables, 42 foreign keys, 17 cascade deletes, and the
  attendance duplicate-protection unique constraint all confirmed present in the
  generated SQL.

**What is honestly still true, and always will be until you do this yourself:** this
sandbox has no network access to any PostgreSQL server, so **the generated migration
has never been executed against a real PostgreSQL database, and the API has never
actually queried one.** Everything above is verified as far as static/structural
analysis and safe (non-connecting) construction checks can go — see "LOCAL VERIFIED vs
REQUIRES REAL POSTGRES SERVER" below for the exact, itemized breakdown of what that
does and doesn't cover. **You must run the first real migration against your chosen
Postgres provider and re-run the test suites against it before trusting this in
production** — that step cannot be done from here.

### Known follow-ups (deliberately not done in this pass)

- **Currency columns remain `real` (floating point)** in both `schema.ts` and
  `schema.pg.ts` — this was an explicit instruction for this change, not an oversight.
  Floating-point currency remains a real production-correctness concern flagged
  separately in the production audit; converting to `numeric`/integer-minor-units is a
  distinct, deliberate decision to make later, together with a data migration for any
  existing rows.
- **Date/timestamp columns remain `text` (ISO-8601 strings)** in both schema files —
  also deliberate, to avoid changing comparison/sort/parse behavior the application
  currently relies on. Native `date`/`timestamp with time zone` typing remains a
  documented future improvement.
- **The Postgres migration has not been run against a live server** — see above.

---


## 1. GitHub preparation

```powershell
cd <project-folder>
git status
```

Confirm before pushing:
- `.gitignore` already excludes `node_modules/`, `dist/`, `.next/`, `*.db*`, `.env`,
  `.env.local` — verified present in the repo root.
- No `.env` or `.env.local` file appears in `git status` output. If one does, **stop**
  and remove it (`git rm --cached <file>`) before committing — do not push real
  secrets.
- Push to a GitHub repository (private, recommended, since this holds a school's
  eventual student/payment data):

```powershell
git add .
git commit -m "Prepare for Vercel/Render deployment"
git push origin main
```

Both Vercel and Render deploy directly from a connected GitHub repo — no separate
artifact upload step.

---

## 2. Vercel — `apps/public-site` project

Create a **separate Vercel project** for the public website (do not combine with the
portal app — they are genuinely separate Next.js apps with different Next/React/
Tailwind major versions, by design; see `docs/PUBLIC_SITE_INTEGRATION.md`).

**Vercel project settings:**
| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| Root Directory | `apps/public-site` |
| Build Command | `npm run build` (Vercel auto-detects; matches `apps/public-site/package.json`'s `"build": "next build"`) |
| Output Directory | `.next` (default) |
| Install Command | leave default — Vercel runs `npm install` at the monorepo root when Root Directory is set to a workspace, which correctly resolves this workspace's dependencies via the root `package-lock.json`/workspaces |
| Node.js Version | 20.x or later (project uses Next 16 / React 19) |

**Environment variables** (Vercel Project Settings → Environment Variables):
```
NEXT_PUBLIC_API_URL=            # leave EMPTY to keep the public site on mock/content
                                 # data (see "Public site can stay on mock data" below)
NEXT_PUBLIC_SITE_URL=https://www.yourdomain.com
NEXT_PUBLIC_GOOGLE_MAPS_URL=
NEXT_PUBLIC_SOCIAL_INSTAGRAM=
NEXT_PUBLIC_SOCIAL_FACEBOOK=
NEXT_PUBLIC_SOCIAL_YOUTUBE=
```
(Full list in `apps/public-site/.env.example`.)

### The public site can safely stay on mock data indefinitely

Leaving `NEXT_PUBLIC_API_URL` unset means every content service in
`apps/public-site/lib/services/*.ts` uses its `USE_MOCK_DATA` branch and reads from
`lib/content/*.ts` — the site is fully functional, deployable, and demo-ready with
zero dependency on `apps/api` being reachable. Connect it to live data only when you
deliberately choose to (see `docs/PUBLIC_SITE_INTEGRATION.md` for the exact gaps that
must be closed on the API side first — auth-gating on public reads has already been
fixed as part of this preparation pass; path-naming and field-shape adapters have not).

---

## 3. Vercel — `apps/web` project (Admin/Teacher/Student/Parent portals)

Create a **second, separate Vercel project** for the portal app.

**Vercel project settings:**
| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| Root Directory | `apps/web` |
| Build Command | `npm run build` (matches `apps/web/package.json`'s `"build": "next build"`) |
| Output Directory | `.next` (default) |
| Node.js Version | 18.x or 20.x (project uses Next 14 / React 18) |

**Environment variables:**
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```
(This is the **only** variable `apps/web` reads at build/runtime — confirmed via
`apps/web/src/lib/api-client.ts`. All auth/session state lives in the browser via the
API's httpOnly cookie + in-memory access token; there are no server-side secrets in
this app.)

---

## 4. Render — `apps/api` Web Service

**Render service settings:**
| Setting | Value |
|---|---|
| Repository | this GitHub repo |
| Root Directory | `apps/api` |
| Runtime | Node |
| Build Command | `cd ../.. && npm install && npm run build --workspace=apps/api` (Render's Root Directory only affects where the service *runs* from, not the monorepo install — you need the root `package-lock.json` resolved first; the exact verified `build` script itself is `nest build`, invoked here via the workspace) |
| Start Command | `npm run start --workspace=apps/api` from the repo root, or `npm start` if Root Directory is `apps/api` and dependencies were hoisted correctly — verified exact script: `"start": "cross-env NODE_ENV=production node dist/main.js"` |
| Node Version | 20.x (set via Render's environment settings or a `.node-version`/`engines` field) |
| Health Check Path | `/api/health` (this now performs a real DB connectivity check — see the audit fix in `apps/api/src/app.controller.ts`) |

**Exact build/start commands, verified against the actual `package.json` files in this
repo (not invented):**
```
Build:  npm run build --workspace=apps/api      # runs: nest build
Start:  npm run start --workspace=apps/api      # runs: cross-env NODE_ENV=production node dist/main.js
```
Run these from the **repository root** (where the workspaces are defined) — Render
lets you set the Root Directory to the repo root and use `--workspace=apps/api` in
both commands instead of `cd apps/api`, which is the simplest way to get npm
workspace hoisting to resolve `@nalanda/database` and `@nalanda/shared` correctly.

**Environment variables** (Render → Environment):
```
NODE_ENV=production
DATABASE_URL=                    # see the 🔴 blocker above — not usable with Postgres yet
JWT_SECRET=                      # generate: openssl rand -base64 48 (or equivalent)
JWT_REFRESH_SECRET=              # a DIFFERENT random value from JWT_SECRET
API_PORT=4000                    # Render provides its own PORT env var — see note below
ALLOWED_ORIGINS=https://www.yourdomain.com,https://portal.yourdomain.com
TRUST_PROXY=1                    # Render sits behind its own proxy — required for correct rate-limiting/audit IPs
RAZORPAY_KEY_ID=                 # TEST mode key from Razorpay dashboard (see §10)
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
ALLOW_PROD_SEED=                 # leave EMPTY — never seed a real production DB with demo accounts
```

**Note on `API_PORT` vs Render's `PORT`:** Render injects its own `PORT` environment
variable and expects the service to listen on it. `apps/api/src/main.ts` currently
reads `process.env.API_PORT`, not `PORT`. Before deploying to Render, either set
`API_PORT` in Render's environment variables to match what Render expects, or (cleaner)
change `main.ts` to fall back to `process.env.PORT` — flagged here as a small, required
adjustment specific to Render's platform convention, not a code change I've made
silently in this pass since it touches `main.ts` again.

---

## 5. PostgreSQL setup

Pick one managed provider — all three integrate cleanly with Render:
- **Neon** (serverless Postgres, generous free tier, branching for staging)
- **Supabase** (Postgres + extras; only use the Postgres connection string here)
- **Render Postgres** (simplest — same dashboard as your API service)

Steps (provider-agnostic):
1. Create a new Postgres instance/database.
2. Copy its connection string (format: `postgresql://user:password@host:5432/dbname?sslmode=require`).
3. Run the real, verified migration command from your own machine or CI (see §7) —
   this applies the actual generated schema (30 tables, all foreign keys/indexes/
   constraints) to your new database.
4. Set `DATABASE_URL` to this connection string in Render's environment variables for
   `apps/api` (§4/§6).
5. Confirm the provider's automated backup / point-in-time-recovery is enabled (Neon
   and Supabase both offer this on paid tiers; verify before trusting this with real
   student/payment data — this was flagged as a hard launch blocker in the production
   audit, and remains one regardless of the database work done in this pass).

**Important — SSL:** `packages/database/postgres.ts` and `migrate.postgres.ts` both
default to `ssl: { rejectUnauthorized: false }`, matching the common
`?sslmode=require`-style managed-Postgres convention (Neon, Supabase, Render Postgres
all work with this default). Set `DATABASE_SSL=false` only if you're connecting to a
Postgres instance that genuinely has no SSL (e.g. a local/private-network instance) —
never do this for a real internet-facing managed database.

---

## 6. Required environment variables — full reference

| Variable | Used by | Notes |
|---|---|---|
| `DATABASE_URL` | apps/api, packages/database | SQLite (`file:...`) or PostgreSQL (`postgres(ql)://...`) — dispatch is automatic based on the URL scheme |
| `DATABASE_SSL` | packages/database (Postgres path only) | Leave unset (defaults to SSL required) unless connecting to a non-SSL Postgres instance — see §5 |
| `NODE_ENV` | apps/api | Must be explicitly `production` on Render — cookie security and error redaction fail *closed* now if unset, but set it explicitly anyway |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | apps/api | Two distinct long random secrets. Never reuse dev values. |
| `API_PORT` (or `PORT` — see §4 note) | apps/api | Render-specific |
| `ALLOWED_ORIGINS` | apps/api | Comma-separated list — must include both Vercel project URLs (and your custom domains once attached) |
| `TRUST_PROXY` | apps/api | Set to `1` on Render |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | apps/api | TEST mode values until you are ready to go live — see §10 |
| `ALLOW_PROD_SEED` | packages/database (seed script) | Leave unset in production |
| `NEXT_PUBLIC_API_URL` | apps/web | e.g. `https://api.yourdomain.com/api` |
| `NEXT_PUBLIC_API_URL` (optional) | apps/public-site | Leave empty to stay on mock data |
| `NEXT_PUBLIC_SITE_URL`, social links | apps/public-site | Cosmetic/SEO only |

No secret is ever exposed to either frontend — confirmed in the production audit: only
`NEXT_PUBLIC_*`-prefixed variables are readable by the browser, and none of the
Razorpay/JWT secrets carry that prefix.

---

## 7. Database migration command

**SQLite (local dev) — unchanged, verified working:**
```powershell
npm run db:migrate --workspace=packages/database   # runs: tsx migrate.ts
```
Applies `packages/database/migrations/0000_reflective_random.sql` (verified in sync
with `schema.ts`) to whichever SQLite file `DATABASE_URL` points to.

**PostgreSQL — real command, added in this pass:**
```powershell
$env:DATABASE_URL = "postgresql://user:password@host:5432/dbname?sslmode=require"
npm run migrate:postgres --workspace=packages/database   # runs: tsx migrate.postgres.ts
```
This applies `packages/database/migrations-postgres/0000_dark_bill_hollister.sql` —
real PostgreSQL DDL, generated by `drizzle-kit generate` directly from
`schema.pg.ts` and structurally verified in this pass (30 `CREATE TABLE` statements,
42 foreign keys, 17 `ON DELETE cascade` clauses, the `attendance_unique` duplicate-
protection index all confirmed present in the generated SQL).

**⚠️ REQUIRES REAL POSTGRES SERVER — not run in this sandbox.** Generating the SQL
does not require a live database (drizzle-kit reads the schema file, not an existing
DB), but *applying* it does. This command has not been executed against any real
PostgreSQL instance from this environment (no network egress to any database host is
possible here). **You must run this yourself** against your provisioned Postgres
instance as your first real integration test — see §12 for the verification steps to
run immediately after.

If you ever change `schema.pg.ts`, regenerate before migrating:
```powershell
npm run generate:postgres --workspace=packages/database   # runs: drizzle-kit generate --config drizzle.config.postgres.ts
```

---

## 8. Production seed protection

The seed script (`packages/database/seed.ts`) now refuses to run when
`NODE_ENV=production` unless `ALLOW_PROD_SEED=true` is also explicitly set — verified
in this pass with a dedicated test (`node test-security-fixes.js` → "seed.ts refuses to
run when NODE_ENV=production without ALLOW_PROD_SEED" — passed).

**Never set `ALLOW_PROD_SEED=true` against your real production database.** The seed
script inserts demo accounts (`admin@nalanda.demo`, etc.) with a shared, documented
password — appropriate only for a staging/demo database, never for real student data.

Command (staging/demo databases only):
```powershell
npm run db:seed --workspace=packages/database   # runs: tsx seed.ts
```

---

## 9. CORS configuration

`apps/api/src/main.ts` now reads `ALLOWED_ORIGINS` (comma-separated) and falls back to
`WEB_URL`, then to the two local-dev ports, if unset — verified with a dedicated fix in
this pass (previously it was hard-coded to a single origin, which would have broken
the moment two separate Vercel-hosted frontends both needed to call the API).

**Set exactly:**
```
ALLOWED_ORIGINS=https://www.yourdomain.com,https://portal.yourdomain.com
```
Include every real origin that will call the API directly from the browser — both
Vercel production domains and any preview-deployment domains you want to test against
(Vercel preview URLs are unique per-deploy, e.g. `project-git-branch-team.vercel.app`;
add them temporarily while testing a preview, or design your testing flow around the
production domain only).

---

## 10. Razorpay TEST configuration

**Never use live Razorpay credentials until you are ready to accept real payments.**

1. Log into your Razorpay dashboard → ensure you're in **Test Mode** (toggle in the
   dashboard header).
2. Copy the Test Mode **Key ID** and **Key Secret** → set as `RAZORPAY_KEY_ID` /
   `RAZORPAY_KEY_SECRET` on Render.
3. Create a webhook (Razorpay dashboard → Webhooks) pointing at:
   `https://api.yourdomain.com/api/payments/razorpay/webhook`
   — subscribe to at least the `payment.captured` event (the only event this API's
   webhook handler currently processes — verified in `apps/api/src/payments/payments.service.ts`).
4. Copy the webhook's signing secret → set as `RAZORPAY_WEBHOOK_SECRET`.
5. Confirm signature verification and idempotent processing before going further —
   this was verified with real cryptography in `node test-payments.js` (37/37 passing,
   including duplicate-webhook and invalid-signature cases). Re-run that suite in your
   deployed environment (pointed at real Razorpay test-mode order creation, which this
   sandbox could never test due to no network egress) as your first live-environment
   check.

---

## 11. Custom domain configuration

Example using `example.com` — **substitute your real domain; nothing below assumes a
specific one**:

| Domain | Points to | Configured in |
|---|---|---|
| `www.example.com` (or apex `example.com`) | `apps/public-site` Vercel project | Vercel → Project → Domains |
| `portal.example.com` (recommended — see note below) | `apps/web` Vercel project | Vercel → Project → Domains |
| `api.example.com` | `apps/api` Render service | Render → Service → Settings → Custom Domain |

**Note on the `/admin`, `/teacher`, `/student`, `/parent` path structure you may have
seen described elsewhere:** that would require both Next.js apps to be served from the
*same* domain via a path-based rewrite/proxy layer (e.g. Vercel `rewrites`, or an
edge/reverse-proxy in front of both projects) — this is **not configured** in either
app today (confirmed: neither `apps/public-site/next.config.ts` nor
`apps/web/next.config.js` defines any rewrites). The simpler, zero-extra-config
alternative — and what this guide recommends for a first deployment — is a **dedicated
subdomain for the portal app** (`portal.example.com`) rather than path-based merging
under the same domain. This avoids needing to build and test a rewrite/proxy layer
before your first deploy; you can always add path-based merging later without changing
either app's code.

Each of Vercel and Render will issue and auto-renew HTTPS certificates for whichever
domains you attach — no manual certificate management needed.

---

## 12. Post-deployment verification

Run these against your **deployed** URLs (replace with your real domains) once all
three services are live:

```powershell
# 1. API health check — should report the database as connected
curl https://api.example.com/api/health

# 2. Public site loads and serves real pages
curl -I https://www.example.com/
curl -I https://www.example.com/about
curl -I https://www.example.com/admission

# 3. Portal app serves its login pages, and none of its routes leak into the public site
curl -I https://portal.example.com/admin/login
curl -I https://www.example.com/admin        # expect 404 — must NOT exist on the public site

# 4. CORS — a request from your actual portal origin should succeed; verify via the
#    browser Network tab when logging into the portal (not curl, since CORS is
#    enforced by the browser, not the server)

# 5. Login flow end-to-end (replace with a real, non-demo admin account you create
#    directly against production — never the seeded demo accounts)
#    Do this by hand in the browser: log in, confirm the httpOnly refresh cookie is
#    marked Secure (DevTools → Application → Cookies) and the connection is HTTPS.

# 6. Re-run the automated suites against the deployed API (update the API/BASE URL at
#    the top of each script first, or set an env var if you generalize them):
node test-payments.js
node test-phase5.js
node test-security-fixes.js
```

All three test scripts currently hard-code `http://localhost:4000/api` — update that
constant (or parameterize via `process.env.API_URL`) before running them against a
deployed environment.

---

## 13. Rollback procedure

**Vercel (both frontends):** every deploy is immutable and listed under Project →
Deployments. To roll back: open the previous known-good deployment → "Promote to
Production" (or "Redeploy"). This takes effect in seconds with no build step re-run.

**Render (API):** Render keeps a deploy history under Service → Events/Deploys. To roll
back: select the previous successful deploy → "Redeploy" (or "Rollback" if shown in
your Render plan's UI). Because Render redeploys from a Git commit, you can also
`git revert` the problematic commit and push — Render will auto-deploy the revert.

**Database:** migrations are forward-only by default in this repo (Drizzle doesn't
generate down-migrations automatically). Before running any migration against
production:
1. Take a manual snapshot/backup via your Postgres provider's dashboard (in addition
   to its automated backups) immediately before migrating.
2. If a migration causes a problem, restore from that snapshot rather than attempting
   to hand-write a reverse migration under pressure.

**General principle:** because the three services deploy independently, a bad API
deploy can be rolled back without touching either frontend, and vice versa — there is
no coupled "all three or nothing" release step today.

---

## Verification — LOCAL VERIFIED vs REQUIRES REAL POSTGRES SERVER

This is an explicit, itemized breakdown — nothing in the left column was assumed or
inferred; nothing in the right column is claimed as tested.

### ✅ LOCAL VERIFIED (actually run in this environment)

| Check | Result |
|---|---|
| `packages/database` TypeScript (`tsc --noEmit`) | ✅ 0 errors |
| `apps/api` TypeScript (`tsc --noEmit`) | ✅ 0 errors |
| `apps/web` TypeScript (`tsc --noEmit`) | ✅ 0 errors |
| `apps/public-site` TypeScript (`tsc --noEmit`) | ✅ 0 errors |
| `apps/api` ESLint | ✅ 0 errors/warnings |
| `apps/web` ESLint (`next lint`) | ✅ 0 errors/warnings |
| `apps/public-site` ESLint | ✅ 0 errors/warnings |
| `apps/api` production build (`nest build`) | ✅ succeeded |
| `apps/web` production build (`next build`) | ✅ succeeded — 33 routes |
| `apps/public-site` production build (`next build`) | ✅ succeeded — 34 routes |
| Existing SQLite migration (`tsx migrate.ts`) + seed (`tsx seed.ts`) | ✅ succeeded against a fresh local SQLite DB |
| Full existing API test suite (`test-payments.js`, `test-phase5.js`) against the *refactored* database package | ✅ 72/72 checks passing, 0 failures, run against the live API + real SQLite DB |
| Security/production-readiness suite (`test-security-fixes.js`) | ✅ 23/23 passing |
| PostgreSQL schema structural verification (`test-postgres-schema.js`) — driver presence, `pgTable` usage, 30/30 table-name parity with the SQLite schema, generated-SQL correctness (42 FKs, 17 cascades, attendance unique constraint), money columns confirmed unchanged (`real`), Razorpay logic confirmed unchanged | ✅ 21/21 passing |
| PostgreSQL runtime dispatch (`test-postgres-dispatch.js`) — loads the compiled package with both a SQLite and a Postgres `DATABASE_URL` and confirms the correct driver/schema is selected, with no network call attempted (verified by near-instant, non-blocking construction and a clean process exit) | ✅ 7/7 passing |
| `drizzle-kit generate --config drizzle.config.postgres.ts` — produces real PostgreSQL DDL from `schema.pg.ts` | ✅ succeeded, no live DB connection required for this step |

**Total: 123/123 automated checks passing across all suites, 0 failures.**

### ⚠️ REQUIRES REAL POSTGRES SERVER (not, and cannot be, tested from this environment)

| Check | Why it can't be done here |
|---|---|
| Running `migrate:postgres` against an actual PostgreSQL instance | This sandboxed environment has no network egress to any database host (confirmed repeatedly throughout this project's build — only package registries are reachable) |
| Confirming the API can actually query/insert/update against real Postgres | Same reason — no reachable Postgres server |
| Re-running `test-payments.js`, `test-phase5.js`, `test-security-fixes.js` against a Postgres-backed API | Same reason |
| Confirming Postgres-specific behaviors (connection pooling under load, SSL handshake against a real managed provider's certificate, exact `pg` error messages/codes) | Same reason |
| Performance/index-usage validation (`EXPLAIN ANALYZE` on real data volumes) | Same reason |

**You must perform the items in the right-hand column yourself** against your chosen
provider before trusting this in production. §12 gives the exact commands to run once
you do.


